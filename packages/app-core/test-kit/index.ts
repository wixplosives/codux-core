import type { FSApi, IAppManifest, IReactApp } from '@wixc3/app-core';
import { createBaseCjsModuleSystem, ICommonJsModuleSystem } from '@file-services/commonjs';
import { createMemoryFs, IMemFileSystem } from '@file-services/memory';
import { createRequestResolver } from '@file-services/resolve';
import path from '@file-services/path';
import { IDirectoryContents } from '@file-services/types';
export interface AppDefDriverOptions<T> {
    app: IReactApp<T>;
    initialFiles: Record<
        string,
        {
            contents: string;
            exports: Set<string>;
        }
    >;
    /**
     * @default false
     */
    winFs?: boolean;
    /**
     * @default '/app-def.ts'
     */
    appDefFilePath?: string;
    /**
     * @default '/'
     */
    projectPath?: string;
}
type DirListenerObj = { cb: (files: string[]) => void; dirPath: string };
export class AppDefDriver<T> {
    private fs: IMemFileSystem;
    private moduleSystem: ICommonJsModuleSystem;
    private dirListeners: Array<DirListenerObj> = [];
    private fileListeners: Record<string, Set<(contents: string | null) => void>> = {};
    private exportsListeners: Record<string, Set<(exportNames: string[]) => void>> = {};
    private lastManifest: IAppManifest<T> | null = null;
    private disposeApp?: () => void;
    constructor(private options: AppDefDriverOptions<T>) {
        const files: IDirectoryContents = {};
        for (const [filePath, { contents }] of Object.entries(options.initialFiles)) {
            files[filePath] = contents;
        }
        this.fs = createMemoryFs(files);
        const resolver = createRequestResolver({fs: this.fs});
        this.moduleSystem = createBaseCjsModuleSystem({
            dirname: this.fs.dirname,
            readFileSync: (filePath) => {
                const fileContents = this.fs.readFileSync(filePath, {encoding: 'utf8'});
                if (typeof fileContents !== 'string') {
                    throw new Error(`No content for: ${filePath}`);
                }
                return fileContents;
            },
            resolveFrom(contextPath: string, request: string) {
                if (options.evaluatedNodeModules[request]) {
                    return request;
                }
                const resolved = resolver(contextPath, request);
                return resolved.resolvedFile
            },
            globals: {},
        });
    }

    async init() {
        const { dispose, manifest } = await this.options.app.prepareApp({
            fsApi: this.fsApi,
            onManifestUpdate: (manifest) => {
                this.lastManifest = manifest;
            },
        });
        this.lastManifest = manifest;
        this.disposeApp = dispose;
        return manifest;
    }
    addOrUpdateFile(filePath: string, contents: string) {
        const existingFile = !!this.fs.existsSync(filePath);
        this.fs.writeFileSync(filePath, contents);
        
        if (!existingFile) {
            for (const listener of this.dirListeners) {
                if (filePath.startsWith(listener.dirPath)) {
                    listener.cb(this.listNestedPaths(listener.dirPath));
                }
            }
        } else {
            this.moduleSystem.moduleCache.delete(filePath);
        }
        const fileListeners = this.fileListeners[filePath];
        if (fileListeners) {
            for (const listener of fileListeners) {
                listener(contents);
            }
        }
        const exportsListeners = this.exportsListeners[filePath];
        if (exportsListeners) {
            let moduleExports: string[] = [];
            try {
                const module = this.moduleSystem.requireModule(filePath);
                moduleExports = Object.keys(module as Record<string, unknown>);
            } catch (e) {
                // unable to require module - no exports
                const errMsg = e instanceof Error ? e.message : String(e);
                throw new Error(`error requiring module ${filePath}: ${errMsg}`);
            }
            for (const listener of exportsListeners) {
                listener(moduleExports);
            }
        }
    }
    getManifest() {
        return this.lastManifest;
    }
    getNewPageInfo(requestedURI: string) {
        return this.options.app.getNewPageInfo!({
            fsApi: this.fsApi,
            manifest: this.lastManifest!,
            requestedURI,
        });
    }
    getMovePageInfo(movedFilePath: string, requestedURI: string) {
        return this.options.app.getMovePageInfo!({
            fsApi: this.fsApi,
            manifest: this.lastManifest!,
            requestedURI,
            movedFilePath,
        });
    }
    dispose() {
        this.disposeApp?.();
    }
    private fsApi: FSApi = {
        appDefFilePath: this.options.appDefFilePath || '/app-def.ts',
        projectPath: this.options.projectPath || '/',
        path: (this.options.winFs ? (path as { win32: FSApi['path'] }).win32 : path.posix) as FSApi['path'],
        watchDirectory: (dirPath: string, cb) => {
            const listener: DirListenerObj = {
                cb,
                dirPath,
            };
            this.dirListeners.push(listener);
            return {
                stop: () => {
                    this.dirListeners = this.dirListeners.filter((l) => l !== listener);
                },
                filePaths: Promise.resolve(this.listNestedPaths(dirPath)),
            };
        },
        watchFile: (filePath: string, cb) => {
            const listeners = this.fileListeners[filePath] || new Set();
            listeners.add(cb);
            this.fileListeners[filePath] = listeners;
            return {
                stop: () => {
                    listeners.delete(cb);
                },
                contents: Promise.resolve(this.fs.readFileSync(filePath, {encoding: 'utf8'}) ?? null),
            };
        },
        watchFileExports: (filePath: string, cb) => {
            const listeners = this.exportsListeners[filePath] || new Set();
            listeners.add(cb);
            this.exportsListeners[filePath] = listeners;

            let moduleExports: string[] = [];
            try {
                const module = this.moduleSystem.requireModule(filePath);
                moduleExports = Object.keys(module as Record<string, unknown>);
            } catch (e){
                const errMsg = e instanceof Error ? e.message : String(e);
                throw new Error(`error requiring module ${filePath}: ${errMsg}`);
            }
            
            return {
                stop: () => {
                    listeners.delete(cb);
                },
                exportNames: Promise.resolve(moduleExports),
            };
        },
    };
    private listNestedPaths(dirPath: string) {
        const nestedPaths: string[] = [];
        for (const file of this.fs.readdirSync(dirPath)) {
            const filePath = path.join(dirPath, file);
            if (this.fs.statSync(filePath).isDirectory()) {
                nestedPaths.push(...this.listNestedPaths(filePath));
            } else {
                nestedPaths.push(filePath);
            }
        }
        return nestedPaths;
}

}



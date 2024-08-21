import type { FSApi, IAppManifest, IReactApp } from '@wixc3/app-core';
import path from '@file-services/path';
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
    private files: Record<
        string,
        {
            contents: string;
            exports: Set<string>;
        }
    >;
    private dirListeners: Array<DirListenerObj> = [];
    private fileListeners: Record<string, Set<(contents: string | null) => void>> = {};
    private exportsListeners: Record<string, Set<(exportNames: string[]) => void>> = {};
    private lastManifest: IAppManifest<T> | null = null;
    private disposeApp?: () => void;
    constructor(private options: AppDefDriverOptions<T>) {
        this.files = { ...options.initialFiles };
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
    addOrUpdateFile(filePath: string, contents: string, exports: Set<string>) {
        const existingFile = !!this.files[filePath];
        this.files[filePath] = { contents, exports };
        if (!existingFile) {
            for (const listener of this.dirListeners) {
                if (filePath.startsWith(listener.dirPath)) {
                    listener.cb(Object.keys(this.files).filter((filePath) => filePath.startsWith(listener.dirPath)));
                }
            }
        }
        const fileListeners = this.fileListeners[filePath];
        if (fileListeners) {
            for (const listener of fileListeners) {
                listener(contents);
            }
        }
        const exportsListeners = this.exportsListeners[filePath];
        if (exportsListeners) {
            for (const listener of exportsListeners) {
                listener([...exports]);
            }
        }
    }
    getManifest() {
        return this.lastManifest;
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
                filePaths: Promise.resolve(Object.keys(this.files).filter((filePath) => filePath.startsWith(dirPath))),
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
                contents: Promise.resolve(this.files[filePath]?.contents || null),
            };
        },
        watchFileExports: (filePath: string, cb) => {
            const listeners = this.exportsListeners[filePath] || new Set();
            listeners.add(cb);
            this.exportsListeners[filePath] = listeners;
            return {
                stop: () => {
                    listeners.delete(cb);
                },
                exportNames: Promise.resolve([...(this.files[filePath]?.exports || [])]),
            };
        },
    };
}

import { FSApi, IAppManifest, IReactApp } from '@wixc3/app-core';
import path from 'path';
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

export class AppDefDriver<T> {
    constructor(private options: AppDefDriverOptions<T>) {}
    private lastManifest: IAppManifest | null = null;
    private disposeApp?: () => void;
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
        watchDirectory: (dirPath: string) => {
            return {
                stop: () => {},
                filePaths: Promise.resolve(
                    Object.keys(this.options.initialFiles).filter((filePath) => filePath.startsWith(dirPath)),
                ),
            };
        },
        watchFile: (filePath: string) => {
            return {
                stop: () => {},
                contents: Promise.resolve(this.options.initialFiles[filePath]?.contents || null),
            };
        },
        watchFileExports: (filePath: string) => {
            return {
                stop: () => {},
                exportNames: Promise.resolve([...(this.options.initialFiles[filePath]?.exports || [])]),
            };
        },
    };
}

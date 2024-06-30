import { IDirectoryContents, IFileSystem } from '@file-services/types';
import { IRenderableMetadataBase } from '@wixc3/board-core';

export interface DirChildInfo {
    isFile: boolean;
    name: string;
    fullPath: string;
}

export interface StaticRoutePart {
    kind: 'static';
    text: string;
}

export interface NamedOption {
    name: string;
    text: string;
}
export interface DynamicRoutePart {
    kind: 'dynamic';
    name: string;
}
export interface RouteInfo<T = unknown> {
    isPage?: boolean;
    path: Array<StaticRoutePart | DynamicRoutePart>;
    pageModule: string;
    pageExportName?: string;
    parentLayouts?: Array<{
        layoutModule: string;
        layoutExportName?: string;
    }>;
    extraData: T;
}
export interface IReactAppManifest<T = unknown> {
    routes: RouteInfo<T>[];
}

export interface IReactAppProps<T = unknown> {
    manifest: IReactAppManifest<T>;
    requireModule: (filePath: string) => {
        moduleResults: Promise<IResults<unknown>>;
        dispose: () => void;
    };
    uri: string;
    setUri: (uri: string) => void;
}

export interface IAppManifest {
    routes: RouteInfo[];
}

export interface IPrepareAppOptions {
    onAppUpdate: (appProps: IAppManifest) => void;
    fs: IFileSystem;
}
export interface IGetNewPageInfoOptions<T> {
    fs: IFileSystem;
    wantedPath: RouteInfo['path'];
    manifest: IReactAppManifest<T>;
}
export interface IReactApp<T = unknown> extends IRenderableMetadataBase {
    /** An image URL to be used as the board's thumbnail. */
    cover?: string;

    /** A list of tags. */
    tags?: string[];

    App: React.ComponentType<IReactAppProps<T>>;

    setProps: (props: IReactAppProps<T>) => void;
    prepareApp: (options: IPrepareAppOptions) => Promise<{
        manifest: IReactAppManifest<T>;
        dispose: () => void;
    }>;
    getNewPageInfo?: (options: IGetNewPageInfoOptions<T>) => {
        pagePath: string;
        contents: string | IDirectoryContents;
    };
    getRouteUrls?: (route: RouteInfo<T>) => string[];
    bookmarks?: string[];
}

export interface IResults<T> {
    status: 'ready' | 'invalid' | 'disposed';
    results: T | null;
    errorMessage?: string;
}

export type OmitReactApp<T extends IReactApp<D>, D> = Omit<T, 'render' | 'setupStage' | 'setProps'>;

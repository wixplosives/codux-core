import type React from 'react';

/**
 * deeply watches a directory for changes and calls the callback with the file paths in the directory
 * @param path the path to watch
 * @param callback a function that will be called with the contents of the directory
 * @returns a function that will stop watching the directory
 */
export type WatchDirectory = (
    path: string,
    callback: (filePaths: string[]) => void,
) => {
    stop: () => void;
    filePaths: Promise<string[]>;
};
/**
 * watches a file for changes and calls the callback with the contents of the file
 * @param path the path to watch
 * @param callback a function that will be called with the contents of the file
 * @returns a function that will stop watching the file
 */
export type WatchFile = (
    path: string,
    callback: (contents: string | null) => void,
) => {
    stop: () => void;
    contents: Promise<string | null>;
};

/**
 * watches a file for changes and calls the callback with the list of names exported from the file
 * @param path the path to watch
 * @param callback a function that will be called with the list of names exported from the file
 * @returns a function that will stop watching the file
 */
export type WatchFileExports = (
    path: string,
    callback: (exportNames: string[]) => void,
) => {
    stop: () => void;
    exportNames: Promise<string[]>;
};
export interface PathApi {
    /**
     * Join all arguments together and normalize the resulting path.
     * Arguments must be strings. In v0.8, non-string arguments were silently ignored. In v0.10 and up, an exception is thrown.
     *
     * @param paths paths to join.
     */
    join(...paths: string[]): string;

    /**
     * Return the directory name of a path. Similar to the Unix dirname command.
     *
     * @param p the path to evaluate.
     */
    dirname(p: string): string;

    /**
     * Return the last portion of a path. Similar to the Unix basename command.
     * Often used to extract the file name from a fully qualified path.
     *
     * @param p the path to evaluate.
     * @param ext optionally, an extension to remove from the result.
     */
    basename(p: string, ext?: string): string;

    /**
     * Return the extension of the path, from the last '.' to end of string in the last portion of the path.
     * If there is no '.' in the last portion of the path or the first character of it is '.', then it returns an empty string
     *
     * @param p the path to evaluate.
     */
    extname(p: string): string;

    /**
     * the separator for the os
     */
    sep: string;
}
export interface FSApi {
    watchDirectory: WatchDirectory;
    watchFile: WatchFile;
    watchFileExports: WatchFileExports;
    projectPath: string;
    appDefFilePath: string;
    path: PathApi;
}

export interface IReactApp<T = unknown> {
    /**
     * Should be isomorphic, should return the same result on the server and in a web worker
     * returns the app manifest containing a list of routes for the app.
     *
     * should call onManifestUpdate when the manifest is updated
     */
    prepareApp: (options: IPrepareAppOptions) => Promise<{
        manifest: IAppManifest<T>;
        dispose: () => void;
    }>;

    /**
     *
     * Should be isomorphic, should return the same result on the server and in a web worker
     *
     * returns the information needed to create a new page
     *
     */
    getNewPageInfo?: (options: IGetNewPageInfoOptions<T>) => {
        isValid: boolean;
        errorMessage?: string;
        warningMessage?: string;
        pageModule: string;
        newPageSourceCode: string;
        newPageRoute?: RouteInfo<T>;
        routingPattern?: RoutingPattern;
    };

    /**
     * Should be isomorphic, should return the same result on the server and in a web worker
     *
     * returns the information needed to move a page
     */
    getMovePageInfo?: (options: IMovePageInfoOptions<T>) => {
        isValid: boolean;
        errorMessage?: string;
        warningMessage?: string;
        pageModule: string;
        newPageRoute?: RouteInfo<T>;
        routingPattern?: RoutingPattern;
    };
    /**
     * can be called on the server or in a web worker
     * allows the app to call server methods
     */
    callServerMethod?: (
        options: ICallServerMethodOptions,
        filePath: string,
        methodName: string,
        args: unknown[],
    ) => Promise<unknown>;

    /**
     * can be called on the server or in a web worker
     * allows codux to get the static routes for a given file path ( needed to allow navigation to a dynamic page )
     */
    getStaticRoutes?: (options: ICallServerMethodOptions, forRouteAtFilePath: string) => Promise<unknown>;
    /**
     * can be called on the server or in a web worker
     * allows codux to get the static routes for a given file path ( needed to allow navigation to a dynamic page )
     */
    hasGetStaticRoutes?: (options: ICallServerMethodOptions, forRouteAtFilePath: string) => Promise<boolean>;


    App: React.ComponentType<IReactAppProps<T>>;
    /**
     * Renders the App into an HTML element
     *
     * @returns a cleanup function
     */
    render: (targetElement: HTMLElement, props: IReactAppProps<T>) => Promise<() => void>;
}
export interface IAppManifest<T = unknown> {
    routes: RouteInfo<T>[];
    homeRoute?: RouteInfo<T>;
    errorRoutes?: RouteInfo<T>[];
}

export interface RouteInfo<T = unknown> {
    pageModule: string;
    pageExportName?: string;
    /**
     * any parent layouts that should be editable in codux above this page
     */
    parentLayouts?: Array<{
        layoutModule: string;
        layoutExportName?: string;
        editablePoints?: EditablePointOfInterest[];
    }>;

    /**
     * signifies that a dynamic page has the capability to provide its static routes
     */
    hasGetStaticRoutes?: boolean;

 
    /**
     * a list of export names of the page that should be editable
     * if the page is a function, the UI will edit its return value
     * if the page is an object, the UI will edit the object
     *
     * if a schema is not provided, the UI will try to infer the schema from the code
     */
    editablePoints?: EditablePointOfInterest[];
    /**
     * any extra data that should be passed to the App component
     */
    extraData: T;
    path: Array<StaticRoutePart | DynamicRoutePart>;
    /**
     * readable (and editable) text representation of the path
     */
    pathString: string;
}

export interface StaticRoutePart {
    kind: 'static';
    text: string;
}

export interface DynamicRoutePart {
    kind: 'dynamic';
    isOptional?: boolean;
    isCatchAll?: boolean;
    name: string;
}

export interface IReactAppProps<T = unknown> {
    manifest: IAppManifest<T>;
    importModule: DynamicImport;
    uri: string;
    setUri: (uri: string) => void;
    onCaughtError: ErrorReporter;
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>;
}

export type ErrorReporter = (errorBoundry: { filePath: string; exportName: string }) => void;

export type DynamicImport = (
    filePath: string,
    onModuleChange?: (updatedModule: IResults<unknown>) => void,
) => {
    moduleResults: Promise<IResults<unknown>>;
    dispose: () => void;
};

export interface IPrepareAppOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onManifestUpdate: (appProps: IAppManifest<any>) => void;
    fsApi: FSApi;
}
export interface ICallServerMethodOptions {
    fsApi: FSApi;
    importModule: DynamicImport;
}
export interface IGetNewPageInfoOptions<T> {
    fsApi: FSApi;
    requestedURI: string;
    manifest: IAppManifest<T>;
}

export type RoutingPattern = 'file' | 'folder(route)' | 'folder(index)';

export interface IMovePageInfoOptions<T> extends IGetNewPageInfoOptions<T> {
    movedFilePath: string;
}
export interface EditablePointOfInterest {
    title: string;
    exportName: string;
}

export interface IResults<T> {
    status: 'ready' | 'invalid' | 'disposed' | 'loading';
    results: T | null;
    errorMessage?: string;
}

export type OmitReactApp<T extends IReactApp<D>, D> = Omit<T, 'render' | 'setupStage' | 'setProps'>;

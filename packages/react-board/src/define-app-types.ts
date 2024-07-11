import { IFileSystem } from '@file-services/types';

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
        pageModule: string;
        newPageSourceCode: string;
    };

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
    homeRoute: PageInfo<T>;
    errorRoute?: PageInfo<T>;
}

export interface PageInfo<T = unknown> {
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
}

export interface RouteInfo<T = unknown> extends PageInfo<T> {
    path: Array<StaticRoutePart | DynamicRoutePart>;
}

export interface StaticRoutePart {
    kind: 'static';
    text: string;
}

export interface DynamicRoutePart {
    kind: 'dynamic';
    name: string;
}

export interface IReactAppProps<T = unknown> {
    manifest: IAppManifest<T>;
    requireModule: RequireModule;
    uri: string;
    setUri: (uri: string) => void;
}

export type RequireModule = (
    filePath: string,
    onModuleChange?: (updatedModule: IResults<unknown>) => void,
) => {
    moduleResults: Promise<IResults<unknown>>;
    dispose: () => void;
};

export interface IPrepareAppOptions {
    onManifestUpdate: (appProps: IAppManifest) => void;
    fs: IFileSystem;
}
export interface IGetNewPageInfoOptions<T> {
    fs: IFileSystem;
    wantedPath: RouteInfo['path'];
    manifest: IAppManifest<T>;
}

export interface EditablePointOfInterest {
    title: string;
    exportName: string;
    /** JSON SCHEMA for the editable point, for a method, the schema for the return value */
    schema?: any;
}

export interface IResults<T> {
    status: 'ready' | 'invalid' | 'disposed';
    results: T | null;
    errorMessage?: string;
}

export interface TitledURI {
    name: string;
    uri: string;
}

export type OmitReactApp<T extends IReactApp<D>, D> = Omit<T, 'render' | 'setupStage' | 'setProps'>;

import {
    defineApp,
    type IAppManifest,
    type IResults,
    type RouteInfo,
    type DynamicImport,
    IReactAppProps,
    DynamicRoutePart,
    StaticRoutePart,
} from '@wixc3/app-core';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';
import { LoaderFunction } from '@remix-run/node';
import {
    aRoute,
    filePathToLayoutMatching,
    filePathToReadableUri,
    filePathToRouteId,
    ParentLayoutWithExtra,
    pathToRemixRouterUrl,
    readableStringToRoutePath,
    RouteExtraInfo,
    routePartsToRoutePath,
    routePathId,
    toCamelCase,
} from './remix-app-utils';

export interface IDefineRemixAppProps {
    appPath: string;
    bookmarks?: string[];
    routingPattern?: 'file' | 'folder(route)' | 'folder(index)';
}

export default function defineRemixApp({ appPath }: IDefineRemixAppProps) {
    return defineApp<RouteExtraInfo>({
        App: ({ manifest, importModule, setUri, uri }: IReactAppProps<RouteExtraInfo>) => {
            const App = useMemo(
                () => manifestToRouter(manifest, importModule, setUri),
                [manifest, importModule, setUri],
            );

            return (
                <>
                    <App
                        initialEntries={[
                            {
                                pathname: '/' + uri,
                                search: '',
                                hash: '',
                            },
                        ]}
                    />
                </>
            );
        },
        getNewPageInfo({ fsApi, requestedURI, manifest }) {
            const appDir = fsApi.path.join(fsApi.path.dirname(fsApi.appDefFilePath), appPath);
            const routeDir = fsApi.path.join(appDir, 'routes');
            const varNames = new Set<string>();
            const wantedPath = readableStringToRoutePath(requestedURI);
            if (requestedURI.length === 0 && manifest.homeRoute) {
                return {
                    isValid: false,
                    errorMessage: 'Home route already exists at ' + manifest.homeRoute.pageModule,
                    pageModule: manifest.homeRoute.pageModule,
                    newPageSourceCode: '',
                    newPageRoute: manifest.homeRoute,
                };
            }
            const wantedPathId = routePathId(wantedPath);
            const existingRoute = manifest.routes.find((route) => routePathId(route.path) === wantedPathId);
            if (existingRoute) {
                return {
                    isValid: false,
                    errorMessage: 'Route already exists at file path: ' + existingRoute.pageModule,
                    pageModule: existingRoute.pageModule,
                    newPageSourceCode: '',
                    newPageRoute: existingRoute,
                };
            }

            const pageFileName = wantedPath
                .map((part) => {
                    if (part.kind === 'static') {
                        return part.text;
                    }
                    varNames.add(part.name);
                    return `$${part.name}`;
                })
                .join('.');
            const pageName = toCamelCase(pageFileName);
            const pageModule = fsApi.path.join(routeDir, pageFileName, 'route.tsx');
            const newPageSourceCode =
                varNames.size === 0
                    ? `
    import React from 'react';
    export default function ${pageName}() {
        return <div>${pageFileName}</div>;
    }
            `
                    : `
    import React from 'react';
    import { useLoader } from '../router-example';
    
    export const loader = async (params: { 
            ${[...varNames].map((name) => `${name}: string`).join(',\n')}
         }) => {
        return params;
    };
    
    const ${pageName} = () => {
        const params = useLoader<typeof loader>();
        return <div>
            ${[...varNames].map((name) => `<div>${name}: {params.${name}}</div>`).join('\n')}
        </div>;
    };
    export default ${pageName};
              
                    
                    `;

            return {
                isValid: true,
                error: '',
                newPageSourceCode,
                pageModule,
                newPageRoute: {
                    pageModule,
                    pageExportName: 'default',
                    extraData: {
                        parentLayouts: [],
                        routeId: filePathToRouteId(appDir, pageModule),
                    },
                    path: wantedPath,
                    pathString: requestedURI,
                },
            };
        },

        async prepareApp({ fsApi, onManifestUpdate }) {
            /**
             * in remix about/route.tsx wins over about/index.tsx which in turn wins over about.tsx
             */

            const appDefDir = fsApi.path.dirname(fsApi.appDefFilePath);
            const appDir = fsApi.path.join(appDefDir, appPath);
            const rootPath = fsApi.path.join(appDir, 'root.tsx');
            const routeDir = fsApi.path.join(appDir, 'routes');

            // /product -> product.tsx product/route._index.tsx
            // /product/$ -> product/$.tsx product/$/route.tsx
            const compute = async (filesInDir: string[], rootExportNames: string[]) => {
                const routeDirLength = routeDir.length + 1;
                const rootLayouts: RouteExtraInfo['parentLayouts'] = [
                    {
                        id: filePathToRouteId(appDir, rootPath),
                        layoutExportName: 'default',
                        layoutModule: rootPath,
                        path: '/',
                    },
                ];
                if (rootExportNames.includes('Layout')) {
                    rootLayouts.unshift({
                        id: 'rootLayout',
                        layoutExportName: 'Layout',
                        layoutModule: rootPath,
                        path: '/',
                    });
                }
                const filesByRoute = filesInDir.reduce((acc, fullPath) => {
                    const name = fsApi.path.basename(fullPath);
                    const pathInRoutesDir = fullPath.slice(routeDirLength);

                    const dirParts = pathInRoutesDir.split(fsApi.path.sep);
                    if (dirParts.length === 1 && name.endsWith('.tsx')) {
                        if (name === '_index.tsx') {
                            if (!acc.has('/')) {
                                acc.set('/', {
                                    files: [],
                                    path: [],
                                    readableName: '',
                                });
                            }
                            acc.get('/')?.files.push(fullPath);
                        } else {
                            const fileName = fsApi.path.basename(fullPath, '.tsx');
                            const routeParts = fileName.split('.');
                            const routePath = routePartsToRoutePath(routeParts);
                            const routeUrlId = routePathId(routePath);
                            const routePathString = filePathToReadableUri(pathInRoutesDir, fsApi.path) || '';
                            if (!acc.has(routeUrlId)) {
                                acc.set(routeUrlId, {
                                    files: [],
                                    path: routePath,
                                    readableName: routePathString,
                                });
                            }
                            acc.get(routeUrlId)?.files.push(fullPath);
                        }
                    } else if (
                        dirParts.length === 2 &&
                        (fullPath.endsWith(fsApi.path.sep + 'route.tsx') ||
                            fullPath.endsWith(fsApi.path.sep + 'index.tsx'))
                    ) {
                        const routeParts = dirParts[0].split('.');
                        const routePath = routePartsToRoutePath(routeParts);
                        const routeUrl = filePathToReadableUri(pathInRoutesDir, fsApi.path) || '';
                        const routeUrlId = routePathId(routePath);

                        if (!acc.has(routeUrlId)) {
                            acc.set(routeUrlId, {
                                files: [],
                                path: routePath,
                                readableName: routeUrl,
                            });
                        }
                        acc.get(routeUrlId)?.files.push(fullPath);
                    } else {
                        // TODO: handle such cases if exist in remix
                    }
                    return acc;
                }, new Map<string, { files: string[]; path: Array<StaticRoutePart | DynamicRoutePart>; readableName: string }>());

                const initialManifest: IAppManifest<RouteExtraInfo> = {
                    routes: [],
                    errorRoutes: [],
                };
                const sortedFilesByRoute = [...filesByRoute.entries()].sort(([, a], [, b]) =>
                    a.path.length === b.path.length
                        ? a.readableName.localeCompare(b.readableName)
                        : a.path.length - b.path.length,
                );
                const suspectedLayouts = new Map<string, ParentLayoutWithExtra>();
                const suspectedErrorRoutes = new Map<string, RouteInfo<RouteExtraInfo>>();
                if (rootExportNames.includes('ErrorBoundary')) {
                    const errorRoute = aRoute(
                        routeDir,
                        [],
                        rootPath,
                        {
                            parentLayouts: rootLayouts,
                            routeId: filePathToRouteId(appDir, rootPath),
                        },
                        fsApi.path,
                    );
                    suspectedErrorRoutes.set('', errorRoute);
                    initialManifest.errorRoutes!.push(errorRoute);
                }
                for (const [, value] of sortedFilesByRoute) {
                    if (value.path.length === 0) {
                        initialManifest.homeRoute = aRoute(
                            routeDir,
                            [],
                            value.files[0],
                            {
                                parentLayouts: rootLayouts,
                                routeId: filePathToRouteId(appDir, value.files[0]),
                            },
                            fsApi.path,
                        );
                    } else {
                        const routeFiles = value.files.sort((a, b) => a.length - b.length);

                        // TODO add change handler
                        const routeFilesWithExports = await Promise.all(
                            routeFiles.map(async (file) => {
                                const fileExportsWatcher = fsApi.watchFileExports(file, (exports) => exports);
                                const exports = await fileExportsWatcher.exportNames;
                                return {
                                    file,
                                    exports,
                                };
                            }),
                        );

                        let page: { file: string; exports: string[] } | undefined = undefined;
                        const parentLayouts: RouteExtraInfo['parentLayouts'] = [...rootLayouts];
                        const lastFile = routeFilesWithExports[routeFilesWithExports.length - 1].file;
                        const routeLayouts = filePathToLayoutMatching(lastFile.slice(routeDirLength), fsApi.path);
                        for (let i = 0; i < routeLayouts.length - 1; i++) {
                            const key = routeLayouts.slice(0, i + 1).join('/');
                            const layout = suspectedLayouts.get(key);
                            if (layout) {
                                parentLayouts.push(layout);
                            }
                        }

                        for (const { file, exports } of routeFilesWithExports) {
                            const routeId = filePathToRouteId(appDir, file);
                            const layoutMatchingId = filePathToLayoutMatching(
                                file.slice(routeDirLength),
                                fsApi.path,
                            ).join('/');
                            if (exports.includes('default')) {
                                const canBeLayout =
                                    !file.endsWith('._index.tsx') && !fsApi.path.dirname(file).endsWith('_index');
                                if (canBeLayout) {
                                    const layout: ParentLayoutWithExtra = {
                                        layoutModule: file,
                                        layoutExportName: 'default',
                                        id: routeId,
                                        path: pathToRemixRouterUrl(value.path),
                                    };
                                    suspectedLayouts.set(layoutMatchingId, layout);
                                    if (file !== lastFile) {
                                        parentLayouts.push(layout);
                                    }
                                }
                                page = { file, exports };
                            }
                        }

                        if (page) {
                            // TODO: collect parentlayouts and error routes
                            const route = aRoute(
                                routeDir,
                                value.path,
                                page.file,
                                {
                                    parentLayouts,
                                    routeId: filePathToRouteId(appDir, page.file),
                                },
                                fsApi.path,
                            );
                            initialManifest.routes.push(route);
                        }
                    }
                }

                return initialManifest;
            };
            // TODO: handle changes
            const rootPathExportsWatcher = fsApi.watchFileExports(rootPath, () => {});
            const rootPathExports = await rootPathExportsWatcher.exportNames;
            const watcher = fsApi.watchDirectory(routeDir, (fileList) => {
                void compute(fileList, rootPathExports).then((manifest) => {
                    onManifestUpdate(manifest);
                });
            });
            const initialFilePaths = await watcher.filePaths;

            return {
                dispose() {
                    watcher.stop();
                },
                manifest: await compute(initialFilePaths, rootPathExports),
            };
        },
    });
}

type RouteObject = Parameters<typeof createRemixStub>[0][0];

const createEl = React.createElement;

const fileToRoute = (
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    path: string,
    isRootPath: boolean = false,
) => {
    const { Component, loader } = getLazyCompAndLoader(filePath, requireModule, setUri, isRootPath);

    const routeObject: RouteObject = {
        path,
        Component,
        loader,
    };

    return routeObject;
};

const manifestToRouter = (
    manifest: IAppManifest<RouteExtraInfo>,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
) => {
    const rootFilePath = (manifest.homeRoute || manifest.routes[0])?.parentLayouts?.[0]?.layoutModule;
    if (!rootFilePath) {
        return createRemixStub([]);
    }
    const rootRoute: RouteObject = fileToRoute(rootFilePath, requireModule, setUri, '/', true);
    const layoutMap = new Map<string, RouteObject>();
    if (manifest.homeRoute) {
        rootRoute.children = [fileToRoute(manifest.homeRoute.pageModule, requireModule, setUri, '/')];
    }
    for (const route of manifest.routes) {
        const routeObject = fileToRoute(route.pageModule, requireModule, setUri, pathToRemixRouterUrl(route.path));
        let parentRoute: RouteObject = rootRoute;
        for (const parentLayout of route.extraData.parentLayouts) {
            if (parentLayout.layoutModule === rootFilePath) {
                continue;
            }
            if (!layoutMap.has(parentLayout.layoutModule)) {
                layoutMap.set(
                    parentLayout.layoutModule,
                    fileToRoute(parentLayout.layoutModule, requireModule, setUri, parentLayout.path),
                );
                parentRoute.children = parentRoute.children || [];
                parentRoute.children.push(layoutMap.get(parentLayout.layoutModule)!);
                parentRoute = layoutMap.get(parentLayout.layoutModule)!;
            }
            parentRoute = layoutMap.get(parentLayout.layoutModule)!;
        }
        parentRoute.children = parentRoute.children || [];
        parentRoute.children.push(routeObject);
    }

    const Router = createRemixStub([rootRoute]);

    return Router;
};

const loadedModules = new Map<string, ReturnType<typeof lazyCompAndLoader>>();
export const getLazyCompAndLoader = (
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    wrapWithLayout = false,
) => {
    const key = filePath;
    let module = loadedModules.get(key);
    if (!module) {
        module = lazyCompAndLoader(filePath, requireModule, setUri, wrapWithLayout);
        loadedModules.set(key, module);
    }
    return module;
};

interface Dispatcher<T> {
    getState: () => T;
    setState: (newValue: T) => void;
    subscribe: (listener: (newValue: T) => void) => () => void;
}
function createDispatcher<T>(value: T): Dispatcher<T> {
    const listeners = new Set<(newValue: T) => void>();
    return {
        getState: () => value,
        setState: (newValue: T) => {
            value = newValue;
            listeners.forEach((listener) => listener(value));
        },
        subscribe: (listener: (newValue: T) => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
function useDispatcher<T>(dispatcher: Dispatcher<T>) {
    const [state, setState] = React.useState(dispatcher.getState());
    React.useEffect(() => {
        return dispatcher.subscribe(setState);
    }, [dispatcher]);
    return state;
}

function PageComp({
    module,
    filePath,
    wrapWithLayout,
    setUri,
}: {
    module: Dispatcher<IResults<unknown>>;
    filePath: string;
    wrapWithLayout: boolean;
    setUri: (uri: string) => void;
}) {
    const currentModule = useDispatcher(module);

    const uri = useLocation().pathname;
    useEffect(() => {
        setUri(uri.slice(1));
    }, [setUri, uri]);

    if (currentModule.errorMessage) {
        return <div>{currentModule.errorMessage}</div>;
    }
    const moduleAsExpected = currentModule.results as {
        default?: React.ComponentType;
        Layout?: React.ComponentType<{ children?: React.ReactNode }>;
    };
    const Page = moduleAsExpected.default;

    if (!Page) {
        return <div>default export not found at {filePath}</div>;
    }
    if (wrapWithLayout && moduleAsExpected.Layout) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return createEl(moduleAsExpected.Layout, {}, createEl(Page, {}));
    }
    return createEl(Page);
}
function lazyCompAndLoader(
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    wrapWithLayout = false,
) {
    const Component = React.lazy(async () => {
        let updateModule: ((newModule: IResults<unknown>) => void) | undefined = undefined;
        const { moduleResults } = requireModule(filePath, (newResults) => {
            updateModule?.(newResults);
        });
        const initialyLoadedModule = await moduleResults;
        const dispatcher = createDispatcher(initialyLoadedModule);
        updateModule = (newModule) => dispatcher.setState(newModule);
        return {
            default: () => {
                return createEl(PageComp, {
                    module: dispatcher,
                    filePath,
                    wrapWithLayout,
                    setUri,
                });
            },
        };
    });

    const loader: LoaderFunction = async (...args) => {
        const { moduleResults } = requireModule(filePath);
        const { results } = await moduleResults;
        const moduleWithComp = results as {
            loader?: LoaderFunction;
        };
        const loader = moduleWithComp.loader;
        if (loader) {
            return await loader(...args);
        }
        return {};
    };

    return { Component, loader };
}

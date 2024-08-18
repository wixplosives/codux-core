import {
    defineApp,
    type IAppManifest,
    type IResults,
    type RouteInfo,
    type DynamicImport,
    type PathApi,
    IReactAppProps,
    DynamicRoutePart,
    StaticRoutePart,
} from '@wixc3/app-core';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import { createRemixStub } from '@remix-run/testing';
import { LoaderFunction } from '@remix-run/node';

export interface IDefineRemixAppProps {
    appPath: string;
    bookmarks?: string[];
    isPageInDirectory?: boolean;
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
            const routeDir = fsApi.path.join(fsApi.path.dirname(fsApi.appDefFilePath), appPath, 'routes');
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
            const rootPath = fsApi.path.join(appDefDir, appPath, 'root.tsx');
            const routeDir = fsApi.path.join(appDefDir, appPath, 'routes');

            // /product -> product.tsx product/route._index.tsx
            // /product/$ -> product/$.tsx product/$/route.tsx
            const compute = async (filesInDir: string[], rootExportNames: string[]) => {
                const routeDirLength = routeDir.length + 1;
                const rootLayouts: RouteExtraInfo['parentLayouts'] = [
                    {
                        id: 'root',
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
                            const routePathString = filePathToReadableUri(fullPath, fsApi.path) || '';
                            if (!acc.has(routePathString)) {
                                acc.set(routePathString, {
                                    files: [],
                                    path: routePath,
                                    readableName: routePathString,
                                });
                            }
                            acc.get(routePathString)?.files.push(fullPath);
                        }
                    } else if (
                        dirParts.length === 2 &&
                        (fullPath.endsWith(fsApi.path.sep + 'route.tsx') ||
                            fullPath.endsWith(fsApi.path.sep + 'index.tsx'))
                    ) {
                        const routeParts = dirParts[0].split('.');
                        const routePath = routePartsToRoutePath(routeParts);

                        const routePathString = routePathId(routePath);

                        if (!acc.has(routePathString)) {
                            acc.set(routePathString, {
                                files: [],
                                path: routePath,
                                readableName: routePathString,
                            });
                        }
                        acc.get(routePathString)?.files.push(fullPath);
                    } else {
                        // TODO: handle such cases if exist in remix
                    }
                    return acc;
                }, new Map<string, { files: string[]; path: Array<StaticRoutePart | DynamicRoutePart>; readableName: string }>());

                const initialManifest: IAppManifest<RouteExtraInfo> = {
                    routes: [],
                    homeRoute: undefined,
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
                        [],
                        rootPath,
                        {
                            parentLayouts: rootLayouts,
                        },
                        fsApi.path,
                    );
                    suspectedErrorRoutes.set('', errorRoute);
                    initialManifest.errorRoutes!.push(errorRoute);
                }
                for (const [key, value] of sortedFilesByRoute) {
                    if (value.path.length === 0) {
                        initialManifest.homeRoute = aRoute(
                            [],
                            value.files[0],
                            {
                                parentLayouts: rootLayouts,
                            },
                            fsApi.path,
                        );
                    } else {
                        const routeFiles = value.files;

                        // TODO add change handler
                        const routeFileExports = await Promise.all(
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
                        const lastFile = routeFileExports[routeFileExports.length - 1].file;
                        for (let i = 0; i < value.path.length - 1; i++) {
                            const key = routePathId(value.path.slice(0, i + 1));
                            const layout = suspectedLayouts.get(key);
                            if (layout) {
                                parentLayouts.push(layout);
                            }
                        }

                        for (const { file, exports } of routeFileExports) {
                            if (exports.includes('default')) {
                                const canBeLayout =
                                    !file.endsWith(fsApi.path.sep + '_index.tsx') &&
                                    !fsApi.path.dirname(file).endsWith('_index');
                                if (canBeLayout) {
                                    suspectedLayouts.set(key, {
                                        layoutModule: file,
                                        layoutExportName: 'default',
                                        id: routePathId(value.path),
                                        path: key,
                                    });
                                    if (file !== lastFile) {
                                        parentLayouts.push({
                                            layoutModule: file,
                                            layoutExportName: 'default',
                                            id: routePathId(value.path),
                                            path: pathToRemixRouterUrl(value.path),
                                        });
                                    }
                                }
                                page = { file, exports };
                            }
                        }

                        if (page) {
                            // TODO: collect parentlayouts and error routes
                            const route = aRoute(
                                value.path,
                                page.file,
                                {
                                    parentLayouts,
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

interface ParentLayoutWithExtra {
    layoutModule: string;
    layoutExportName: string;
    path: string;
    id: string;
}

interface RouteExtraInfo {
    parentLayouts: Array<ParentLayoutWithExtra>;
}

const routePathId = (path: RouteInfo['path']) => {
    return path
        .map((part) => {
            if (part.kind === 'static') {
                return part.text;
            }
            return `$$$`;
        })
        .join('/');
};

function capitalizeFirstLetter(val: string): string {
    return val.length === 0 ? val : val.charAt(0).toUpperCase() + val.slice(1);
}
function toCamelCase(str: string): string {
    const words = str
        .split('.')
        .map((word, index) => (index > 0 ? capitalizeFirstLetter(word.toLowerCase()) : word.toLowerCase()));
    return words.join('');
}
function pathToRemixRouterUrl(path: RouteInfo['path']): string {
    return (
        '/' +
        path
            .map((part) => {
                if (part.kind === 'static') {
                    return part.text;
                }
                return `:${part.name}`;
            })
            .join('/')
    );
}
function filePathToReadableUri(filePathInRouteDir: string, path: PathApi): string | null {
    const dirStructure = filePathInRouteDir.split(path.sep);
    if (dirStructure.length === 1) {
        const baseName = path.basename(filePathInRouteDir);
        const parts = baseName.split('.');
        return parts.slice(0, parts.length - 1).join('/');
    }
    if (dirStructure.length === 2) {
        const parts = dirStructure[dirStructure.length - 1].split('.');
        return parts.slice(0, parts.length - 1).join('/');
    }
    return null;
}
function readableStringToRoutePath(readableString: string): Array<StaticRoutePart | DynamicRoutePart> {
    return routePartsToRoutePath(readableString.split('/'));
}
const routePartsToRoutePath = (routeParts: string[]) => {
    return routeParts
        .map<DynamicRoutePart | StaticRoutePart | null>((p) => {
            if (p === '$') {
                return {
                    kind: 'dynamic' as const,
                    name: '*',
                    isCatchAll: true,
                };
            }
            if (p.startsWith('($') && p.endsWith(')')) {
                return {
                    kind: 'dynamic' as const,
                    name: p.slice(2, p.length - 1),
                    isOptional: true,
                };
            }
            if (p.startsWith('$')) {
                return {
                    kind: 'dynamic' as const,
                    name: p.slice(1, p.length),
                };
            }
            if (p === '_index') {
                return null;
            }
            return {
                kind: 'static' as const,
                text: p,
            };
        })
        .filter((p): p is DynamicRoutePart | StaticRoutePart => !!p);
};
const aRoute = (
    path: RouteInfo['path'],
    pageModule: string,
    extraData: RouteExtraInfo,
    pathApi: PathApi,
): RouteInfo<RouteExtraInfo> => ({
    path,
    pageModule,
    pageExportName: 'default',
    parentLayouts: extraData.parentLayouts,
    pathString: filePathToReadableUri(pageModule, pathApi) || '',
    extraData,
});

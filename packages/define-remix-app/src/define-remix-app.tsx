import {
    defineApp,
    type IAppManifest,
    type RouteInfo,
    IReactAppProps,
    DynamicRoutePart,
    StaticRoutePart,
} from '@wixc3/app-core';
import { useMemo } from 'react';
import {
    aRoute,
    chooseOverridingPath,
    filePathToLayoutMatching,
    filePathToReadableUri,
    filePathToRouteId,
    filePathToURLParts,
    ParentLayoutWithExtra,
    pathToRemixRouterUrl,
    readableStringToRoutePath,
    RouteExtraInfo,
    routePartsToRoutePath,
    routePathId,
    toCamelCase,
} from './remix-app-utils';
import { manifestToRouter } from './manifest-to-router';

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
            const loadedExportState = new Map<
                string,
                { exports: string[]; stop: () => void; pend?: Promise<string[]> }
            >();
            const watcher = fsApi.watchDirectory(routeDir, (fileList) => {
                filePaths = fileList;
                void compute(fileList, rootPathExports).then((manifest) => {
                    onManifestUpdate(manifest);
                });
            });
            let filePaths = await watcher.filePaths;
            const loadExports = async (filePath: string) => {
                const state = loadedExportState.get(filePath);

                if (!state) {
                    const watcher = fsApi.watchFileExports(filePath, (exports) => {
                        const state = loadedExportState.get(filePath);
                        if (state) {
                            state.exports = exports;
                            void compute(filePaths, rootPathExports).then((manifest) => {
                                onManifestUpdate(manifest);
                            });
                        }
                    });
                    const exports = watcher.exportNames;
                    loadedExportState.set(filePath, { exports: [], stop: watcher.stop, pend: exports });
                    loadedExportState.get(filePath)!.exports = await exports;
                    loadedExportState.get(filePath)!.pend = undefined;
                    return loadedExportState.get(filePath)!.exports;
                }
                const pend = state?.pend;
                if (!pend) {
                    return state?.exports || [];
                }

                return await pend;
            };

            const rootPathExportsWatcher = fsApi.watchFileExports(rootPath, (exportNames) => {
                rootPathExports = exportNames;
                void compute(filePaths, rootPathExports).then((manifest) => {
                    onManifestUpdate(manifest);
                });
            });
            let rootPathExports = await rootPathExportsWatcher.exportNames;

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
                const { layouts, routes } = filesInDir.reduce(
                    (acc, fullPath) => {
                        const name = fsApi.path.basename(fullPath);
                        const pathInRoutesDir = fullPath.slice(routeDirLength);
                        if (name.endsWith('.tsx')) {
                            const parts = filePathToURLParts(pathInRoutesDir, fsApi.path);
                            if (parts.length === 1 && parts[0] === '_index') {
                                if (!acc.routes.has('/')) {
                                    acc.routes.set('/', {
                                        file: fullPath,
                                        path: [],
                                        readableName: '',
                                        layoutMatching: [],
                                    });
                                } else {
                                    acc.routes.get('/')!.file = chooseOverridingPath(
                                        acc.routes.get('/')!.file,
                                        fullPath,
                                    );
                                }
                                return acc;
                            }
                            const routePath = routePartsToRoutePath(parts);

                            if (!parts.find((part) => !part.startsWith('_'))) {
                                // file is a only layout
                                const layoutId = filePathToRouteId(appDir, fullPath);
                                acc.layouts.set(parts.join('/'), {
                                    id: layoutId,
                                    layoutExportName: 'default',
                                    layoutModule: fullPath,
                                    path: pathToRemixRouterUrl(routePath),
                                });
                                return acc;
                            }

                            const routeUrlId = routePathId(routePath);
                            const routePathString = filePathToReadableUri(pathInRoutesDir, fsApi.path) || '';
                            if (!acc.routes.has(routeUrlId)) {
                                acc.routes.set(routeUrlId, {
                                    file: fullPath,
                                    path: routePath,
                                    readableName: routePathString,
                                    layoutMatching: filePathToLayoutMatching(pathInRoutesDir, fsApi.path),
                                });
                            } else {
                                acc.routes.get(routeUrlId)!.file = chooseOverridingPath(
                                    acc.routes.get(routeUrlId)!.file,
                                    fullPath,
                                );
                            }
                            const canBeLayout =
                                !fullPath.endsWith('._index.tsx') && !fsApi.path.dirname(fullPath).endsWith('_index');
                            if (canBeLayout) {
                                const layoutMatching = filePathToLayoutMatching(pathInRoutesDir, fsApi.path);
                                const layoutId = filePathToRouteId(appDir, fullPath);
                                acc.layouts.set(layoutMatching.join('/'), {
                                    id: layoutId,
                                    layoutExportName: 'default',
                                    layoutModule: fullPath,
                                    path: pathToRemixRouterUrl(routePath),
                                });
                            }
                        }
                        return acc;
                    },
                    {
                        routes: new Map<
                            string,
                            {
                                file: string;
                                path: Array<StaticRoutePart | DynamicRoutePart>;
                                readableName: string;
                                layoutMatching: string[];
                            }
                        >(),
                        layouts: new Map<string, ParentLayoutWithExtra>(),
                    },
                );

                const initialManifest: IAppManifest<RouteExtraInfo> = {
                    routes: [],
                    errorRoutes: [],
                };
                const sortedFilesByRoute = [...routes.entries()].sort(([, a], [, b]) =>
                    a.path.length === b.path.length
                        ? a.readableName.localeCompare(b.readableName)
                        : a.path.length - b.path.length,
                );
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
                            value.file,
                            {
                                parentLayouts: rootLayouts,
                                routeId: filePathToRouteId(appDir, value.file),
                            },
                            fsApi.path,
                        );
                    } else {
                        const exports = await loadExports(value.file);

                        const parentLayouts: RouteExtraInfo['parentLayouts'] = [...rootLayouts];
                        const routeLayouts = filePathToLayoutMatching(value.file.slice(routeDirLength), fsApi.path);
                        for (let i = 0; i < routeLayouts.length - 1; i++) {
                            const key = routeLayouts.slice(0, i + 1).join('/');
                            const layout = layouts.get(key);
                            if (layout) {
                                parentLayouts.push(layout);
                            }
                        }

                        if (exports.includes('default')) {
                            const route = aRoute(
                                routeDir,
                                value.path,
                                value.file,
                                {
                                    parentLayouts,
                                    routeId: filePathToRouteId(appDir, value.file),
                                },
                                fsApi.path,
                            );
                            initialManifest.routes.push(route);
                        }
                    }
                }

                return initialManifest;
            };

            return {
                dispose() {
                    watcher.stop();
                },
                manifest: await compute(filePaths, rootPathExports),
            };
        },
    });
}

import {
    defineApp,
    type IAppManifest,
    type RouteInfo,
    IReactAppProps,
    DynamicRoutePart,
    StaticRoutePart,
    FSApi,
    IGetNewPageInfoOptions,
} from '@wixc3/app-core';
import { useMemo, useRef } from 'react';
import {
    anErrorRoute,
    aRoute,
    chooseOverridingPath,
    filePathToLayoutMatching,
    filePathToReadableUri,
    filePathToRouteId,
    filePathToURLParts,
    ParentLayoutWithExtra,
    pathToRemixRouterUrl,
    readableUriToFilePath,
    RouteExtraInfo,
    routePartsToRoutePath,
    routePathId,
    RoutingPattern,
    toCamelCase,
} from './remix-app-utils';
import { manifestToRouter } from './manifest-to-router';
import { parentLayoutWarning } from './content';
import { pageTemplate } from './page-template';

export interface IDefineRemixAppProps {
    appPath: string;
    bookmarks?: string[];
    routingPattern?: RoutingPattern;
}

export default function defineRemixApp({ appPath, routingPattern }: IDefineRemixAppProps) {
    let rootLayouts: RouteExtraInfo['parentLayouts'] = [];
    let layoutMap: Map<string, ParentLayoutWithExtra> = new Map();
    const getRouteLayouts = (filePathInRouteDir: string, fsApi: FSApi, layouts = layoutMap) => {
        const parentLayouts: RouteExtraInfo['parentLayouts'] = [...rootLayouts];
        const routeLayouts = filePathToLayoutMatching(filePathInRouteDir, fsApi.path);
        for (let i = 0; i < routeLayouts.length - 1; i++) {
            const key = routeLayouts.slice(0, i + 1).join('/');
            const layout = layouts.get(key);
            if (layout) {
                parentLayouts.push(layout);
            }
        }
        return { parentLayouts, routeLayouts };
    };
    const getNewOrMove = ({
        fsApi,
        requestedURI,
        manifest,
        layoutMap,
    }: IGetNewPageInfoOptions<RouteExtraInfo> & { layoutMap: Map<string, ParentLayoutWithExtra> }) => {
        const appDir = fsApi.path.join(fsApi.path.dirname(fsApi.appDefFilePath), appPath);
        const routeDir = fsApi.path.join(appDir, 'routes');
        const varNames = new Set<string>();
        const pageModule = readableUriToFilePath(requestedURI, fsApi.path, routeDir, routingPattern || 'file');
        const urlParts = filePathToURLParts(pageModule.slice(routeDir.length + 1), fsApi.path);
        const wantedPath = routePartsToRoutePath(urlParts);
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

        if (existingRoute) {
            if (!canFilePathBeLayout(existingRoute.pageModule, fsApi) || canFilePathBeLayout(pageModule, fsApi)) {
                return {
                    isValid: false,
                    errorMessage: 'Route already exists at file path: ' + existingRoute.pageModule,
                    pageModule: existingRoute.pageModule,
                    newPageSourceCode: '',
                    newPageRoute: existingRoute,
                };
            }
        }

        const newPageSourceCode = pageTemplate(pageName, varNames);

        const { parentLayouts } = getRouteLayouts(pageModule.slice(routeDir.length + 1), fsApi, layoutMap);
        const warningMessage = parentLayouts.reduce(
            (acc, layout) => {
                if (layout.path && layout.path !== '/') {
                    const parentLayoutPath = filePathToReadableUri(
                        layout.layoutModule.slice(routeDir.length + 1),
                        fsApi.path,
                    );
                    if (parentLayoutPath && requestedURI.startsWith(parentLayoutPath)) {
                        const suggestedPath = requestedURI.replace(parentLayoutPath, parentLayoutPath + '_');
                        acc = acc
                            ? acc + '\n' + parentLayoutWarning(parentLayoutPath, suggestedPath)
                            : parentLayoutWarning(parentLayoutPath, suggestedPath);
                    }
                }
                return acc;
            },
            undefined as string | undefined,
        );
        return {
            isValid: true,
            error: '',
            warningMessage,
            newPageSourceCode,
            pageModule,
            newPageRoute: {
                pageModule,
                pageExportName: 'default',
                extraData: {
                    parentLayouts,
                    routeId: filePathToRouteId(appDir, pageModule),
                },
                path: wantedPath,
                pathString: requestedURI,
                parentLayouts,
            },
        };
    };
    return defineApp<RouteExtraInfo>({
        App: ({ manifest, importModule, setUri, uri, onCaughtError }: IReactAppProps<RouteExtraInfo>) => {
            const uriRef = useRef(uri);
            uriRef.current = uri;
            const App = useMemo(
                () => manifestToRouter(manifest, importModule, setUri, onCaughtError, uriRef),
                [manifest, importModule, setUri, onCaughtError],
            );

            return (
                <App
                    initialEntries={[
                        {
                            pathname: '/' + uri,
                            search: '',
                            hash: '',
                        },
                    ]}
                />
            );
        },
        getNewPageInfo({ fsApi, requestedURI, manifest }) {
            return getNewOrMove({ fsApi, requestedURI, manifest, layoutMap });
        },
        getMovePageInfo({ fsApi, requestedURI, manifest, movedFilePath }) {
            const layoutsWithoutMoved = new Map(
                [...layoutMap.entries()].filter(([_, { layoutModule }]) => layoutModule !== movedFilePath),
            );
            layoutsWithoutMoved.delete(movedFilePath);
            return getNewOrMove({ fsApi, requestedURI, manifest, layoutMap: layoutsWithoutMoved });
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

            const compute = async (filesInDir: string[], rootExportNames: string[]) => {
                const routeDirLength = routeDir.length + 1;
                rootLayouts = [
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

                const relevantFiles = filesInDir.filter((file) => file.endsWith('.tsx'));
                // const relevantFilesExports = await Promise.all(relevantFiles.map(loadExports));
                // // const relevantFilesExportsMap = new Map(
                // //     relevantFiles.map((file, index) => [file, relevantFilesExports[index]]),
                // // );
                const { layouts, routes } = relevantFiles.reduce(
                    (acc, fullPath) => {
                        const pathInRoutesDir = fullPath.slice(routeDirLength);

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
                                acc.routes.get('/')!.file = chooseOverridingPath(acc.routes.get('/')!.file, fullPath);
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
                        const canBeLayout = canFilePathBeLayout(fullPath, fsApi);
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
                        errorRoutes: new Map<
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
                layoutMap = layouts;
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
                    const errorRoute = anErrorRoute(
                        routeDir,
                        [],
                        rootPath,
                        {
                            parentLayouts: rootLayouts,
                            routeId: 'error',
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

                        const { parentLayouts } = getRouteLayouts(value.file.slice(routeDirLength), fsApi);

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

const canFilePathBeLayout = (filePath: string, fsApi: FSApi) => {
    return !filePath.endsWith('._index.tsx') && !fsApi.path.dirname(filePath).endsWith('_index');
};

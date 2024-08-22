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
                const filesByRoute = filesInDir.reduce((acc, fullPath) => {
                    const name = fsApi.path.basename(fullPath);
                    const pathInRoutesDir = fullPath.slice(routeDirLength);
                    if (name.endsWith('.tsx')) {
                        const parts = filePathToURLParts(pathInRoutesDir, fsApi.path);
                        if (parts.length === 1 && parts[0] === '_index') {
                            if (!acc.has('/')) {
                                acc.set('/', {
                                    files: [],
                                    path: [],
                                    readableName: '',
                                });
                            }
                            acc.get('/')?.files.push(fullPath);
                        } else if (parts.length === 1 && parts[0].startsWith('_')) {
                            acc.set(parts[0], {
                                files: [fullPath],
                                path: [],
                                readableName: parts[0],
                            });
                        } else {
                            const routePath = routePartsToRoutePath(parts);
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

                        const routeFilesWithExports = await Promise.all(
                            routeFiles.map(async (file) => {
                                const exports = (await loadExports(file)) || [];
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

            return {
                dispose() {
                    watcher.stop();
                },
                manifest: await compute(filePaths, rootPathExports),
            };
        },
    });
}

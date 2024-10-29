import {
    defineApp,
    type IAppManifest,
    IReactAppProps,
    DynamicRoutePart,
    StaticRoutePart,
    FSApi,
    IGetNewPageInfoOptions,
    IResults,
    RoutingPattern,
} from '@wixc3/app-core';
import { useMemo, useRef, useEffect } from 'react';
import {
    anErrorRoute,
    aRoute,
    chooseOverridingPath,
    DeserializedLoaderArgs,
    deserializeRequest,
    filePathToLayoutMatching,
    filePathToReadableUri,
    filePathToRouteId,
    filePathToURLParts,
    ParentLayoutWithExtra,
    pathToRemixRouterUrl,
    readableUriToFilePath,
    RouteExtraInfo,
    RouteModuleInfo,
    routePartsToRoutePath,
    routePathId,
    serializeResponse,
    toCamelCase,
} from './remix-app-utils';
import { clearLoadedModules, manifestToRouter } from './manifest-to-router';
import { parentLayoutWarning } from './content';
import { pageTemplate } from './page-template';
import { isDeferredData } from '@remix-run/router';
import { json } from '@remix-run/node';
import { Navigation } from './navigation';
export interface IDefineRemixAppProps {
    appPath: string;
    bookmarks?: string[];
    routingPattern?: RoutingPattern;
}

/**
 * Allows Codux to get the static routes (needed to allow navigation to a dynamic page).
 */
export type GetStaticRoutes = () => Promise<string[]>;

export const INVALID_MSGS = {
    homeRouteExists: (routePath: string) => 'Home route already exists at ' + routePath,
    emptyName: 'page name cannot be empty',
    initialPageLetter: 'page name must start with an a letter between a-z',
    invalidVar: (varName: string) =>
        `invalid variable name: "${varName}", page params must start with a letter or underscore and contain only letters, numbers and underscores`,
    invalidRouteChar: (param: string, char: string) => `invalid character "${char}" in page route ${param}`,
};

export default function defineRemixApp({ appPath, routingPattern = 'file' }: IDefineRemixAppProps) {
    let rootLayouts: RouteExtraInfo['parentLayouts'] = [];
    let layoutMap: Map<string, ParentLayoutWithExtra> = new Map();
    const navigation = new Navigation();
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
    }: IGetNewPageInfoOptions<RouteModuleInfo, undefined> & { layoutMap: Map<string, ParentLayoutWithExtra> }) => {
        const appDir = fsApi.path.join(fsApi.path.dirname(fsApi.appDefFilePath), appPath);
        const routeDir = fsApi.path.join(appDir, 'routes');
        const varNames = new Set<string>();
        const pageModule = readableUriToFilePath(requestedURI, fsApi.path, routeDir, routingPattern);
        const urlParts = filePathToURLParts(pageModule.slice(routeDir.length + 1), fsApi.path);
        const wantedPath = routePartsToRoutePath(urlParts);
        if (requestedURI.length === 0 && manifest.homeRoute) {
            return {
                isValid: false,
                errorMessage: INVALID_MSGS.homeRouteExists(manifest.homeRoute.pageModule),
                pageModule: '',
                newPageSourceCode: '',
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
        if (!pageName) {
            return {
                isValid: false,
                errorMessage: INVALID_MSGS.emptyName,
                pageModule: '',
                newPageSourceCode: '',
            };
        } else if (!pageName[0].match(/[A-Za-z]/)) {
            return {
                isValid: false,
                errorMessage: 'page name must start with an a letter between a-z',
                pageModule: '',
                newPageSourceCode: '',
            };
        }

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

        const invalidVar = [...varNames].find(
            (varName) => !varName || !varName[0].match(/[A-Za-z_]/) || !varName.match(/^[A-Za-z_0-9]+$/),
        );
        if (invalidVar) {
            return {
                isValid: false,
                errorMessage: INVALID_MSGS.invalidVar(invalidVar),
                pageModule: '',
                newPageSourceCode: '',
            };
        }

        for (const part of wantedPath) {
            if (part.kind === 'static') {
                const matchedInvalidChars = part.text.match(/[/\\:*?"'`<>|]/g);
                if (matchedInvalidChars) {
                    return {
                        isValid: false,
                        errorMessage: INVALID_MSGS.invalidRouteChar(part.text, matchedInvalidChars.join('')),
                        pageModule: '',
                        newPageSourceCode: '',
                    };
                }
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
            routingPattern,
            newPageRoute: {
                pageModule,
                pageExportName: 'default',
                extraData: undefined,
                hasGetStaticRoutes: false,
                path: wantedPath,
                pathString: requestedURI,
                parentLayouts,
            },
        };
    };
    return defineApp<RouteModuleInfo, undefined>({
        App: ({
            manifest,
            importModule,
            setUri,
            uri,
            onCaughtError,
            callServerMethod,
        }: IReactAppProps<RouteModuleInfo, undefined>) => {
            const uriRef = useRef(uri);
            uriRef.current = uri;
            const { Router } = useMemo(
                () =>
                    manifestToRouter(
                        manifest,
                        navigation,
                        importModule,
                        setUri,
                        onCaughtError,
                        uriRef,
                        callServerMethod,
                    ),
                [manifest, importModule, setUri, onCaughtError, callServerMethod],
            );

            useEffect(() => {
                return clearLoadedModules;
            }, []);
            useEffect(() => {
                navigation.navigate(uri.startsWith('/') ? uri : `/${uri}`);
            }, [uri]);

            return (
                <Router
                    initialEntries={[
                        {
                            pathname: '/' + uri,
                            search: '',
                        },
                    ]}
                />
            );
        },
        callServerMethod: async ({ importModule }, filePath, methodName, args) => {
            const isRequestType = methodName === 'loader' || methodName === 'action';
            if (isRequestType) {
                args = [
                    {
                        params: (args as [DeserializedLoaderArgs])[0].params,
                        request: deserializeRequest((args as [DeserializedLoaderArgs])[0].request),
                    },
                ];
            }
            const loader = importModule(filePath);
            const moduleRequest = (await loader.moduleResults) as IResults<{
                [key: string]: unknown;
            }>;

            const requestedMethod = moduleRequest.results?.[methodName];

            if (moduleRequest.status !== 'ready') {
                throw new Error(`Module ${filePath}: ${moduleRequest.errorMessage}`);
            }
            if (!isMethod(requestedMethod)) {
                throw new Error(`Method ${methodName} not found in ${filePath}`);
            }

            const res = await requestedMethod(...args);

            if (isRequestType && res instanceof Response) {
                return serializeResponse(res);
            }
            if (isDeferredData(res)) {
                await res.resolveData(new AbortController().signal);
                return serializeResponse(json(res.unwrappedData));
            }
            return res;
        },
        async getStaticRoutes(options, forRouteAtFilePath) {
            const results = await this.callServerMethod!(options, forRouteAtFilePath, 'getStaticRoutes', []);
            if (!Array.isArray(results)) {
                throw new Error('getStaticRoutes must return an array');
            }
            if (results.some((route: unknown) => typeof route !== 'string')) {
                throw new Error('getStaticRoutes must return an array of strings');
            }
            return results as string[];
        },
        async hasGetStaticRoutes({ fsApi }, forRouteAtFilePath) {
            const { exportNames, stop } = fsApi.watchFileExports(forRouteAtFilePath, () => {});
            const results = await exportNames;
            const hasGetStaticRoutes = results.includes('getStaticRoutes');
            stop();
            return hasGetStaticRoutes;
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

                const rootModuleInfo: RouteModuleInfo = {
                    exportNames: rootExportNames,
                    children: [],
                    file: rootPath,
                    id: 'root',
                    path: '/',
                };

                rootLayouts = [
                    {
                        id: filePathToRouteId(appDir, rootPath),
                        layoutExportName: 'default',
                        layoutModule: rootPath,
                        path: '/',
                        exportNames: rootExportNames,
                    },
                ];
                if (rootExportNames.includes('Layout')) {
                    rootLayouts.unshift({
                        id: 'rootLayout',
                        layoutExportName: 'Layout',
                        layoutModule: rootPath,
                        path: '/',
                        exportNames: rootExportNames,
                    });
                }

                const relevantFiles = filesInDir.filter((file) => file.endsWith('.tsx'));
                const exportNames = new Map<string, string[]>();
                for (const file of relevantFiles) {
                    const exports = await loadExports(file);
                    exportNames.set(file, exports);
                }
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
                                const rootRoute = acc.routes.get('/')!;
                                rootRoute.file = chooseOverridingPath(rootRoute.file, fullPath);
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
                                exportNames: exportNames.get(fullPath) || [],
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
                                exportNames: exportNames.get(fullPath) || [],
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
                        moduleExports: new Map<string, string[]>(),
                    },
                );
                layoutMap = layouts;
                const initialManifest: IAppManifest<RouteModuleInfo, undefined> = {
                    routes: [],
                    errorRoutes: [],
                    extraData: rootModuleInfo,
                };

                const sortedFilesByRoute = [...routes.entries()].sort(([, a], [, b]) =>
                    a.readableName.localeCompare(b.readableName),
                );
                if (rootExportNames.includes('ErrorBoundary')) {
                    const errorRoute = anErrorRoute(routeDir, [], rootPath, [], fsApi.path);
                    initialManifest.errorRoutes!.push(errorRoute);
                }

                const routeInfoById = new Map<string, RouteModuleInfo>();
                routeInfoById.set(rootModuleInfo.id, rootModuleInfo);
                for (const [, value] of sortedFilesByRoute) {
                    const exports = exportNames.get(value.file) || [];
                    const { parentLayouts } = getRouteLayouts(value.file.slice(routeDirLength), fsApi);
                    let parent = rootModuleInfo;
                    for (const layout of parentLayouts) {
                        if (layout.layoutModule === rootPath) {
                            continue;
                        }
                        const existingRoute = routeInfoById.get(layout.id);
                        if (!existingRoute) {
                            const layoutExports = exportNames.get(layout.layoutModule) || [];
                            const layoutRoute: RouteModuleInfo = {
                                id: layout.id,
                                children: [],
                                exportNames: layoutExports,
                                file: layout.layoutModule,
                                path: layout.path,
                            };
                            routeInfoById.set(layout.id, layoutRoute);
                            parent.children.push(layoutRoute);
                            parent = layoutRoute;
                        } else {
                            parent = existingRoute;
                        }
                    }

                    const routeId = filePathToRouteId(appDir, value.file);
                    const route: RouteModuleInfo = {
                        id: routeId,
                        children: [],
                        exportNames: exports,
                        file: value.file,
                        path: pathToRemixRouterUrl(value.path),
                    };
                    routeInfoById.set(routeId, route);
                    parent.children.push(route);
                    if (value.path.length === 0) {
                        initialManifest.homeRoute = aRoute(
                            routeDir,
                            [],
                            rootLayouts,
                            value.file,
                            fsApi.path,
                            rootExportNames.includes('getStaticRoutes'),
                        );
                        if (exports.includes('ErrorBoundary')) {
                            const errorRoute = anErrorRoute(routeDir, value.path, value.file, rootLayouts, fsApi.path);
                            initialManifest.errorRoutes!.push(errorRoute);
                        }
                    } else {
                        if (exports.includes('default')) {
                            const route = aRoute(
                                routeDir,
                                value.path,
                                parentLayouts,
                                value.file,
                                fsApi.path,
                                exports.includes('getStaticRoutes'),
                            );
                            initialManifest.routes.push(route);
                            if (exports.includes('ErrorBoundary')) {
                                const errorRoute = anErrorRoute(
                                    routeDir,
                                    value.path,
                                    value.file,
                                    parentLayouts,
                                    fsApi.path,
                                );
                                initialManifest.errorRoutes!.push(errorRoute);
                            }
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

function isMethod(requestedMethod: unknown): requestedMethod is (...args: unknown[]) => unknown {
    return typeof requestedMethod === 'function';
}

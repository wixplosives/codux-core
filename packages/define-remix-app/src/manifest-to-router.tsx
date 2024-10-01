import { DynamicImport, IAppManifest, ErrorReporter, IResults } from '@wixc3/app-core';
import {
    deserializeResponse,
    isSerializedResponse,
    pathToRemixRouterUrl,
    RouteExtraInfo,
    SerializedResponse,
    serializeRequest,
} from './remix-app-utils';
import { createRemixStub } from '@remix-run/testing';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/node';
import React from 'react';
import { useLocation, useNavigate } from '@remix-run/react';
import { navigation } from './navigation';

type RouteObject = Parameters<typeof createRemixStub>[0][0];

export const manifestToRouter = (
    manifest: IAppManifest<RouteExtraInfo>,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
) => {
    const rootRouteInfo = manifest.homeRoute || manifest.routes[0];
    const rootFilePath = rootRouteInfo?.parentLayouts?.[0]?.layoutModule;
    const rootExports = rootRouteInfo?.extraData.parentLayouts?.[0]?.exportNames;
    if (!rootFilePath || !rootExports) {
        return {
            Router: createRemixStub([]),
            navigate(path: string) {
                navigation.navigate(path);
            },
        };
    }
    const rootRoute: RouteObject = fileToRoute(
        rootFilePath,
        rootExports,
        requireModule,
        setUri,
        onCaughtError,
        '/',
        true,
        prevUri,
        callServerMethod,
    );
    const layoutMap = new Map<string, RouteObject>();
    if (manifest.homeRoute) {
        rootRoute.children = [
            fileToRoute(
                manifest.homeRoute.pageModule,
                manifest.homeRoute.extraData.exportNames,
                requireModule,
                setUri,
                onCaughtError,
                '/',
                false,
                prevUri,
                callServerMethod,
            ),
        ];
    }
    for (const route of manifest.routes) {
        const routeObject = fileToRoute(
            route.pageModule,
            route.extraData.exportNames,
            requireModule,
            setUri,
            onCaughtError,
            pathToRemixRouterUrl(route.path),
            false,
            prevUri,
            callServerMethod,
        );
        let parentRoute: RouteObject = rootRoute;
        for (const parentLayout of route.extraData.parentLayouts) {
            if (parentLayout.layoutModule === rootFilePath) {
                continue;
            }
            if (!layoutMap.has(parentLayout.layoutModule)) {
                layoutMap.set(
                    parentLayout.layoutModule,
                    fileToRoute(
                        parentLayout.layoutModule,
                        route.extraData.exportNames,
                        requireModule,
                        setUri,
                        onCaughtError,
                        parentLayout.path,
                        false,
                        prevUri,
                        callServerMethod,
                    ),
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

    return {
        Router,
        navigate(path: string) {
            navigation.navigate(path);
        },
    };
};
const fileToRoute = (
    filePath: string,
    exportNames: string[],
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    path: string,
    isRootPath: boolean = false,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
) => {
    const { Component, loader, ErrorBoundary, action } = getLazyCompAndLoader(
        filePath,
        exportNames,
        requireModule,
        setUri,
        onCaughtError,
        isRootPath,
        prevUri,
        callServerMethod,
    );

    const routeObject: RouteObject = {
        path,
        Component,
        loader,
        ErrorBoundary,
        action,
    };

    return routeObject;
};
const loadedModules = new Map<string, ReturnType<typeof lazyCompAndLoader>>();
export const getLazyCompAndLoader = (
    filePath: string,
    exportNames: string[],
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
) => {
    const key = filePath;
    let module = loadedModules.get(key);
    if (!module) {
        module = lazyCompAndLoader(
            filePath,
            exportNames,
            requireModule,
            setUri,
            onCaughtError,
            isRootFile,
            prevUri,
            callServerMethod,
        );
        loadedModules.set(key, module);
    }
    return module;
};

function RootComp({
    module,
    filePath,
    setUri,
    prevUri,
}: {
    module: Dispatcher<IResults<unknown>>;
    filePath: string;
    setUri: (uri: string) => void;
    prevUri: { current: string };
}) {
    const currentModule = useDispatcher(module);

    const uri = useLocation().pathname;

    navigation.setNavigateFunction(useNavigate());

    useEffect(() => {
        if (uri.slice(1) !== prevUri.current) {
            setUri(uri.slice(1));
        }
    }, [setUri, prevUri, uri]);

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
    if (moduleAsExpected.Layout) {
        return (
            <moduleAsExpected.Layout>
                <Page />
            </moduleAsExpected.Layout>
        );
    }
    return <Page />;
}

function PageComp({ module, filePath }: { module: Dispatcher<IResults<unknown>>; filePath: string }) {
    const currentModule = useDispatcher(module);

    if (currentModule.errorMessage) {
        return <div>{currentModule.errorMessage}</div>;
    }
    const moduleAsExpected = currentModule.results as {
        default?: React.ComponentType;
    };
    const Page = moduleAsExpected.default;

    if (!Page) {
        return <div>default export not found at {filePath}</div>;
    }

    return <Page />;
}
function lazyCompAndLoader(
    filePath: string,
    exportNames: string[],
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
) {
    const Component = lazy(async () => {
        let updateModule: ((newModule: IResults<unknown>) => void) | undefined = undefined;
        const { moduleResults } = requireModule(filePath, (newResults) => {
            updateModule?.(newResults);
        });
        const initialyLoadedModule = await moduleResults;
        const dispatcher = createDispatcher(initialyLoadedModule);
        updateModule = (newModule) => dispatcher.setState(newModule);
        if (isRootFile) {
            return {
                default: () => {
                    return (
                        <Suspense>
                            <RootComp module={dispatcher} filePath={filePath} setUri={setUri} prevUri={prevUri} />
                        </Suspense>
                    );
                },
            };
        }
        return {
            default: () => {
                return <PageComp module={dispatcher} filePath={filePath} />;
            },
        };
    });

    const loader: LoaderFunction | undefined = exportNames.includes('loader')
        ? async ({ params, request }) => {
              const res = await callServerMethod(filePath, 'loader', [
                  { params, request: await serializeRequest(request) },
              ]);
              return isSerializedResponse(res) ? deserializeResponse(res) : res;
          }
        : undefined;

    const ErrorBoundary = exportNames.includes('ErrorBoundary')
        ? lazy(async () => {
              const { moduleResults } = requireModule(filePath);
              const { results } = await moduleResults;

              const moduleWithComp = results as {
                  ErrorBoundary?: React.ComponentType;
              };
              return {
                  default: () => (
                      <ErrorPage filePath={filePath} moduleWithComp={moduleWithComp} onCaughtError={onCaughtError} />
                  ),
              };
          })
        : undefined;

    const action = exportNames.includes('action')
        ? async ({ params, request }: ActionFunctionArgs) => {
              const res = await callServerMethod(filePath, 'action', [
                  { params, request: await serializeRequest(request) },
              ]);
              return deserializeResponse(res as SerializedResponse);
          }
        : undefined;
    return { Component, loader, ErrorBoundary, action };
}

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
    const [state, setState] = useState(dispatcher.getState());
    useEffect(() => {
        return dispatcher.subscribe(setState);
    }, [dispatcher]);
    return state;
}

function ErrorPage({
    moduleWithComp,
    filePath,
    onCaughtError,
}: {
    moduleWithComp: {
        ErrorBoundary?: React.ComponentType;
    };
    onCaughtError: ErrorReporter;
    filePath: string;
}) {
    navigation.setNavigateFunction(useNavigate());
    useEffect(() => {
        onCaughtError({ filePath, exportName: 'ErrorBoundary' });
    }, [filePath, onCaughtError]);
    if (moduleWithComp.ErrorBoundary) {
        return <moduleWithComp.ErrorBoundary />;
    }

    return <div>error boundary not found at {filePath}</div>;
}

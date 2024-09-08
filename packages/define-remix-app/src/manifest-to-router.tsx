import { DynamicImport, IAppManifest, ErrorReporter, IResults } from '@wixc3/app-core';
import { pathToRemixRouterUrl, RouteExtraInfo } from './remix-app-utils';
import { createRemixStub } from '@remix-run/testing';
import { lazy, useEffect, useState } from 'react';
import type { LoaderFunction } from '@remix-run/node';
import React from 'react';
import { useLocation } from '@remix-run/react';

type RouteObject = Parameters<typeof createRemixStub>[0][0];

export const manifestToRouter = (
    manifest: IAppManifest<RouteExtraInfo>,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    prevUri: { current: string },
) => {
    const rootFilePath = (manifest.homeRoute || manifest.routes[0])?.parentLayouts?.[0]?.layoutModule;
    if (!rootFilePath) {
        return createRemixStub([]);
    }
    const rootRoute: RouteObject = fileToRoute(rootFilePath, requireModule, setUri, onCaughtError, '/', true, prevUri);
    const layoutMap = new Map<string, RouteObject>();
    if (manifest.homeRoute) {
        rootRoute.children = [
            fileToRoute(manifest.homeRoute.pageModule, requireModule, setUri, onCaughtError, '/', false, prevUri),
        ];
    }
    for (const route of manifest.routes) {
        const routeObject = fileToRoute(
            route.pageModule,
            requireModule,
            setUri,
            onCaughtError,
            pathToRemixRouterUrl(route.path),
            false,
            prevUri,
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
                        requireModule,
                        setUri,
                        onCaughtError,
                        parentLayout.path,
                        false,
                        prevUri,
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

    return Router;
};
const fileToRoute = (
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    path: string,
    isRootPath: boolean = false,
    prevUri: { current: string },
) => {
    const { Component, loader, ErrorBoundary } = getLazyCompAndLoader(
        filePath,
        requireModule,
        setUri,
        onCaughtError,
        isRootPath,
        prevUri,
    );

    const routeObject: RouteObject = {
        path,
        Component,
        loader,
        ErrorBoundary,
    };

    return routeObject;
};
const loadedModules = new Map<string, ReturnType<typeof lazyCompAndLoader>>();
export const getLazyCompAndLoader = (
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
) => {
    const key = filePath;
    let module = loadedModules.get(key);
    if (!module) {
        module = lazyCompAndLoader(filePath, requireModule, setUri, onCaughtError, isRootFile, prevUri);
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
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
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
                    return <RootComp module={dispatcher} filePath={filePath} setUri={setUri} prevUri={prevUri} />;
                },
            };
        }
        return {
            default: () => {
                return <PageComp module={dispatcher} filePath={filePath} />;
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

    const ErrorBoundary = lazy(async () => {
        const { moduleResults } = requireModule(filePath);
        const { results } = await moduleResults;

        const moduleWithComp = results as {
            ErrorBoundary?: React.ComponentType;
        };
        return {
            default: () => {
                if (moduleWithComp.ErrorBoundary) {
                    onCaughtError({ filePath, exportName: 'ErrorBoundary' });
                    <moduleWithComp.ErrorBoundary />;
                }
                if (!isRootFile) {
                    throw new Error(`ErrorBoundary not found at ${filePath}`);
                }
                return <div>error boundary not found at {filePath}</div>;
            },
        };
    });

    return { Component, loader, ErrorBoundary };
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

import { DynamicImport, IAppManifest, IResults } from '@wixc3/app-core';
import { pathToRemixRouterUrl, RouteExtraInfo } from './remix-app-utils';
import { createRemixStub } from '@remix-run/testing';
import { lazy, useEffect, useState } from 'react';
import type { LoaderFunction } from '@remix-run/node';
import React from 'react';
import { useLocation, useNavigate } from '@remix-run/react';
import { navigation } from './navigation';

type RouteObject = Parameters<typeof createRemixStub>[0][0];

export const manifestToRouter = (
    manifest: IAppManifest<RouteExtraInfo>,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
) => {
    const rootFilePath = (manifest.homeRoute || manifest.routes[0])?.parentLayouts?.[0]?.layoutModule;
    if (!rootFilePath) {
        return {
            Router: createRemixStub([]),
            navigate(path: string) {
                navigation.navigate(path);
            },
        };
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

    return {
        Router,
        navigate(path: string) {
            navigation.navigate(path);
        },
    };
};
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

    navigation.setNavigateFunction(useNavigate());

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
        return (
            <moduleAsExpected.Layout>
                <Page />
            </moduleAsExpected.Layout>
        );
    }
    return <Page />;
}
function lazyCompAndLoader(
    filePath: string,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    wrapWithLayout = false,
) {
    const Component = lazy(async () => {
        let updateModule: ((newModule: IResults<unknown>) => void) | undefined = undefined;
        const { moduleResults } = requireModule(filePath, (newResults) => {
            updateModule?.(newResults);
        });
        const initialyLoadedModule = await moduleResults;
        const dispatcher = createDispatcher(initialyLoadedModule);
        updateModule = (newModule) => dispatcher.setState(newModule);
        return {
            default: () => {
                return (
                    <PageComp module={dispatcher} filePath={filePath} wrapWithLayout={wrapWithLayout} setUri={setUri} />
                );
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

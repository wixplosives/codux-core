import { DynamicImport, IAppManifest, ErrorReporter, IResults } from '@wixc3/app-core';
import {
    deserializeResponse,
    isSerializedResponse,
    RouteModuleInfo,
    SerializedResponse,
    serializeRequest,
} from './remix-app-utils';
import { createRemixStub } from '@remix-run/testing';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { ActionFunctionArgs, LinksFunction, LoaderFunction } from '@remix-run/node';
import React from 'react';
import { ClientActionFunction, ClientLoaderFunction, useLocation, useNavigate, useRevalidator } from '@remix-run/react';
import { createHandleProxy } from './handle-proxy';
import { createLinksProxy } from './links-proxy';
import { Navigation } from './navigation';
import { deserializeDeferredResult, isDeferredResult } from './defer';

type RouteObject = Parameters<typeof createRemixStub>[0][0];

export const manifestToRouter = (
    manifest: IAppManifest<RouteModuleInfo, undefined>,
    navigation: Navigation,
    requireModule: DynamicImport,
    onCaughtError: ErrorReporter,
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
) => {
    const routerData = manifest.extraData;

    const rootFilePath = routerData.file;
    const rootExports = routerData.exportNames;
    if (!rootFilePath || !rootExports) {
        return {
            Router: createRemixStub([]),
            navigate(path: string) {
                navigation.navigate(path);
            },
        };
    }
    const rootRoute: RouteObject = fileToRoute(
        '/',
        rootFilePath,
        rootExports,
        requireModule,
        onCaughtError,
        true,
        callServerMethod,
        navigation,
    );

    const addChildren = (route: RouteObject, children: RouteModuleInfo[]) => {
        route.children = children.map((child) => {
            const childRoute = fileToRoute(
                child.path,
                child.file,
                child.exportNames,
                requireModule,
                onCaughtError,
                false,
                callServerMethod,
                navigation,
            );
            addChildren(childRoute, child.children);
            return childRoute;
        });
    };
    addChildren(rootRoute, routerData.children);

    const Router = createRemixStub([rootRoute]);

    return {
        Router,
    };
};
const loadedModules = new Map<string, RouteObject>();
export const clearLoadedModules = () => {
    loadedModules.clear();
};
export const fileToRoute = (
    uri: string,
    filePath: string,
    exportNames: string[],
    requireModule: DynamicImport,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
    navigation: Navigation,
): RouteObject => {
    const key = filePath + '#' + exportNames.join(',');
    let module = loadedModules.get(key);
    if (!module) {
        module = nonMemoFileToRoute(
            uri,
            filePath,
            exportNames,
            requireModule,
            onCaughtError,
            isRootFile,
            callServerMethod,
            navigation,
        );
        loadedModules.set(key, module);
    }
    return module;
};

function RootComp({
    module,
    navigation,
    filePath,
}: {
    module: Dispatcher<IResults<unknown>>;
    navigation: Navigation;
    filePath: string;
}) {
    const revalidator = useRevalidator();
    const currentModule = useDispatcher(
        module,
        useCallback(() => {
            // invalidates loader data
            revalidator.revalidate();
        }, [revalidator]),
    );

    const { pathname, search = '', hash = '' } = useLocation();
    const uri = `${pathname}${search}${hash}`;

    navigation.setNavigateFunction(useNavigate());

    useEffect(() => {
        if (uri.slice(1) !== navigation.getCurrentPath()) {
            navigation.onPreviewNavigation(uri.slice(1));
        }
    }, [uri, navigation]);

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
    const revalidator = useRevalidator();
    const currentModule = useDispatcher(
        module,
        useCallback(() => {
            // invalidates loader data
            revalidator.revalidate();
        }, [revalidator]),
    );
    const location = useLocation();
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

    return <Page key={location.pathname} />;
}
function HydrateFallbackComp({ module, filePath }: { module: Dispatcher<IResults<unknown>>; filePath: string }) {
    const currentModule = useDispatcher(module);
    const location = useLocation();
    if (currentModule.errorMessage) {
        return <div>{currentModule.errorMessage}</div>;
    }
    const moduleAsExpected = currentModule.results as {
        HydrateFallbackComp?: React.ComponentType;
    };
    const HydrateFallbackComp = moduleAsExpected.HydrateFallbackComp;

    if (!HydrateFallbackComp) {
        return <div>HydrateFallbackComp export not found at {filePath}</div>;
    }

    return <HydrateFallbackComp key={location.pathname} />;
}
function nonMemoFileToRoute(
    uri: string,
    filePath: string,
    exportNames: string[],
    requireModule: DynamicImport,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
    navigation: Navigation,
): RouteObject {
    const { handle, setHandle } = createHandleProxy();
    const { linksWrapper, setLinks } = createLinksProxy();

    const importModuleAndUpdate: DynamicImport = (filePath, cb) => {
        const { moduleResults, dispose } = requireModule(filePath, (newResults) => {
            setHandle((newResults.results as { handle?: unknown }).handle);
            const linksFunction = (newResults.results as { links?: LinksFunction }).links;
            if (linksFunction) {
                setLinks(linksFunction);
            }
            cb?.(newResults);
        });
        const results = moduleResults.then((res) => {
            if (res.status === 'ready') {
                setHandle((res.results as { handle?: unknown }).handle);
                const linksFunction = (res.results as { links?: LinksFunction }).links;
                if (linksFunction) {
                    setLinks(linksFunction);
                }
            }
            return res;
        });
        return { moduleResults: results, dispose };
    };

    const Component = lazy(async () => {
        let updateModule: ((newModule: IResults<unknown>) => void) | undefined = undefined;
        const { moduleResults } = importModuleAndUpdate(filePath, (newResults) => {
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
                            <RootComp navigation={navigation} module={dispatcher} filePath={filePath} />
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

    const serverLoader: LoaderFunction = async ({ params, request }) => {
        const res = await callServerMethod(filePath, 'loader', [
            { params, request: await serializeRequest(request), context: { defineAppMode: true } },
        ]);
        if (isSerializedResponse(res)) {
            const desRes = deserializeResponse(res);
            return isDeferredResult(desRes) ? await deserializeDeferredResult(desRes) : desRes;
        } else {
            return res;
        }
    };
    const serverAction = async ({ params, request }: ActionFunctionArgs) => {
        const res = await callServerMethod(filePath, 'action', [
            { params, request: await serializeRequest(request), context: { defineAppMode: true } },
        ]);
        const desRes = deserializeResponse(res as SerializedResponse);
        return isDeferredResult(desRes) ? deserializeDeferredResult(desRes) : desRes;
    };
    const loader: LoaderFunction | undefined = exportNames.includes('clientLoader')
        ? async ({ params, request }) => {
              const lastResults: { current: IResults<unknown> } = { current: { status: 'loading', results: null } };
              const { moduleResults } = importModuleAndUpdate(filePath, (updated) => {
                  lastResults.current = updated;
              });

              const initialyLoadedModule = await moduleResults;
              lastResults.current = initialyLoadedModule;
              if (initialyLoadedModule.status !== 'ready') {
                  throw new Error(initialyLoadedModule.errorMessage);
              }
              return (lastResults.current.results as { clientLoader?: ClientLoaderFunction }).clientLoader?.({
                  params,
                  request,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  serverLoader: () => serverLoader({ params, request, context: {} }) as Promise<any>,
              });
          }
        : exportNames.includes('loader')
          ? serverLoader
          : undefined;

    if (loader && !exportNames.includes('loader')) {
        (loader as { hydrate?: boolean }).hydrate = true;
    }
    const ErrorBoundary = exportNames.includes('ErrorBoundary')
        ? lazy(async () => {
              const { moduleResults } = requireModule(filePath);
              const { results } = await moduleResults;

              const routeModule = results as {
                  ErrorBoundary?: React.ComponentType;
                  Layout?: React.ComponentType;
              };
              return {
                  default: () => (
                      <ErrorPage
                          filePath={filePath}
                          routeModule={routeModule}
                          onCaughtError={onCaughtError}
                          navigation={navigation}
                          isRootFile={isRootFile}
                      />
                  ),
              };
          })
        : undefined;

    const action = exportNames.includes('clientAction')
        ? async ({ params, request }: ActionFunctionArgs) => {
              const lastResults: { current: IResults<unknown> } = { current: { status: 'loading', results: null } };
              const { moduleResults } = importModuleAndUpdate(filePath, (updated) => {
                  lastResults.current = updated;
              });

              const initialyLoadedModule = await moduleResults;
              lastResults.current = initialyLoadedModule;
              if (initialyLoadedModule.status !== 'ready') {
                  throw new Error(initialyLoadedModule.errorMessage);
              }
              return (lastResults.current.results as { clientAction?: ClientActionFunction }).clientAction?.({
                  params,
                  request,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  serverAction: () => serverAction({ params, request, context: {} }) as Promise<any>,
              });
          }
        : exportNames.includes('action')
          ? serverAction
          : undefined;
    const HydrateFallback = exportNames.includes('HydrateFallback')
        ? lazy(async () => {
              let updateModule: ((newModule: IResults<unknown>) => void) | undefined = undefined;
              const { moduleResults } = importModuleAndUpdate(filePath, (newResults) => {
                  updateModule?.(newResults);
              });
              const initialyLoadedModule = await moduleResults;
              const dispatcher = createDispatcher(initialyLoadedModule);
              updateModule = (newModule) => dispatcher.setState(newModule);

              return {
                  default: () => {
                      return <HydrateFallbackComp module={dispatcher} filePath={filePath} />;
                  },
              };
          })
        : undefined;
    const links: LinksFunction | undefined = exportNames.includes('links') ? linksWrapper : undefined;
    return { Component, loader, ErrorBoundary, action, path: uri, handle, HydrateFallback, links };
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
function useDispatcher<T>(dispatcher: Dispatcher<T>, onChange?: (newValue: T) => void) {
    const [state, setState] = useState(dispatcher.getState());
    useEffect(() => {
        return dispatcher.subscribe((newValue) => {
            setState(newValue);
            onChange?.(newValue);
        });
    }, [dispatcher, onChange]);
    return state;
}

function ErrorPage({
    navigation,
    routeModule,
    filePath,
    onCaughtError,
    isRootFile,
}: {
    navigation: Navigation;
    routeModule: {
        ErrorBoundary?: React.ComponentType;
        Layout?: React.ComponentType<{ children?: React.ReactNode }>;
    };
    onCaughtError: ErrorReporter;
    filePath: string;
    isRootFile: boolean;
}) {
    navigation.setNavigateFunction(useNavigate());
    useEffect(() => {
        onCaughtError({ filePath, exportName: 'ErrorBoundary' });
    }, [filePath, onCaughtError]);

    const errorContent = routeModule.ErrorBoundary ? (
        <routeModule.ErrorBoundary />
    ) : (
        <div>error boundary not found at {filePath}</div>
    );

    if (isRootFile && routeModule.Layout) {
        const Layout = routeModule.Layout;
        return <Layout>{errorContent}</Layout>;
    } else {
        return errorContent;
    }
}

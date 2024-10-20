import { DynamicImport, IAppManifest, ErrorReporter, IResults } from '@wixc3/app-core';
import {
    deserializeResponse,
    isSerializedResponse,
    RouteModuleInfo,
    SerializedResponse,
    serializeRequest,
} from './remix-app-utils';
import { createRemixStub } from '@remix-run/testing';
import { lazy, Suspense, useEffect, useState } from 'react';
import type { ActionFunctionArgs, LinksFunction, LoaderFunction } from '@remix-run/node';
import React from 'react';
import { ClientActionFunction, ClientLoaderFunction, useLocation, useNavigate } from '@remix-run/react';
import { navigation } from './navigation';
import { createHandleProxy } from './handle-proxy';
import { createLinksProxy } from './links-proxy';

type RouteObject = Parameters<typeof createRemixStub>[0][0];

export const manifestToRouter = (
    manifest: IAppManifest<RouteModuleInfo, undefined>,
    requireModule: DynamicImport,
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    prevUri: { current: string },
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
        setUri,
        onCaughtError,
        true,
        prevUri,
        callServerMethod,
    );

    const addChildren = (route: RouteObject, children: RouteModuleInfo[]) => {
        route.children = children.map((child) => {
            const childRoute = fileToRoute(
                child.path,
                child.file,
                child.exportNames,
                requireModule,
                setUri,
                onCaughtError,
                false,
                prevUri,
                callServerMethod,
            );
            addChildren(childRoute, child.children);
            return childRoute;
        });
    };
    addChildren(rootRoute, routerData.children);

    const Router = createRemixStub([rootRoute]);

    return {
        Router,
        navigate(path: string) {
            navigation.navigate(path);
        },
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
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
): RouteObject => {
    const key = filePath + '#' + exportNames.join(',');
    let module = loadedModules.get(key);
    if (!module) {
        module = nonMemoFileToRoute(
            uri,
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
    setUri: (uri: string) => void,
    onCaughtError: ErrorReporter,
    isRootFile = false,
    prevUri: { current: string },
    callServerMethod: (filePath: string, methodName: string, args: unknown[]) => Promise<unknown>,
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

    const serverLoader: LoaderFunction = async ({ params, request }) => {
        const res = await callServerMethod(filePath, 'loader', [{ params, request: await serializeRequest(request) }]);
        return isSerializedResponse(res) ? deserializeResponse(res) : res;
    };
    const serverAction = async ({ params, request }: ActionFunctionArgs) => {
        const res = await callServerMethod(filePath, 'action', [{ params, request: await serializeRequest(request) }]);
        return deserializeResponse(res as SerializedResponse);
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

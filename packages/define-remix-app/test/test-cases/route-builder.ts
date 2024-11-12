import type { LinksFunction } from '@remix-run/node';
import { expect } from 'chai';
import ts from 'typescript';

function transformTsx(source: string) {
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.React,
        },
    });
    return outputText;
}

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

interface RouteSourceOptions {
    component?: boolean;
    componentName?: string;
    componentCode?: string | { hooks?: string; jsx?: string; remixRunReactImports?: string[] };
    errorBoundary?: boolean;
    loader?: JSONValue;
    loaderDelay?: number;
    loaderDefer?: boolean;
    clientLoader?: JSONValue;
    clientLoaderDelay?: number;
    clientLoaderHydrate?: boolean;
    links?: ReturnType<LinksFunction>;
    handle?: JSONValue;
    extraModuleCode?: string;
    imports?: { specifier: string; namedImports: string[] }[];
}
interface RootSourceOptions extends RouteSourceOptions {
    layout?: boolean;
    layoutMock?: boolean;
}

export const rootSource = ({ layout = true, layoutMock = false, ...routeOptions }: RootSourceOptions) => {
    // root defaults
    routeOptions.errorBoundary ??= true;
    routeOptions.componentName ??= 'App';

    if (layout) {
        routeOptions.imports ||= [];
        routeOptions.imports.push({ specifier: '@remix-run/react', namedImports: ['Links'] });
        const prefix = layoutMock ? 'mock-' : '';
        routeOptions.extraModuleCode ||= '';
        routeOptions.extraModuleCode += `
            export function Layout({ children }: { children: React.ReactNode }) {
                return (
                    <${prefix}html data-origin="root-layout">
                        <${prefix}head>
                            <Links/>
                        </${prefix}head>
                        <${prefix}body>
                            {children}
                        </${prefix}body>
                    </${prefix}html>
                );
            }
        `;
    }
    return pageSource(routeOptions);
};

export const pageSource = ({
    component = true,
    errorBoundary = false,
    componentName = 'Page',
    componentCode,
    loader,
    loaderDelay,
    loaderDefer,
    clientLoader,
    clientLoaderDelay,
    clientLoaderHydrate = false,
    links,
    handle,
    extraModuleCode,
    imports,
}: RouteSourceOptions) => {
    const remixRunReactImports = new Set<string>();
    const moduleCodeDefs = new Set<string>();

    if (links) {
        moduleCodeDefs.add(`
            export function links() {
                return ${JSON.stringify(links)};
            }
        `);
    }

    if (loader) {
        remixRunReactImports.add('useLoaderData');
        const delayLoader = loaderDelay ? `await new Promise((resolve) => setTimeout(resolve, ${loaderDelay}));` : '';
        if (!loaderDefer) {
            remixRunReactImports.add('json');
            moduleCodeDefs.add(`
                export ${loaderDelay ? 'async' : ''} function loader() {
                    ${delayLoader}
                    return json(${JSON.stringify(loader)});
                }
            `);
        } else {
            remixRunReactImports.add('defer');
            let defValue = '';
            for (const [key, value] of Object.entries(loader)) {
                const injectedVal = isPreservedCode(value) ? value.code : JSON.stringify(value);
                defValue += key + `: ` + injectedVal + ',\n';
            }
            moduleCodeDefs.add(`
                export ${loaderDelay ? 'async' : ''} function loader() {
                    ${delayLoader}
                    return defer({
                        ${defValue}
                });  
                }
            `);
        }
    }

    if (clientLoader) {
        remixRunReactImports.add('useLoaderData');
        const isAsync = clientLoaderHydrate || clientLoaderDelay;
        if (clientLoaderHydrate) {
            moduleCodeDefs.add(`
                export ${isAsync ? 'async' : ''} function clientLoader({serverLoader}) {
                    ${clientLoaderDelay ? `await new Promise((resolve) => setTimeout(resolve, ${clientLoaderDelay}));` : ''}
                    const serverResponse = await serverLoader();
                    const serverData = await serverResponse.json();
                    const clientData = ${JSON.stringify(clientLoader)};
                    return {...serverData, ...clientData};
                }
                clientLoader.hydrate = true;
            `);
        } else {
            moduleCodeDefs.add(`
                export ${isAsync ? 'async' : ''} function clientLoader() {
                    ${clientLoaderDelay ? `await new Promise((resolve) => setTimeout(resolve, ${clientLoaderDelay}));` : ''}
                    return ${JSON.stringify(clientLoader)};
                }
            `);
        }
    }

    if (handle) {
        moduleCodeDefs.add(`
            export const handle = ${JSON.stringify(handle)};
        `);
    }

    if (component) {
        remixRunReactImports.add('Outlet');
        if (typeof componentCode === 'string') {
            moduleCodeDefs.add(`
                export default function ${componentName}() {
                    ${componentCode}
                }
            `);
        } else {
            componentCode?.remixRunReactImports?.forEach((named) => remixRunReactImports.add(named));
            moduleCodeDefs.add(`
                export default function ${componentName}() {
                    ${componentCode?.hooks || ''}
                    ${loader || clientLoader ? `const loaderData = useLoaderData();` : ''}
                    return (
                        <div data-origin="${componentName}-page-component">
                            ${componentCode?.jsx || ''}
                            ${loader || clientLoader ? `<div id="${componentName}-loader-data">{JSON.stringify(loaderData)}</div>` : ''}
                            <Outlet/>
                        </div>
                    );
                }
            `);
        }
    }
    if (errorBoundary) {
        remixRunReactImports.add('useRouteError');
        moduleCodeDefs.add(`
            export function ErrorBoundary() {
            const error = useRouteError();
                return <div data-origin="${componentName}-page-error">${componentName} error</div>;
            }
        `);
    }

    if (extraModuleCode) {
        moduleCodeDefs.add(extraModuleCode);
    }

    const extraImports = new Set<string>();
    if (imports) {
        for (const { specifier, namedImports } of imports) {
            if (specifier === '@remix-run/react') {
                namedImports.forEach((named) => remixRunReactImports.add(named));
            } else {
                extraImports.add(`import {${namedImports.join(',')}} from '${specifier}';`);
            }
        }
    }

    return transformTsx(`
        import React from 'react';
        import {${[...remixRunReactImports].join(',')}} from '@remix-run/react';
        ${extraImports.size ? [...extraImports].join('\n') : ''}
        ${[...moduleCodeDefs].join('\n')}
    `);
};

type PreservedCode = { code: string; __preserveAsCode: true };

export function preserveStringAsCode(code: string): PreservedCode {
    return { code, __preserveAsCode: true };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPreservedCode(val: any): val is PreservedCode {
    return (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof val === 'object' && val !== null && typeof val.code === 'string' && val.__preserveAsCode === true
    );
}

export const expectRoute = async (root: HTMLElement, pageComponentName: string) => {
    const pageRootExpectedAttr = `[data-origin="${pageComponentName}-page-component"]`;
    await expect(() => root.querySelector(pageRootExpectedAttr), `in ${pageComponentName} page`).retry().to.exist;
};
export const expectRootLayout = async (root: HTMLElement) => {
    const rootLayoutExpectedAttr = `[data-origin="root-layout"]`;
    await expect(() => root.querySelector(rootLayoutExpectedAttr), `root layout rendered`).retry().to.exist;
};
export const expectRouteError = async (root: HTMLElement, pageComponentName: string) => {
    const pageRootExpectedAttr = `[data-origin="${pageComponentName}-page-error"]`;
    await expect(() => root.querySelector(pageRootExpectedAttr), `in ${pageComponentName} page error`).retry().to.exist;
};
export const expectLoaderData = async (root: HTMLElement, componentName: string, data: JSONValue) => {
    await expect(() => {
        const loaderDataEl = root.querySelector(`#${componentName}-loader-data`) as HTMLElement;
        return loaderDataEl.textContent;
    })
        .retry()
        .to.include(JSON.stringify(data));
};

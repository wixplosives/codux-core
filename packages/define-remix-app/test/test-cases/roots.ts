import ts from'typescript';

function transformTsx(source: string) {
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.React,
        }
    });
    return outputText;
}

export const rootWithLayout = transformTsx(`
    import React from 'react';
    import {
        Outlet,
    } from '@remix-run/react';
    export function Layout({ children }: { children: React.ReactNode }) {
        return (
            <html lang="en">
                <body>
                    {children}
                </body>
            </html>
        );
    }
    export default function App() {
        return (
            <Outlet />
        );
    }
`);
export const rootWithLayoutAndErrorBoundary = transformTsx(`
    import React from 'react';
    import {
        Outlet,
    } from '@remix-run/react';
    export function Layout({ children }: { children: React.ReactNode }) {
        return (
            <html lang="en">
                <body>
                    {children}
                </body>
            </html>
        );
    }
    export function ErrorBoundary({ error }: { error: Error }) {
        return <div>{error.message}</div>;
    }
    export default function App() {
        return (
            <Outlet />
        );
    }
`);
export const simpleRoot = transformTsx(`
    import React from 'react';
    import {
        Outlet,
    } from '@remix-run/react';
    
    export default function App() {
        return (
            <Outlet />
        );
    }
`);
export const simpleLayout = transformTsx(`
    import React from 'react';
    import {
        Outlet,
    } from '@remix-run/react';
    export default function Layout() {
        return (
            <Outlet />
        );
    }
`);

export const layoutWithErrorBoundary = transformTsx(`
    import React from 'react';
    import {
        Outlet,
    } from '@remix-run/react';
    export function ErrorBoundary({ error }: { error: Error }) {
        return <div>{error.message}</div>;
    }
    export default function Layout() {
        return (
            <Outlet />
        );
    }
`);

export const loaderOnly = transformTsx(`
    export async function loader() {
        return { message: 'Hello World' };
    }
`);

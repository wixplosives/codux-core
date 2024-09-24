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

export const rootWithLayout = {
    contents: transformTsx(`
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
    `),
    exports: new Set(['Layout', 'default']),
};
export const rootWithLayoutAndErrorBoundary = {
    contents: transformTsx(`
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
    `),
    exports: new Set(['Layout', 'ErrorBoundary', 'default']),
};
export const simpleRoot = {
    contents: transformTsx(`
        import React from 'react';
        import {
            Outlet,
        } from '@remix-run/react';
      
        export default function App() {
            return (
                <Outlet />
            );
        }
    `),
    exports: new Set(['default']),
};
export const simpleLayout = {
    contents: transformTsx(`
        import React from 'react';
        import {
            Outlet,
        } from '@remix-run/react';
        export default function Layout() {
            return (
                <Outlet />
            );
        }
    `),
    exports: new Set(['default']),
};

export const layoutWithErrorBoundary = {
    contents: transformTsx(`
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
    `),
    exports: new Set(['default', 'ErrorBoundary']),
};

export const loaderOnly = {
    contents: transformTsx(`
        export async function loader() {
            return { message: 'Hello World' };
        }
    `),
    exports: new Set(['loader']),
};

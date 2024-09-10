export const rootWithLayout = {
    contents: `
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
    `,
    exports: new Set(['default', 'Layout']),
};
export const rootWithLayoutAndErrorBoundary = {
    contents: `
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
    `,
    exports: new Set(['default', 'Layout', 'ErrorBoundary']),
};
export const simpleRoot = {
    contents: `
       import {
            Outlet,
        } from '@remix-run/react';
      
        export default function App() {
            return (
                <Outlet />
            );
        }
    `,
    exports: new Set(['default']),
};
export const simpleLayout = {
    contents: `
        import {
            Outlet,
        } from '@remix-run/react';
        export default function Layout() {
            return (
                <Outlet />
            );
        }
    `,
    exports: new Set(['default']),
};

export const layoutWithErrorBoundary = {
    contents: `
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
    `,
    exports: new Set(['default', 'ErrorBoundary']),
};

export const loaderOnly = {
    contents: `
        export async function loader() {
            return { message: 'Hello World' };
        }
    `,
    exports: new Set(['loader']),
};

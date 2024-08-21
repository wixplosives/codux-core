export const simpleRootWithLayout = {
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

export const loaderOnly = {
    contents: `
        export async function loader() {
            return { message: 'Hello World' };
        }
    `,
    exports: new Set(['loader']),
};

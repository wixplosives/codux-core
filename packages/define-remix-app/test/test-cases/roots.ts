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

export const rootWithLayout2 = transformTsx(`
    import React from 'react';
    import { Outlet, Links } from '@remix-run/react';

    export function Layout({ children }: { children: React.ReactNode }) {
        return (
            <mock-ml lang="en">
                <mock-header><Links/></mock-header>
                <mock-body>
                    Layout|
                    {children}
                </mock-body>
            </mock-ml>
        );
    }
    export default function App() {
        return (
            <div>
                App|
                <Outlet />
            </div>
        );
    }

    export function ErrorBoundary({ error }: { error: Error }) {
        return <div>Error</div>;
    }
`);
export const withHandle = (originalSrc: string, name: string) => {
    return `
    ${originalSrc}
    export const handle = {
        name: '${name}',
    }
    `;
};

export const clientLoaderWithFallbackPage = (name: string, clientMessage: string) =>
    transformTsx(`
    import React from 'react';
    import { Outlet, useLoaderData } from '@remix-run/react';
    const loaderPromise = new Promise((resolve) => {
        const globalListener = () => {
            resolve();
            globalThis.removeEventListener('load-data', globalListener);
        }

        globalThis.addEventListener('load-data',globalListener)
    });
    export const clientLoader = async () => {
        await loaderPromise;
        return { clientMessage: '${clientMessage}', }
    };
    export function HydrateFallback() {
        return <p>Loading Data...</p>;
    }
    export default function ${name}() {
        const data = useLoaderData();
        return <div>${name}:{data.message}!{data.clientMessage}|<Outlet /></div>;
    }
`);

export const deferedActionPage = (name: string, initialResposne: string, delayedResponse: string) =>
    transformTsx(`
import React from 'react';        
import { defer } from '@remix-run/server-runtime';
import { Await, useActionData, Form } from '@remix-run/react';
import { Suspense } from 'react';

// Simulate an API call with some delay
const fetchDelayedData = () =>
    new Promise<string>((resolve) =>
        setTimeout(() => resolve('${delayedResponse}'), 200)
    );



export const action = async () => {
    const immediateData = '${initialResposne}'
    const delayedDataPromise = fetchDelayedData();

    return defer({
        immediateData,
        delayedData: delayedDataPromise,
    });
};

// Component that uses the loader data
export default function ${name}() {
    const { immediateData, delayedData } = useActionData<typeof loader>() || {};

    return (
        <div>
            <h1>${name}:</h1>

            <p>{immediateData}!</p>
       
            <Suspense fallback={<p>Loading delayed data...</p>}>
                <Await resolve={delayedData}>{(loadedData) => <p>{loadedData}</p>}</Await>
            </Suspense>
            <Form method="post">
                <button type="submit">Send</button>
            </Form>
        </div>
    );
}
`);
const userApi = ` const userNames = new Map<string, {
        fullName: string;
        email: string;
    }>();

    export const action = async ({ request, params }: LoaderFunctionArgs) => {
        const nickname = params.nickname;
        const existing = userNames.has(nickname);
        const body = await request.formData();
        const newEmail = body.get('email');
        const newFullName = body.get('fullName');
        if (newEmail && newFullName) {
            userNames.set(nickname, { email: newEmail, fullName: newFullName });
            return json({
                message: existing ? 'User updated' : 'User created',
            })
        }
       
    };

    export const loader = async ({ params }: LoaderFunctionArgs) => {
        const nickname = params.nickname;
        const user = userNames.get(nickname);
        if (user) {
            return {
                exists: true,
                user,
            };
        }
        return {
            exists: false,
        };
      
    };`;
export const userApiPage = transformTsx(`
    import React from 'react';
    import { Outlet, Form,  json ,} from '@remix-run/react';
    

    ${userApi}
   
`);

export const actionPage = (name: string) =>
    transformTsx(`
    import React from 'react';
    import { Outlet, Form, useLoaderData, useActionData, json ,} from '@remix-run/react';
    
    ${userApi}
    export default function ${name}() {
        const data = useLoaderData();        
        const actionData = useActionData();
        return <div>
        ${name}|<Outlet />

            <p>{data.exists ? 'User exists' : 'User does not exist'}</p>
            <Form method="post">
                <input type="text" name="fullName" />
                <input type="text" name="email" />

                <button type="submit">Send</button>
            </Form>
            <p>{actionData?.message}</p>
        </div>;
    }
`);
export const userApiConsumer = (apiRoute: string) =>
    transformTsx(`
    import React, { useEffect } from 'react';
    import { Outlet, Form, useFetcher,   } from '@remix-run/react';

    export default function UserPage() {
    
        const fetcher = useFetcher();
        useEffect(()=>{
        fetcher.load("${apiRoute}");
        })
        const data = fetcher.data || {};

        const actionFetcher = useFetcher();
        const actionData = actionFetcher.data || {};
        return <div>
        UserPage|<Outlet />

            <p>{data.exists ? 'User exists' : 'User does not exist'}</p>
            <actionFetcher.Form method="post" action="${apiRoute}">
                <input type="text" name="fullName" />
                <input type="text" name="email" />

                <button type="submit">Send</button>
            </actionFetcher.Form>
            <p>{actionData?.message}</p>
        </div>;
    }
`);

export const clientActionPage = (name: string) =>
    transformTsx(`
    import React from 'react';
    import { Outlet, Form, useLoaderData, useActionData, json } from '@remix-run/react';
    

    const userNames = new Map<string, {
        fullName: string;
        email: string;
    }>();

    export const action = async ({ request, params }: LoaderFunctionArgs) => {
        const nickname = params.nickname;
        const existing = userNames.has(nickname);
        const body = await request.formData();
        const newEmail = body.get('email');
        const newFullName = body.get('fullName');
        if (newEmail && newFullName) {
            userNames.set(nickname, { email: newEmail, fullName: newFullName });
            return json({
                message: existing ? 'User updated' : 'User created',
            })
        }
       
    };
    export const clientAction = async ({
        request,
        params,
        serverAction,
        }: ClientActionFunctionArgs) => {
        const serverResponse = await serverAction();
        const data = await serverResponse.json();
        return {
            ...data,
            clientMessage: 'client action data',
        };
    };

    export const loader = async ({ params }: LoaderFunctionArgs) => {
        const nickname = params.nickname;
        const user = userNames.get(nickname);
        if (user) {
            return {
                exists: true,
                user,
            };
        }
        return {
            exists: false,
        };
      
    };
    export default function ${name}() {
        const data = useLoaderData();        
        const actionData = useActionData();
        return <div>
        ${name}|<Outlet />

            <p>{actionData?.message}!</p>
            <p>{actionData?.clientMessage}</p>
            <p>{data.exists ? 'User exists' : 'User does not exist'}</p>
            <Form method="post">
                <input type="text" name="fullName" />
                <input type="text" name="email" />

                <button type="submit">Send</button>
            </Form>
          
        </div>;
    }
`);

export const coduxActionPage = (name: string) =>
    transformTsx(`
    import React from 'react';
    import { Outlet, Form, useLoaderData, useActionData, json } from '@remix-run/react';
    
    export const coduxAction = async ({ request }: ActionFunctionArgs) => {
        return json({ message: 'Codux action message' })
    };

    export const action = async ({ request }: ActionFunctionArgs) => {
        return json({ message: 'Real action message' })
    };

    export default function ${name}() {
        const actionData = useActionData();
        return <div>
        ${name}|<Outlet />
            <p>{actionData?.message}</p>
            <Form method="post">
                <button type="submit">Send</button>
            </Form>
        </div>;
    }
`);

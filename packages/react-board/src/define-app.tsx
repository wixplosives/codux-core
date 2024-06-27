import { IRenderableMetadataBase } from '@wixc3/board-core';
import { reactErrorHandledRendering } from './react-error-handled-render';
import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type fetchModule = (relativePath: string) => Promise<any>;

export interface ClientAppProps {
    fetchModule: fetchModule;
    URI: string;
    setURI: (uri: string) => void;
}

export interface IClientApp extends IRenderableMetadataBase {
    App: React.ComponentType<ClientAppProps>;
    render: (targetElement: HTMLElement, props: ClientAppProps) => Promise<() => void>;
}

export const defineApp = (app: Omit<IClientApp, 'render'>): IClientApp => {
    return {
        ...app,
        render(target, props) {
            const App = app.App;
            const element = <App {...props}></App>;
            return reactErrorHandledRendering(element, target);
        },
    };
};

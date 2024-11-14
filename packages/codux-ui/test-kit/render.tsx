import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createTestDisposables, withTimeout } from '@wixc3/testing';

const ResolveOnMount = ({ children, onMount }: React.PropsWithChildren<{ onMount: () => void }>) => {
    useEffect(onMount);
    return <>{children}</>;
};

export function createRenderer() {
    const disposables = createTestDisposables();

    return async (
        reactElement: React.ReactElement,
        container: HTMLElement = document.body.appendChild(document.createElement('div')),
    ) => {
        const root = createRoot(container);
        disposables.add('render', () => {
            root.unmount();
            container.remove();
        });

        await withTimeout(
            new Promise<void>((resolve) => {
                root.render(<ResolveOnMount onMount={resolve}>{reactElement}</ResolveOnMount>);
            }),
        )
            .timeout(3000)
            .description('rendering');

        const rerender = (newElement: React.ReactElement) => {
            return withTimeout(
                new Promise<void>((resolve) => {
                    root.render(<ResolveOnMount onMount={resolve}>{newElement}</ResolveOnMount>);
                }),
            )
                .timeout(3000)
                .description('rerendering');
        };

        return { container, rerender };
    };
}

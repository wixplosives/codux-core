import React from 'react';
import ReactDOMClient from 'react-dom/client';

const reactRootByContainer = new WeakMap<HTMLElement, ReactDOMClient.Root>();

export const reactErrorHandledRendering = async (element: React.ReactElement, container: HTMLElement) => {
    const reactRoot = reactRootByContainer.get(container) || ReactDOMClient.createRoot(container);
    reactRootByContainer.set(container, reactRoot);

    const cleanup = () => {
        reactRoot.unmount();
        reactRootByContainer.delete(container);
    };

    try {
        await new Promise<void>((resolve, reject) => {
            reactRoot.render(
                <ErrorBoundary onRender={resolve} reportError={reject}>
                    {element}
                </ErrorBoundary>,
            );
        });
    } catch (e) {
        cleanup();
        throw e;
    }

    return cleanup;
};

interface ErrorBoundryProps {
    onRender?(): void;
    reportError?(error: unknown, errorInfo: React.ErrorInfo): void;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundryProps>, { hasError: boolean }> {
    public override state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    public override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
        this.props.reportError?.(error, errorInfo);
    }
    public override componentDidMount() {
        if (!this.state.hasError) {
            this.props.onRender?.();
        }
    }
    public override componentDidUpdate() {
        if (!this.state.hasError) {
            this.props.onRender?.();
        }
    }
    public override render() {
        return this.state.hasError ? null : this.props.children;
    }
}

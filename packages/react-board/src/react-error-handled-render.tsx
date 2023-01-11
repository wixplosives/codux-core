import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';

const reactRootByContainer = new WeakMap<HTMLElement, ReactDOMClient.Root>();

export const reactErrorHandledRendering = async (element: React.ReactElement, container: HTMLElement) => {
    if (ReactDOMClient.createRoot) {
        // react 18+
        const reactRoot = reactRootByContainer.get(container) || ReactDOMClient.createRoot(container);
        reactRootByContainer.set(container, reactRoot);
        await new Promise<void>((resolve, reject) => {
            reactRoot?.render(
                <ErrorBoundary onRender={resolve} reportError={reject}>
                    {element}
                </ErrorBoundary>
            );
        });
        return () => {
            reactRoot?.unmount();
            reactRootByContainer.delete(container);
        };
    } else {
        // react <18
        const cleanup = () => ReactDOM.unmountComponentAtNode(container);

        try {
            await new Promise<void>((resolve, reject) => {
                ReactDOM.render(<ErrorBoundary reportError={reject}>{element}</ErrorBoundary>, container, resolve);
            });
        } catch (e) {
            /**
             * If an error occurs during ReactDOM.render(), React 17 will keep
             * _reactRootContainer property attached to the container DOM node.
             * This property points to an a stale fiber object, which prevents
             * subsequent ReactDOM.render() calls from working.
             */
            cleanup();
            throw e;
        }

        return cleanup;
    }
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
        this.props.onRender?.();
    }
    public override componentDidUpdate() {
        this.props.onRender?.();
    }
    public override render() {
        return this.state.hasError ? null : this.props.children;
    }
}

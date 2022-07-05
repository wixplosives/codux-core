import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';

export const reactErrorHandledRendering = async (element: React.ReactElement, container: HTMLElement) => {
    const reactRoot = ReactDOMClient.createRoot
        ? ReactDOMClient.createRoot(container)
        : createReactLegacyRoot(container);
    await new Promise<void>((resolve, reject) => {
        reactRoot.render(
            <ErrorBoundary onMount={resolve} reportError={reject}>
                {element}
            </ErrorBoundary>
        );
    });
    return () => reactRoot.unmount();
};

interface ErrorBoundryProps {
    onMount?(): void;
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
        this.props.onMount?.();
    }
    public override render() {
        return this.state.hasError ? null : this.props.children;
    }
}

// react-dom@<=17 didn't have createRoot, so we polyfill one that uses previous APIs
function createReactLegacyRoot(container: HTMLElement) {
    return {
        render(children: React.ReactElement) {
            ReactDOM.render(children, container);
        },
        unmount() {
            ReactDOM.unmountComponentAtNode(container);
        },
    };
}

import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMClient from 'react-dom/client';

let reactRoot: ReactDOMClient.Root | undefined = undefined;

export const reactErrorHandledRendering = async (element: React.ReactElement, container: HTMLElement) => {
    if (ReactDOMClient.createRoot) {
        // react 18+
        reactRoot = reactRoot || ReactDOMClient.createRoot(container);
        await new Promise<void>((resolve, reject) => {
            reactRoot?.render(
                <ErrorBoundary onMount={resolve} reportError={reject}>
                    {element}
                </ErrorBoundary>
            );
        });
        return () => {
            reactRoot?.unmount();
            reactRoot = undefined;
        };
    } else {
        // react <18
        await new Promise<void>((resolve, reject) => {
            ReactDOM.render(<ErrorBoundary reportError={reject}>{element}</ErrorBoundary>, container, resolve);
        });
        return () => ReactDOM.unmountComponentAtNode(container);
    }
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
    public override componentDidUpdate() {
        this.props.onMount?.();
    }
    public override render() {
        return this.state.hasError ? null : this.props.children;
    }
}

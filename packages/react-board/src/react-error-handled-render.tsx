import React from 'react';
import ReactDOM from 'react-dom';

export const reactErrorHandledRendering = (element: JSX.Element, container: HTMLElement) =>
    new Promise<void>((resolve, reject) => {
        ReactDOM.render(<ErrorBoundary reportError={reject}>{element}</ErrorBoundary>, container, resolve);
    });

class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{ reportError?(error: unknown, errorInfo: React.ErrorInfo): void }>,
    { hasError: boolean }
> {
    public override state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }
    public override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
        this.props.reportError?.(error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

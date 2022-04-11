import React, { ErrorInfo, useEffect, PropsWithChildren } from 'react';
import ReactDOM from 'react-dom/client';

export const reactErrorHandledRendering = (element: JSX.Element, container: HTMLElement) =>
    new Promise<void>((resolve, reject) => {
        const AppWithCallbackAfterRender = () => {
            useEffect(() => {
              resolve
            });
            return <ErrorBoundary reportError={reject}>{element}</ErrorBoundary>
        }
        const root = ReactDOM.createRoot(container)
        root.render(<AppWithCallbackAfterRender/>);
    });

class ErrorBoundary extends React.Component<PropsWithChildren<
    { reportError?(error: unknown, errorInfo: ErrorInfo): void }>,
    { hasError: boolean }
> {
    public override state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }
    public override componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        this.props.reportError?.(error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            return null;
        }
        return this.props.children;
    }
}

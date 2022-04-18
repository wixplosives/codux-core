import React, { ErrorInfo, PropsWithChildren } from 'react';
import type ReactDOM from 'react-dom/client';

export const reactErrorHandledRendering = (element: JSX.Element, root: ReactDOM.Root) =>
    new Promise<void>((resolve, reject) => {root.render(<div ref={()=>{resolve()}}><ErrorBoundary reportError={reject}>{element}</ErrorBoundary></div>)})

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

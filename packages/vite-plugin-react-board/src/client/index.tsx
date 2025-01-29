import ReactDOM from 'react-dom/client';
import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class BoardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }


    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div>
                    <p>{this.state.error?.message || "An unexpected error occurred."}</p>
                </div>
            );
        }

        return this.props.children;
    }
}


export function BoardRenderer() {
    const LazyBoard =
        React.lazy(async () => {
            await import('virtual:codux/board-setup/before');
            const boardExport = await import('virtual:codux/board');
            await import('virtual:codux/board-setup/after')

            return {
                default: boardExport.default.Board
            };
        })


    return (
        <BoardErrorBoundary >
            <React.Suspense>
                <LazyBoard />
            </React.Suspense>
        </BoardErrorBoundary>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <BoardRenderer />
    </React.StrictMode>,
);

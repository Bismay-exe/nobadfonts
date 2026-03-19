import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-destructive)/0.1)] p-8">
                    <div className="bg-[rgb(var(--color-background))] p-8 rounded-4xl shadow-xl max-w-2xl w-full border-2 border-[rgb(var(--color-destructive)/0.2)]">
                        <h1 className="text-3xl font-bold text-[rgb(var(--color-destructive))] mb-4">Something went wrong</h1>
                        <div className="bg-[rgb(var(--color-muted)/0.1)] p-4 rounded-xl overflow-auto mb-4">
                            <p className="font-mono text-[rgb(var(--color-destructive))] font-bold mb-2">
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <pre className="font-mono text-xs text-[rgb(var(--color-muted-foreground))] whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                        <button
                            className="bg-[rgb(var(--color-destructive))] text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-colors"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

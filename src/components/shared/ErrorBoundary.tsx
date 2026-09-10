import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

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
        console.error('[NoBadFonts ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] p-6 selection:bg-[rgb(var(--color-foreground))] selection:text-[rgb(var(--color-background))]">
                    <div className="max-w-xl w-full bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6">
                        
                        {/* Icon Badge */}
                        <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--color-destructive)/0.1)] text-[rgb(var(--color-destructive))] flex items-center justify-center mx-auto">
                            <AlertTriangle size={32} />
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.25em] font-mono text-[rgb(var(--color-muted-foreground))]">
                                Application Error
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[rgb(var(--color-foreground))]">
                                Something went off-spec
                            </h1>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))] leading-relaxed max-w-md mx-auto">
                                An unexpected rendering exception occurred. You can reload the page or navigate safely back to the catalog.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[rgb(var(--color-foreground))] text-[rgb(var(--color-background))] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
                            >
                                <RefreshCw size={16} />
                                <span>Reload Page</span>
                            </button>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-foreground))] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[rgb(var(--color-foreground)/0.05)] active:scale-95 transition-all"
                            >
                                <Home size={16} />
                                <span>Return to Home</span>
                            </button>
                        </div>

                        {/* Collapsible Technical Details */}
                        {this.state.error && (
                            <details className="text-left pt-4 border-t border-[rgb(var(--color-border))] group">
                                <summary className="cursor-pointer text-xs font-mono text-[rgb(var(--color-muted-foreground))] flex items-center justify-between hover:text-[rgb(var(--color-foreground))] transition-colors select-none py-1">
                                    <span>Technical Details</span>
                                    <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="mt-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] p-4 rounded-xl overflow-x-auto max-h-60 text-xs font-mono space-y-2">
                                    <p className="text-[rgb(var(--color-destructive))] font-bold break-all">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo?.componentStack && (
                                        <pre className="text-[rgb(var(--color-muted-foreground))] whitespace-pre-wrap text-[11px] leading-relaxed">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

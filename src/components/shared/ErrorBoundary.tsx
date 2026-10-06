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
                <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 selection:bg-foreground selection:text-background">
                    <div className="max-w-xl w-full bg-card-background border border-border rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6">

                        {/* Icon Badge */}
                        <div className="w-16 h-16 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto">
                            <AlertTriangle size={32} />
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.25em] font-mono text-muted">
                                Application Error
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                Something went off-spec
                            </h1>
                            <p className="text-sm text-muted leading-relaxed max-w-md mx-auto">
                                An unexpected rendering exception occurred. You can reload the page or navigate safely back to the catalog.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
                            >
                                <RefreshCw size={16} />
                                <span>Reload Page</span>
                            </button>
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="w-full sm:w-auto px-6 py-3 rounded-full border border-border bg-background text-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-foreground/5 active:scale-95 transition-all"
                            >
                                <Home size={16} />
                                <span>Return to Home</span>
                            </button>
                        </div>

                        {/* Collapsible Technical Details */}
                        {this.state.error && (
                            <details className="text-left pt-4 border-t border-border group">
                                <summary className="cursor-pointer text-xs font-mono text-muted flex items-center justify-between hover:text-foreground transition-colors duration-300 ease-in-out select-none py-1">
                                    <span>Technical Details</span>
                                    <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="mt-3 bg-background border border-border p-4 rounded-xl overflow-x-auto max-h-60 text-xs font-mono space-y-2">
                                    <p className="text-warning font-bold break-all">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo?.componentStack && (
                                        <pre className="text-muted whitespace-pre-wrap text-[11px] leading-relaxed">
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

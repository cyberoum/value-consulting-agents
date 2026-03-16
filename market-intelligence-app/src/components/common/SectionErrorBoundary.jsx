import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Section-level error boundary — catches render errors in individual sections
 * without taking down the entire page. Shows a compact error card with retry.
 */
export default class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[SectionErrorBoundary] ${this.props.label || 'Section'} crashed:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-danger-subtle border border-danger/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-danger shrink-0" />
            <span className="text-xs font-bold text-danger">
              {this.props.label || 'This section'} failed to render
            </span>
          </div>
          <p className="text-[11px] text-fg-muted mb-3">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-[11px] font-bold hover:bg-danger/20 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

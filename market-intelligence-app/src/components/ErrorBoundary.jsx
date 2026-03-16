import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#e53e3e' }}>Something went wrong</h2>
          <pre style={{ background: '#f7f7f7', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '#/'; }}
            style={{ marginTop: 16, padding: '8px 20px', background: '#3366FF', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

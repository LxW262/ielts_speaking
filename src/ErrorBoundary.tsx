import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<any, any> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
            <h2 className="text-2xl font-semibold text-stone-800 mb-4">Something went wrong</h2>
            <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm text-left overflow-auto max-h-64 mb-6">
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-stone-800 text-white px-6 py-2 rounded-full hover:bg-stone-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

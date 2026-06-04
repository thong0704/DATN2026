import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(error, info) {
    console.error('App error boundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Đã có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-4">{this.state.message}</p>
          <button onClick={() => location.reload()} className="btn-primary">Tải lại trang</button>
        </div>
      );
    }
    return this.props.children;
  }
}

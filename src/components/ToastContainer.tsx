import { useApp } from '../state/AppState';

const ToastContainer = () => {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

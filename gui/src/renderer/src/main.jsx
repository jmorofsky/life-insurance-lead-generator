import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';
import App from './App';
import ErrorScreen from './components/ErrorScreen';
import './assets/main.css';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <ErrorScreen error={getErrorMessage(error)} />
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);

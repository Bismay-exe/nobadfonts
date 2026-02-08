import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </AuthProvider>
    </StrictMode>
);

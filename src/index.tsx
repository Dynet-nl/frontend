// React application entry point.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/pages.css';
import App from './App';
import { AuthProvider } from './context/AuthProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
    <BrowserRouter basename="/tool">
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
);

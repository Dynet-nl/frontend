// React application entry point with root component rendering and global setup.

import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import {AuthProvider} from './context/AuthProvider'
import {BrowserRouter} from 'react-router-dom'
import {createTheme, ThemeProvider} from '@mui/material/styles';
const theme = createTheme({
    components: {
        MuiButton: {
            defaultProps: {
                variant: 'contained',
            },
            styleOverrides: {
                root: {
                    height: '30px',
                },
            },
        },
    },
});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </ThemeProvider>
    </BrowserRouter>
);
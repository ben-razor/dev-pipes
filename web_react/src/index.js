import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from 'react-toast-notifications';

ReactDOM.render(
    <React.StrictMode>
        <AuthProvider>
          <ToastProvider>
            <App/>
          </ToastProvider>
        </AuthProvider>
    </React.StrictMode>,
    document.getElementById('root')
  );
  

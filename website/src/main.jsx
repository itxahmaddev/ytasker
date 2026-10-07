import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './pages/Landing';
import { ThemeProvider } from './context/ThemeContext';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/landing.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Landing />
    </ThemeProvider>
  </React.StrictMode>
);

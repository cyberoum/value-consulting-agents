import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CompareProvider } from './context/CompareContext';
import { ExportProvider } from './context/ExportContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <FavoritesProvider>
            <CompareProvider>
              <ExportProvider>
                <App />
              </ExportProvider>
            </CompareProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CompareProvider } from './context/CompareContext';
import { ExportProvider } from './context/ExportContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

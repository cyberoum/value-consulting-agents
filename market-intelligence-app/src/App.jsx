import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { LoadingState } from './components/common/DataState';

// Home page stays eagerly loaded (landing page, must be instant)
import HomePage from './pages/HomePage';

// All other pages are lazy-loaded — Vite creates separate chunks automatically
const MarketPage = lazy(() => import('./pages/MarketPage'));
const CountryPage = lazy(() => import('./pages/CountryPage'));
const BankPage = lazy(() => import('./pages/BankPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market/:marketKey" element={<Suspense fallback={<LoadingState />}><MarketPage /></Suspense>} />
        <Route path="/country/:countryName" element={<Suspense fallback={<LoadingState />}><CountryPage /></Suspense>} />
        <Route path="/bank/:bankKey" element={<Suspense fallback={<LoadingState />}><BankPage /></Suspense>} />
        <Route path="/compare" element={<Suspense fallback={<LoadingState />}><ComparePage /></Suspense>} />
        <Route path="/analytics" element={<Suspense fallback={<LoadingState />}><AnalyticsPage /></Suspense>} />
        <Route path="/favorites" element={<Suspense fallback={<LoadingState />}><FavoritesPage /></Suspense>} />
      </Route>
    </Routes>
  );
}

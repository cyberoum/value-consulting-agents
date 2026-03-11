import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import CountryPage from './pages/CountryPage';
import BankPage from './pages/BankPage';
import ComparePage from './pages/ComparePage';
import AnalyticsPage from './pages/AnalyticsPage';
import FavoritesPage from './pages/FavoritesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market/:marketKey" element={<MarketPage />} />
        <Route path="/country/:countryName" element={<CountryPage />} />
        <Route path="/bank/:bankKey" element={<BankPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Route>
    </Routes>
  );
}

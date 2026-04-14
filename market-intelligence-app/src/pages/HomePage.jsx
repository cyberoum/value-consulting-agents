import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NovaCanvas from '../components/nova/NovaCanvas';
import WarpTransition from '../components/nova/WarpTransition';

const ROUTE_MAP = {
  'Nordics': '/market/nordics',
  'UK & Ireland': '/market/uk_ireland',
  'Benelux': '/market/benelux',
  'DACH': '/market/dach',
  'Iberia': '/market/iberia',
  'GCC': '/market/mena',
  'SEA': '/market/sea',
  'Northwest Europe': '/market/nordics',
  'Southeast Europe': '/market/iberia',
  'Middle East': '/market/mena',
  'Africa': '/analytics',
  'North America': '/analytics',
  'LatAm': '/analytics',
  'APAC': '/market/sea',
  'ANZ': '/analytics',
};

export default function HomePage() {
  const navigate = useNavigate();
  const [warpActive, setWarpActive] = useState(false);
  const [warpDest, setWarpDest] = useState({ name: '', route: '' });

  const handleMarketClick = useCallback((name) => {
    const route = ROUTE_MAP[name] || '/analytics';
    setWarpDest({ name, route });
    setWarpActive(true);
  }, []);

  const handleWarpComplete = useCallback(() => {
    setWarpActive(false);
    navigate(warpDest.route);
  }, [navigate, warpDest]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <NovaCanvas onMarketClick={handleMarketClick} />
      <WarpTransition active={warpActive} onComplete={handleWarpComplete} destinationName={warpDest.name} />
    </div>
  );
}

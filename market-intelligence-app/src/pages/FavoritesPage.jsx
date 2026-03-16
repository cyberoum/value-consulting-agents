import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Building2, Globe, MapPin, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { BANK_DATA, COUNTRY_DATA, MARKETS_META, calcScore, scoreColor, scoreLabel, getMarketForCountry } from '../data/utils';

export default function FavoritesPage() {
  const { favorites, toggle } = useFavorites();
  const navigate = useNavigate();

  // Categorize favorites
  const bankFavs = favorites.filter(f => BANK_DATA[f]).map(key => {
    const bd = BANK_DATA[key];
    const score = calcScore(key);
    return { key, name: bd.bank_name, country: bd.country, score, type: 'bank' };
  });

  const countryFavs = favorites.filter(f => COUNTRY_DATA[f]).map(name => {
    const cd = COUNTRY_DATA[name];
    const marketKey = getMarketForCountry(name);
    return { key: name, name, tagline: cd.tagline || '', marketKey, type: 'country' };
  });

  const marketFavs = favorites.filter(f => MARKETS_META[f]).map(key => {
    const m = MARKETS_META[key];
    return { key, name: m.name, countryCount: m.countries.length, type: 'market' };
  });

  const totalFavs = bankFavs.length + countryFavs.length + marketFavs.length;

  if (totalFavs === 0) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <Heart size={48} className="mx-auto text-fg-disabled mb-4" />
        <h2 className="text-xl font-bold text-fg mb-2">No favorites yet</h2>
        <p className="text-sm text-fg-muted mb-6">
          Click the heart icon on any bank, country, or market to save it here for quick access.
        </p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          Explore Markets
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-fg-muted hover:text-primary mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Heart size={24} className="text-danger" fill="currentColor" />
        <div>
          <h1 className="text-3xl font-black text-fg">Favorites</h1>
          <p className="text-sm text-fg-muted">{totalFavs} saved items</p>
        </div>
      </div>

      {/* Bank Favorites */}
      {bankFavs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-fg uppercase tracking-wider">Banks ({bankFavs.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bankFavs.sort((a, b) => b.score - a.score).map(b => (
              <div
                key={b.key}
                className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div onClick={() => navigate(`/bank/${b.key}`)} className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-fg group-hover:text-primary transition-colors truncate">{b.name}</div>
                    <div className="text-xs text-fg-muted">{b.country}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-lg font-black" style={{ color: scoreColor(b.score) }}>{b.score}</span>
                      <div className="text-[10px] text-fg-muted">{scoreLabel(b.score)}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(b.key); }}
                      className="text-danger hover:text-danger/70 transition-colors"
                    >
                      <Heart size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${b.score * 10}%`, backgroundColor: scoreColor(b.score) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country Favorites */}
      {countryFavs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-fg uppercase tracking-wider">Countries ({countryFavs.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {countryFavs.map(c => (
              <div
                key={c.key}
                className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div onClick={() => navigate(`/country/${c.key}`)} className="flex-1">
                    <div className="text-sm font-bold text-fg group-hover:text-primary transition-colors">{c.name}</div>
                    <div className="text-xs text-fg-muted">{c.tagline}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(c.key); }}
                    className="text-danger hover:text-danger/70 transition-colors"
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Favorites */}
      {marketFavs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-fg uppercase tracking-wider">Markets ({marketFavs.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketFavs.map(m => (
              <div
                key={m.key}
                className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div onClick={() => navigate(`/market/${m.key}`)} className="flex-1">
                    <div className="text-sm font-bold text-fg group-hover:text-primary transition-colors">{m.name}</div>
                    <div className="text-xs text-fg-muted">{m.countryCount} countries</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(m.key); }}
                    className="text-danger hover:text-danger/70 transition-colors"
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

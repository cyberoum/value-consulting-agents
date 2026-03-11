import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('mi-favorites', []);

  const toggle = (item) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.key === item.key && f.type === item.type);
      if (exists) return prev.filter(f => !(f.key === item.key && f.type === item.type));
      return [...prev, item];
    });
  };

  const isFavorite = (key, type) => favorites.some(f => f.key === key && f.type === type);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);

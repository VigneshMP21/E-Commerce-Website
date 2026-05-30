import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlistIds = async () => {
    if (!user) {
      setWishlistIds([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/users/wishlist/ids');
      setWishlistIds(res.data.data || []);
    } catch {
      setWishlistIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistIds();
  }, [user]);

  const toggleWishlist = async (productId) => {
    const res = await api.post('/users/wishlist', { productId });
    const inWishlist = Boolean(res.data.data?.inWishlist);

    setWishlistIds(current => {
      if (inWishlist) {
        return current.includes(productId) ? current : [...current, productId];
      }
      return current.filter(id => id !== productId);
    });

    return { inWishlist, message: res.data.message };
  };

  return (
    <WishlistContext.Provider value={{
      wishlistIds,
      loading,
      isInWishlist: productId => wishlistIds.includes(productId),
      toggleWishlist,
      fetchWishlistIds
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

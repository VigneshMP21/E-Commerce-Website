import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart } from 'react-icons/hi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchWishlistIds } = useWishlist();

  useEffect(() => {
    api.get('/users/wishlist')
      .then(res => {
        setItems(res.data.data);
        fetchWishlistIds();
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleWishlistChange = (productId, inWishlist) => {
    if (!inWishlist) {
      setItems(current => current.filter(product => product.id !== productId));
    }
  };

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Wishlist' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Wishlist</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-2xl" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map(product => (
            <ProductCard key={product.id} product={product} onWishlistChange={handleWishlistChange} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineHeart size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Save items you love here</p>
          <Link to="/shop" className="btn-primary">Explore Products</Link>
        </div>
      )}
    </div>
  );
}

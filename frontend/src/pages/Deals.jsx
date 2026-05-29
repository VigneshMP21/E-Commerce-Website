import { useState, useEffect } from 'react';
import { HiOutlineFire, HiOutlineSparkles, HiOutlineShoppingBag } from 'react-icons/hi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function Deals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?sort=popular&limit=12')
      .then(res => setProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deals = products.filter(p => p.compare_price && p.compare_price > p.price);

  return (
    <div className="container-custom py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HiOutlineFire size={28} className="text-orange-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Hot Deals</h1>
        </div>
        <p className="text-gray-500">Limited time offers with exclusive discounts</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square skeleton rounded-2xl" />)}
        </div>
      ) : deals.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {deals.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <HiOutlineSparkles size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-medium mb-2">No active deals</h2>
          <p className="text-gray-500">Check back soon for new offers</p>
        </div>
      )}
    </div>
  );
}

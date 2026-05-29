import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/products/categories')
      .then(res => setCategories(res.data.data))
      .catch(console.error);
  }, []);

  const categoryImages = {
    'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
    'Fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
    'Home & Living': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    'Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
    'Books': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600',
    'Sports': 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=600'
  };

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Categories' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Shop by Category</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group card overflow-hidden">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img src={categoryImages[cat.name] || 'https://via.placeholder.com/600'} alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white font-bold text-xl">{cat.name}</h3>
                <p className="text-white/70 text-sm">{cat.product_count} products</p>
              </div>
            </div>
            {cat.subcategories?.length > 0 && (
              <div className="p-4 flex flex-wrap gap-2">
                {cat.subcategories.map(sub => (
                  <span key={sub.id} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{sub.name}</span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

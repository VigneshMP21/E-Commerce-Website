import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineArrowRight, HiOutlineShoppingBag, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiOutlineSupport } from 'react-icons/hi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductSkeleton from '../components/ui/Skeleton';

const features = [
  { icon: HiOutlineTruck, title: 'Free Shipping', desc: 'Free delivery on orders above $100' },
  { icon: HiOutlineShieldCheck, title: 'Secure Payment', desc: '100% secure transactions' },
  { icon: HiOutlineRefresh, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: HiOutlineSupport, title: '24/7 Support', desc: 'Round-the-clock assistance' }
];

const categories = [
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', slug: 'electronics', count: '2,500+' },
  { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', slug: 'fashion', count: '5,000+' },
  { name: 'Home & Living', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', slug: 'home-living', count: '1,200+' },
  { name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', slug: 'beauty', count: '800+' }
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/featured')
      .then(res => setFeaturedProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920')] bg-cover bg-center opacity-10" />
        <div className="container-custom relative py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Summer Sale is Live
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Discover Premium<br />
              <span className="text-primary-200">Products</span> You'll Love
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/80 mb-8 max-w-lg"
            >
              Shop the latest trends with exclusive discounts. Free shipping on all orders over $100.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98]">
                Shop Now <HiOutlineArrowRight size={20} />
              </Link>
              <Link to="/deals" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm active:scale-[0.98]">
                View Deals
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-custom -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="card p-4 md:p-6 flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <feature.icon size={24} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-custom py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-sm font-medium text-primary-600 uppercase tracking-wider">Featured</span>
            <h2 className="section-title mt-1">Popular Products</h2>
          </div>
          <Link to="/shop" className="btn-secondary text-sm !px-4 !py-2">
            View All <HiOutlineArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
            : featuredProducts.map(product => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))
          }
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-primary-600 uppercase tracking-wider">Categories</span>
            <h2 className="section-title mt-1">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/shop?category=${cat.slug}`} className="group relative block rounded-2xl overflow-hidden aspect-[4/5]">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="text-white font-bold text-lg md:text-xl">{cat.name}</h3>
                    <p className="text-white/70 text-sm">{cat.count} products</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container-custom py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-600 to-indigo-700 p-8 md:p-12 text-white text-center"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1553729459-afe8f4eeb7af?w=1200')] bg-cover bg-center opacity-10" />
          <div className="relative">
            <HiOutlineShoppingBag size={48} className="mx-auto mb-4 text-primary-200" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Newsletter</h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">Subscribe and get 10% off your first order. Be the first to know about new arrivals and exclusive deals.</p>
            <form className="flex max-w-md mx-auto gap-3">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 outline-none" />
              <button type="submit" className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-gray-100 transition-all">Subscribe</button>
            </form>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

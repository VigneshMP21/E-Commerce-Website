import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowRight,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineSupport,
  HiOutlineStar,
  HiOutlineFire,
  HiOutlineLightningBolt,
  HiOutlineGift,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import {
  FaBookOpen,
  FaCarSide,
  FaCouch,
  FaDesktop,
  FaFootballBall,
  FaGamepad,
  FaHome,
  FaLaptop,
  FaMobileAlt,
  FaMotorcycle,
  FaPalette,
  FaShoppingBag,
  FaTshirt,
  FaUtensils,
} from 'react-icons/fa';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductSkeleton from '../components/ui/Skeleton';
import heroImage1 from '../assets/home_images/image1.png';
import heroImage2 from '../assets/home_images/image2.png';
import heroImage3 from '../assets/home_images/image3.png';
import heroImage4 from '../assets/home_images/image4.png';
import heroImage5 from '../assets/home_images/image5.png';

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */
const features = [
  {
    icon: HiOutlineTruck,
    title: 'Free Shipping',
    desc: 'Free delivery on orders above $100',
    gradient: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Secure Payment',
    desc: '100% secure & encrypted transactions',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600',
  },
  {
    icon: HiOutlineRefresh,
    title: 'Easy Returns',
    desc: 'Hassle-free 30-day return policy',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600',
  },
  {
    icon: HiOutlineSupport,
    title: '24/7 Support',
    desc: 'Round-the-clock expert assistance',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    iconColor: 'text-rose-600',
  },
];

const categories = [
  {
    name: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
    slug: 'electronics',
    count: '2,500+',
    color: 'from-blue-600/80 to-indigo-900/90',
    tag: 'Top Picks',
  },
  {
    name: 'Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500',
    slug: 'fashion',
    count: '5,000+',
    color: 'from-rose-600/80 to-pink-900/90',
    tag: 'Trending',
  },
  {
    name: 'Home & Living',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
    slug: 'home-living',
    count: '1,200+',
    color: 'from-amber-600/80 to-orange-900/90',
    tag: 'New In',
  },
  {
    name: 'Beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
    slug: 'beauty',
    count: '800+',
    color: 'from-purple-600/80 to-violet-900/90',
    tag: 'Bestseller',
  },
  {
    name: 'Sports',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500',
    slug: 'sports',
    count: '1,800+',
    color: 'from-green-600/80 to-emerald-900/90',
    tag: 'Hot',
  },
  {
    name: 'Books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
    slug: 'books',
    count: '3,200+',
    color: 'from-sky-600/80 to-cyan-900/90',
    tag: 'Popular',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    text: 'Absolutely love the shopping experience! Products arrived exactly as described and the packaging was premium. Will definitely shop again!',
    product: 'Wireless Headphones',
  },
  {
    name: 'Marcus Lee',
    role: 'Loyal Customer',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
    text: 'The quality is unmatched and delivery was lightning fast. Their customer support resolved my query within minutes. Highly recommend!',
    product: 'Smart Watch',
  },
  {
    name: 'Priya Mehta',
    role: 'Fashion Enthusiast',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 5,
    text: 'Found my favourite fashion brands at amazing prices. The new arrivals section is always on point with the latest trends. 10/10!',
    product: 'Designer Handbag',
  },
  {
    name: 'James Carter',
    role: 'Tech Reviewer',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    rating: 5,
    text: 'Best e-commerce site for gadgets! Authentic products, competitive prices, and seamless checkout. Already ordered 5 times this month.',
    product: 'Gaming Laptop',
  },
];

const marqueeItems = [
  '🌟 1M+ Products Across 100+ Categories',
  '🔥 Mega Sale Event • Save Up to 70% Today',
  '⚡ Flash Deals • Live Daily at 12 PM',
  '🚚 Free Shipping • Orders Above $100',
  '🎁 New Collections • Trending Products Added Daily',
  '💎 Premium Quality • Trusted Global Brands',
  '🛡️ Secure Payments • Encrypted Checkout Protection',
  '🚀 Fast Delivery • Next-Day Shipping Available',
  '⭐ Highly Rated • Trusted by Thousands of Customers',
  '🔄 Easy Returns • Hassle-Free Refund Process',
  '🏆 Top-Rated Brands • Best-Selling Products',
  '🎯 Exclusive Member Benefits • Rewards & Discounts',
  '📦 Real-Time Tracking • Every Order Monitored',
  '💖 Personalized Picks • Curated Just for You',
  '🌍 Nationwide Shipping • Reliable Logistics Network',
  '🔔 Limited-Time Offers • Updated Every Hour'
];

const heroBackgroundImages = [heroImage1, heroImage2, heroImage3, heroImage4, heroImage5];

const topCategories = [
  { name: 'For You', icon: FaShoppingBag, to: '/shop', active: true },
  { name: 'Fashion', icon: FaTshirt, to: '/shop?category=fashion' },
  { name: 'Mobiles', icon: FaMobileAlt, to: '/shop?search=smartphone' },
  { name: 'Beauty', icon: FaPalette, to: '/shop?category=beauty' },
  { name: 'Electronics', icon: FaLaptop, to: '/shop?category=electronics' },
  { name: 'Home', icon: FaHome, to: '/shop?category=home-living' },
  { name: 'Appliances', icon: FaDesktop, to: '/shop?search=appliance' },
  { name: 'Toys', icon: FaGamepad, to: '/shop?search=toys' },
  { name: 'Food & Health', icon: FaUtensils, to: '/shop?search=health' },
  { name: 'Auto Acc.', icon: FaCarSide, to: '/shop?search=auto' },
  { name: '2 Wheelers', icon: FaMotorcycle, to: '/shop?search=2%20wheeler' },
  { name: 'Sports', icon: FaFootballBall, to: '/shop?category=sports' },
  { name: 'Books', icon: FaBookOpen, to: '/shop?category=books' },
  { name: 'Furniture', icon: FaCouch, to: '/shop?search=furniture' },
];

/* ═══════════════════════════════════════
   HOOKS
═══════════════════════════════════════ */
function useCountdown(targetDate) {
  const calc = () => {
    const diff = targetDate - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return {
      h: Math.floor((diff / 1000 / 60 / 60) % 24),
      m: Math.floor((diff / 1000 / 60) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

function useScrollReveal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return { ref, isInView };
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════ */

function HeroBackgroundMarquee({ image }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-primary-950">
      <AnimatePresence initial={false}>
        <motion.img
          key={image}
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain object-center"
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </AnimatePresence>
    </div>
  );
}

function CategoryShortcutBar() {
  return (
    <section className="relative z-20 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="w-full">
        <div className="scrollbar-hide flex w-full items-stretch justify-start gap-1 overflow-x-auto lg:justify-between">
          {topCategories.map(({ name, icon: Icon, to, active }) => (
            <Link
              key={name}
              to={to}
              className={`group relative flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1.5 py-3 text-center transition-all duration-200 ${
                active ? 'text-gray-950 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[1.05rem] shadow-sm transition-all duration-200 group-hover:-translate-y-0.5 ${
                  active
                    ? 'border-blue-200 bg-blue-50 text-gray-950 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-white'
                    : 'border-transparent bg-transparent text-gray-900 group-hover:border-gray-200 group-hover:bg-gray-50 dark:text-gray-100 dark:group-hover:border-gray-700 dark:group-hover:bg-gray-900'
                }`}
              >
                <Icon />
              </span>
              <span className="max-w-[5.25rem] truncate text-sm font-medium leading-none">{name}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-t-full bg-blue-600" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Marquee promotional banner
function MarqueeBanner() {
  const repeated = [...marqueeItems, ...marqueeItems];
  return (
    <div className="bg-gradient-to-r from-primary-600 via-violet-600 to-primary-700 py-2.5 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-primary-600 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-primary-700 to-transparent z-10 pointer-events-none" />
      <div className="marquee-container">
        <div className="marquee-track">
          {repeated.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-white text-sm font-medium px-8">
              {item}
              <span className="w-1 h-1 rounded-full bg-white/40 mx-2" />
            </span>
          ))}
        </div>
        <div className="marquee-track-dup" aria-hidden="true">
          {repeated.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-white text-sm font-medium px-8">
              {item}
              <span className="w-1 h-1 rounded-full bg-white/40 mx-2" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Countdown timer
function CountdownTimer({ target }) {
  const { h, m, s } = useCountdown(target);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="countdown-timer flex items-center gap-2">
      {[{ v: pad(h), l: 'HRS' }, { v: pad(m), l: 'MIN' }, { v: pad(s), l: 'SEC' }].map(({ v, l }, i) => (
        <div key={l} className="countdown-segment flex items-center gap-2">
          <div className="countdown-cell">
            <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">{v}</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-widest">{l}</span>
          </div>
          {i < 2 && <span className="countdown-separator text-xl font-bold text-primary-500 -mt-2">:</span>}
        </div>
      ))}
    </div>
  );
}

// Star rating display
function Stars({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <HiOutlineStar
          key={i}
          size={14}
          className={i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-700'}
          style={{ fill: i < count ? '#fbbf24' : 'none' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Home() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Deals countdown — end of today at midnight
  const dealTarget = useRef(
    (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    })()
  ).current;

  // Section reveal refs
  const { ref: featRef, isInView: featVisible } = useScrollReveal();
  const { ref: catRef, isInView: catVisible } = useScrollReveal();
  const { ref: testRef, isInView: testVisible } = useScrollReveal();

  useEffect(() => {
    api.get('/products?sort=popular&limit=32')
      .then((res) => setPopularProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHeroBgIndex((p) => (p + 1) % heroBackgroundImages.length), 3000);
    return () => clearInterval(id);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(id);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };

  // Framer motion variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
    }),
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: (i = 0) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' },
    }),
  };

  return (
    <div className="overflow-hidden">

      {/* ── Marquee Banner ── */}
      <MarqueeBanner />
      <CategoryShortcutBar />

      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section className="relative z-10 bg-gray-50 dark:bg-gray-950">
        <div className="w-full">
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-primary-950 shadow-2xl shadow-primary-950/10">
            <HeroBackgroundMarquee image={heroBackgroundImages[heroBgIndex]} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════ */}
      <section className="home-feature-section relative z-10 mx-auto -mt-12 max-w-6xl px-4 pb-6 pt-0 sm:-mt-14 sm:px-6 md:-mt-16 md:pb-8 lg:-mt-20 lg:px-8">
        <div className="home-feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="home-feature-card group flex min-h-[9.5rem] cursor-default flex-col items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-5 text-center shadow-xl shadow-primary-950/10 backdrop-blur-xl transition-all duration-300 hover:bg-white/90 dark:border-white/10 dark:bg-gray-950/65 dark:hover:bg-gray-900/80 md:p-6"
            >
              <div className={`home-feature-icon w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={26} className={f.iconColor} />
              </div>
              <h3 className="home-feature-title font-bold text-sm md:text-base text-gray-900 dark:text-white">{f.title}</h3>
              <p className="home-feature-desc text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          FLASH DEALS + COUNTDOWN
      ══════════════════════════════════ */}
      <section className="container-custom pb-16 pt-8 md:pb-24 md:pt-10" ref={featRef}>
        {/* Header */}
        <div className="popular-products-header flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="popular-products-title-block">
            <div className="popular-products-badge flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                <HiOutlineLightningBolt size={16} className="text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Flash Deals
                </span>
              </div>
            </div>
            <h2 className="popular-products-title section-title">
              Popular{' '}
              <span className="gradient-text">Products</span>
            </h2>
            <p className="popular-products-subtitle text-gray-500 dark:text-gray-400 text-sm mt-2">
              Curated picks just for you — limited stock available
            </p>
          </div>
          <div className="popular-products-countdown flex flex-col items-start sm:items-end gap-3">
            <div className="popular-products-countdown-label flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <HiOutlineFire size={18} className="text-rose-500" />
              Ends in
            </div>
            <CountdownTimer target={dealTarget} />
          </div>
        </div>

        {/* Products grid */}
        <motion.div
          initial="hidden"
          animate={featVisible ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        >
          {loading
            ? [...Array(12)].map((_, i) => <ProductSkeleton key={i} />)
            : popularProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -4 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </motion.div>

        {/* View all */}
        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] btn-shimmer"
          >
            Explore All Products
            <HiOutlineArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════
          CATEGORIES
      ══════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950/60" ref={catRef}>
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="section-eyebrow mb-3">Explore Collections</p>
            <h2 className="section-title">
              Shop by{' '}
              <span className="gradient-text">Category</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-md mx-auto text-sm">
              From cutting-edge electronics to the latest fashion — find everything you need in one place.
            </p>
          </div>

          {/* Grid — 2 large + 4 small */}
          <motion.div
            initial="hidden"
            animate={catVisible ? 'visible' : 'hidden'}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:auto-rows-[13rem] gap-4"
          >
            {categories.map((cat, i) => {
              const isLarge = i < 2;
              return (
                <motion.div
                  key={cat.name}
                  variants={scaleIn}
                  custom={i}
                  className={isLarge ? 'col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-2' : 'lg:col-span-1 lg:row-span-1'}
                >
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className={`group relative block h-full rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ${isLarge ? 'aspect-[3/4] lg:aspect-auto' : 'aspect-[4/5] lg:aspect-auto'}`}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />

                    {/* Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/30">
                        {cat.tag}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <h3 className="text-white font-black text-lg md:text-xl leading-tight">
                        {cat.name}
                      </h3>
                      <p className="text-white/70 text-xs mt-0.5">{cat.count} products</p>
                      <div className="flex items-center gap-1 mt-3 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Shop Now <HiOutlineArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          PROMO BANNER (Split)
      ══════════════════════════════════ */}
      <section className="container-custom py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Banner 1 */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl overflow-hidden h-64 md:h-72"
          >
            <img
              src="https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800"
              alt="New Collection"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">New Arrivals</span>
              <h3 className="text-white text-2xl md:text-3xl font-black mb-4 leading-tight">
                Summer<br />Collection 2026
              </h3>
              <Link
                to="/shop?category=fashion"
                className="inline-flex items-center gap-2 text-white text-sm font-semibold border border-white/40 px-5 py-2.5 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 w-fit"
              >
                Discover <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Banner 2 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            className="group relative rounded-3xl overflow-hidden h-64 md:h-72"
          >
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"
              alt="Tech Sale"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/60 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <span className="text-primary-300 text-xs font-bold uppercase tracking-widest mb-2">Limited Time</span>
              <h3 className="text-white text-2xl md:text-3xl font-black mb-1 leading-tight">
                Tech Deals
              </h3>
              <p className="text-white/70 text-sm mb-4">Up to 50% off premium electronics</p>
              <Link
                to="/shop?category=electronics"
                className="inline-flex items-center gap-2 text-white text-sm font-semibold border border-white/40 px-5 py-2.5 rounded-xl hover:bg-white hover:text-primary-700 transition-all duration-300 w-fit"
              >
                Shop Tech <HiOutlineArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════ */}
      <section ref={testRef} className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950/60 overflow-hidden">
        <div className="container-custom">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="section-eyebrow mb-3">Customer Reviews</p>
            <h2 className="section-title">
              What Our{' '}
              <span className="gradient-text">Customers</span>{' '}
              Say
            </h2>
          </div>

          {/* Cards */}
          <div className="relative">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  custom={i}
                  initial="hidden"
                  animate={testVisible ? 'visible' : 'hidden'}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className={`testimonial-card relative transition-all duration-300 ${
                    i === testimonialIdx
                      ? 'ring-2 ring-primary-500 shadow-xl shadow-primary-500/10'
                      : ''
                  }`}
                >
                  {/* Quote mark */}
                  <div className="absolute top-4 right-5 text-5xl text-gray-100 dark:text-gray-800 font-serif leading-none select-none">
                    "
                  </div>
                  <Stars count={t.rating} />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4 relative z-10">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role} · {t.product}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Indicator dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === testimonialIdx
                      ? 'w-8 h-2.5 bg-primary-600'
                      : 'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-primary-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          NEWSLETTER / CTA BANNER
      ══════════════════════════════════ */}
      <section className="container-custom py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-violet-700 to-purple-900" />
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1553729459-afe8f4eeb7af?w=1400')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-400/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />

          <div className="relative z-10 py-16 md:py-20 px-8 md:px-16 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm mb-6 animate-bounce-soft">
              <HiOutlineShoppingBag size={40} className="text-white" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4 border border-white/20">
              <HiOutlineGift size={16} className="text-amber-400" />
              Exclusive Member Offer
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              Get <span className="gradient-text-warm">10% OFF</span> Your First Order
            </h2>
            <p className="text-white/70 mb-10 max-w-lg mx-auto text-base md:text-lg leading-relaxed">
              Subscribe to our newsletter and be the first to hear about new arrivals,
              exclusive deals, and style inspiration.
            </p>

            <AnimatePresence mode="wait">
              {subscribed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3 text-white font-semibold text-lg"
                >
                  <HiOutlineCheckCircle size={28} className="text-green-400" />
                  You're subscribed! Check your inbox 🎉
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row max-w-md mx-auto gap-3"
                >
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-5 py-4 rounded-2xl text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium bg-white"
                    required
                  />
                  <button
                    type="submit"
                    className="px-7 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:shadow-xl active:scale-[0.98] whitespace-nowrap btn-shimmer"
                  >
                    Subscribe Free
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-white/40 text-xs mt-4">
              No spam ever. Unsubscribe at any time. 💌
            </p>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════
          BOTTOM BRAND STRIP
      ══════════════════════════════════ */}
      <section className="border-t border-gray-100 dark:border-gray-800 py-10 bg-white dark:bg-gray-950">
        <div className="container-custom">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
            Trusted by top brands worldwide
          </p>
          <div className="marquee-container opacity-50 dark:opacity-30">
            {['NIKE', 'APPLE', 'SAMSUNG', 'SONY', 'ADIDAS', 'PUMA', 'LG', 'CANON', 'DELL', 'HP', 'ASUS', 'LENOVO', 'ACER', 'MICROSOFT', 'GOOGLE', 'ONEPLUS', 'XIAOMI', 'OPPO', 'VIVO', 'REALME', 'HUAWEI', 'INTEL', 'AMD', 'NVIDIA', 'BOSE', 'JBL', 'PANASONIC', 'PHILIPS', 'TOSHIBA', 'NOKIA'].map((b, idx) => (
              <div key={idx} className="marquee-track">
                <span className="inline-block px-10 text-2xl font-black text-gray-400 dark:text-gray-600 tracking-tight whitespace-nowrap">
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

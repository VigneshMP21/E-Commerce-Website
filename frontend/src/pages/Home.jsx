import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import {
  HiOutlineArrowRight,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineSupport,
  HiOutlineStar,
  HiOutlineFire,
  HiOutlineSparkles,
  HiOutlineLightningBolt,
  HiOutlineGift,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import ProductSkeleton from '../components/ui/Skeleton';

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

const stats = [
  { value: '50K+', label: 'Happy Customers', icon: HiOutlineShoppingBag },
  { value: '10K+', label: 'Products Listed', icon: HiOutlineSparkles },
  { value: '99%', label: 'Satisfaction Rate', icon: HiOutlineStar },
  { value: '120+', label: 'Top Brands', icon: HiOutlineGift },
];

const marqueeItems = [
  '🔥 Summer Sale — Up to 70% OFF',
  '✨ Free Shipping on orders over $100',
  '⚡ Flash Deals Every Day at 12 PM',
  '🎁 New Arrivals Added Daily',
  '💎 Premium Quality Guaranteed',
  '🚀 Next-Day Delivery Available',
  '🛡️ Secure & Encrypted Checkout',
  '🌟 1 Million+ Products in Stock',
];

const heroSlides = [
  {
    badge: '🔥 Summer Sale — Up to 70% Off',
    title: 'Discover Premium',
    highlight: 'Products',
    subtitle: "You'll Love",
    desc: 'Shop the latest trends with exclusive discounts. Free shipping on all orders over $100.',
    cta: 'Shop Now',
    ctaLink: '/shop',
    bg: 'mesh-gradient',
    accentFrom: 'from-violet-400',
    accentTo: 'to-purple-300',
  },
  {
    badge: '⚡ Limited Time Flash Deals',
    title: 'Unbeatable',
    highlight: 'Deals',
    subtitle: 'Every Single Day',
    desc: 'Lightning-fast deals on top brands. Don\'t miss out — stocks are limited!',
    cta: 'View Deals',
    ctaLink: '/deals',
    bg: 'bg-gradient-to-br from-[#201f22] via-[#3f1c09] to-[#6b4529]',
    accentFrom: 'from-rose-400',
    accentTo: 'to-pink-300',
  },
  {
    badge: '✨ New Season, New Style',
    title: 'Fashion',
    highlight: 'Forward',
    subtitle: 'Collections 2026',
    desc: 'Explore curated fashion collections from top designers. Style meets affordability.',
    cta: 'Explore Fashion',
    ctaLink: '/shop?category=fashion',
    bg: 'bg-gradient-to-br from-[#201f22] via-[#6b4529] to-[#3f1c09]',
    accentFrom: 'from-amber-400',
    accentTo: 'to-orange-300',
  },
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

// Animated floating particles in hero
function Particles() {
  const particles = [
    { size: 80,  top: '10%', left: '5%',  delay: 0,   opacity: 0.15, color: '#e19b61' },
    { size: 120, top: '70%', left: '90%', delay: 2,   opacity: 0.10, color: '#ddb38a' },
    { size: 60,  top: '40%', left: '85%', delay: 1,   opacity: 0.20, color: '#e29645' },
    { size: 40,  top: '80%', left: '10%', delay: 3,   opacity: 0.12, color: '#e5d4c4' },
    { size: 90,  top: '15%', left: '70%', delay: 1.5, opacity: 0.08, color: '#b87a4a' },
    { size: 50,  top: '55%', left: '25%', delay: 2.5, opacity: 0.15, color: '#e19b61' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            top: p.top,
            left: p.left,
            backgroundColor: p.color,
            opacity: p.opacity,
            animation: `float ${6 + p.delay}s ease-in-out ${p.delay}s infinite`,
            filter: 'blur(2px)',
          }}
        />
      ))}
    </div>
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
    <div className="flex items-center gap-2">
      {[{ v: pad(h), l: 'HRS' }, { v: pad(m), l: 'MIN' }, { v: pad(s), l: 'SEC' }].map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-2">
          <div className="countdown-cell">
            <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums tracking-tight">{v}</span>
            <span className="text-[9px] font-bold text-gray-400 tracking-widest">{l}</span>
          </div>
          {i < 2 && <span className="text-xl font-bold text-primary-500 -mt-2">:</span>}
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
          style={{ fill: i < count ? '#e29645' : 'none' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);

  // Deals countdown — end of today at midnight
  const dealTarget = useRef(
    (() => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.getTime();
    })()
  ).current;

  // Section reveal refs
  const { ref: statsRef, isInView: statsVisible } = useScrollReveal();
  const { ref: featRef, isInView: featVisible } = useScrollReveal();
  const { ref: catRef, isInView: catVisible } = useScrollReveal();
  const { ref: testRef, isInView: testVisible } = useScrollReveal();

  useEffect(() => {
    api.get('/products/featured')
      .then((res) => setFeaturedProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate hero slides
  useEffect(() => {
    const id = setInterval(() => setHeroSlide((p) => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = heroSlides[heroSlide];

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

      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section className={`relative min-h-[90vh] flex items-center ${slide.bg} overflow-hidden`}>
        <Particles />

        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

        {/* Background product image */}
        <div
          className="absolute right-0 bottom-0 w-[55%] h-full opacity-25 lg:opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to left, rgba(32,31,34,0.8) 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(32,31,34,0.8) 0%, transparent 100%)',
          }}
        />

        <div className="container-custom relative z-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlide}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold text-white mb-7 glass-card">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_6px_2px_rgba(226,150,69,0.6)]" />
                  {slide.badge}
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 text-white">
                  {slide.title}{' '}
                  <span className={`gradient-text`}>{slide.highlight}</span>
                  <br />
                  <span className="text-white/70 text-4xl md:text-5xl font-bold">{slide.subtitle}</span>
                </h1>

                <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                  {slide.desc}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={slide.ctaLink}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/20 active:scale-[0.98] btn-shimmer"
                  >
                    {slide.cta}
                    <HiOutlineArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </Link>
                  <Link
                    to="/deals"
                    className="btn-ghost-white gap-2"
                  >
                    <HiOutlineFire size={20} className="text-amber-400" />
                    Hot Deals
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 mt-10">
                  {[
                    { icon: HiOutlineCheckCircle, text: 'Authentic Products' },
                    { icon: HiOutlineShieldCheck, text: 'Buyer Protection' },
                    { icon: HiOutlineTruck, text: 'Fast Delivery' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-white/60 text-sm">
                      <Icon size={16} className="text-green-400" />
                      {text}
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === heroSlide
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Slide arrows */}
        <button
          onClick={() => setHeroSlide((p) => (p - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
        >
          <HiOutlineChevronLeft size={20} />
        </button>
        <button
          onClick={() => setHeroSlide((p) => (p + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
        >
          <HiOutlineChevronRight size={20} />
        </button>
      </section>

      {/* ══════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════ */}
      <section className="container-custom -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="card p-5 md:p-6 flex flex-col items-center text-center gap-3 cursor-default group"
            >
              <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={26} className={f.iconColor} />
              </div>
              <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS SECTION
      ══════════════════════════════════ */}
      <section
        ref={statsRef}
        className="mt-16 md:mt-24 relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-violet-700 to-purple-800" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="container-custom relative py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                animate={statsVisible ? 'visible' : 'hidden'}
                variants={scaleIn}
                onHoverStart={() => setHoveredStat(i)}
                onHoverEnd={() => setHoveredStat(null)}
                className="stat-card relative overflow-hidden"
              >
                {hoveredStat === i && (
                  <div className="absolute inset-0 bg-white/10 rounded-2xl" />
                )}
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
                  <stat.icon size={28} className="text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-black text-white">{stat.value}</span>
                <span className="text-sm text-white/70 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FLASH DEALS + COUNTDOWN
      ══════════════════════════════════ */}
      <section className="container-custom py-16 md:py-24" ref={featRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                <HiOutlineLightningBolt size={16} className="text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Flash Deals
                </span>
              </div>
            </div>
            <h2 className="section-title">
              Popular{' '}
              <span className="gradient-text">Products</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Curated picks just for you — limited stock available
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {loading
            ? [...Array(8)].map((_, i) => <ProductSkeleton key={i} />)
            : featuredProducts.map((product, i) => (
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
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {categories.map((cat, i) => {
              const isLarge = i < 2;
              return (
                <motion.div
                  key={cat.name}
                  variants={scaleIn}
                  custom={i}
                  className={isLarge ? 'col-span-1 md:col-span-1 lg:col-span-2 row-span-1' : ''}
                >
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="group relative block rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
                    style={{ aspectRatio: isLarge ? '3/4' : '4/5' }}
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
            <div className="absolute inset-0 bg-gradient-to-r from-primary-950/85 via-primary-950/55 to-transparent" />
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
            {['NIKE', 'APPLE', 'SAMSUNG', 'SONY', 'ADIDAS', 'PUMA', 'LG', 'CANON', 'DELL', 'HP'].map((b, idx) => (
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

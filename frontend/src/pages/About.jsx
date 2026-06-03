import { Link } from 'react-router-dom';
import {
  HiOutlineBadgeCheck,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineSupport,
  HiOutlineTruck,
  HiOutlineUsers
} from 'react-icons/hi';
import heroImage from '../assets/home_images/image2.png';

const stats = [
  { label: 'Verified customers', value: '50K+', icon: HiOutlineUsers },
  { label: 'Curated products', value: '10K+', icon: HiOutlineShoppingBag },
  { label: 'Orders delivered', value: '100K+', icon: HiOutlineTruck },
  { label: 'Average rating', value: '4.8/5', icon: HiOutlineStar }
];

const promises = [
  {
    icon: HiOutlineBadgeCheck,
    title: 'Authentic selection',
    desc: 'Every product is reviewed for quality, brand fit and customer value before it reaches the catalog.',
    accent: 'bg-indigo-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Secure checkout',
    desc: 'Encrypted payments, protected account access and clear order records keep every purchase dependable.',
    accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
  },
  {
    icon: HiOutlineTruck,
    title: 'Reliable delivery',
    desc: 'Orders are packed carefully, tracked from dispatch and supported by a responsive fulfillment workflow.',
    accent: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300'
  },
  {
    icon: HiOutlineRefresh,
    title: 'Simple returns',
    desc: 'Clear return windows and helpful support make post-purchase service straightforward and transparent.',
    accent: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300'
  }
];

const orderFlow = [
  { icon: HiOutlineSparkles, title: 'Curate', desc: 'We organize practical, trend-aware collections across fashion, electronics and lifestyle essentials.' },
  { icon: HiOutlineClipboardCheck, title: 'Verify', desc: 'Product details, pricing and availability are checked so customers can buy with confidence.' },
  { icon: HiOutlineCube, title: 'Fulfill', desc: 'Each order moves through a structured packing, dispatch and tracking process.' },
  { icon: HiOutlineSupport, title: 'Support', desc: 'Customers can reach us before or after purchase for help with orders, returns and product questions.' }
];

const serviceHighlights = [
  { icon: HiOutlineClock, text: 'Fast response support' },
  { icon: HiOutlineCheckCircle, text: 'Quality-first catalog' },
  { icon: HiOutlineShieldCheck, text: 'Protected payments' }
];

export default function About() {
  return (
    <div className="bg-white dark:bg-gray-950">
      <section className="container-custom py-6 md:py-8">
        <div className="relative min-h-[430px] overflow-hidden rounded-2xl bg-gray-950">
          <img
            src={heroImage}
            alt="Curated premium products from V Shop"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-gray-950/10" />

          <div className="relative flex min-h-[430px] max-w-3xl flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
            <span className="mb-4 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              Trusted online shopping
            </span>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">About V Shop</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200 md:text-lg">
              V Shop is built for customers who want a polished, dependable shopping experience:
              curated products, transparent prices, secure checkout and service that stays useful after delivery.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="btn-primary w-full justify-center sm:w-auto">
                Explore Products
              </Link>
              <Link to="/contact" className="btn-secondary w-full justify-center !border-white/25 !bg-white/10 !text-white hover:!bg-white/20 sm:w-auto">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-custom pb-14">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(stat => (
            <div key={stat.label} className="card p-5 text-center md:p-6">
              <stat.icon size={26} className="mx-auto mb-3 text-primary-600" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-14 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="container-custom">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Why shoppers choose us</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">Professional commerce, practical service</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              A strong e-commerce experience is more than product listing. We focus on the full path from discovery to delivery.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {promises.map(item => (
              <div key={item.title} className="card p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.accent}`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-custom py-14">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Our operating standard</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">A clear path for every order</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400 leading-7">
              We structure the shopping journey around confidence: useful product information,
              careful fulfillment and accessible support when customers need help.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {serviceHighlights.map(item => (
                <div key={item.text} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 text-sm font-medium text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  <item.icon size={18} className="text-primary-600" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {orderFlow.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                  <step.icon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Step {index + 1}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-custom pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gray-950 px-6 py-8 text-white md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="text-2xl font-bold">Ready to shop with confidence?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              Browse curated collections, track your orders and get support from one dependable e-commerce experience.
            </p>
          </div>
          <Link to="/shop" className="btn-primary w-full justify-center md:w-auto">
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

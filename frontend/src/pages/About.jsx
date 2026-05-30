import { Link } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh, HiOutlineLockClosed, HiOutlineStar, HiOutlineUsers } from 'react-icons/hi';

const stats = [
  { label: 'Happy Customers', value: '50K+', icon: HiOutlineUsers },
  { label: 'Products', value: '10K+', icon: HiOutlineStar },
  { label: 'Orders Delivered', value: '100K+', icon: HiOutlineTruck },
  { label: 'Years', value: '5+', icon: HiOutlineLockClosed }
];

const values = [
  { icon: HiOutlineShieldCheck, title: 'Trust & Security', desc: 'Your data and transactions are always secure with us.' },
  { icon: HiOutlineTruck, title: 'Fast Delivery', desc: 'Free shipping on orders above $100 with express delivery options.' },
  { icon: HiOutlineRefresh, title: 'Easy Returns', desc: '30-day hassle-free return policy on all products.' },
  { icon: HiOutlineStar, title: 'Quality Products', desc: 'Curated selection of premium products from trusted brands.' }
];

export default function About() {
  return (
    <div className="container-custom py-6 md:py-8">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">About V Shop</h1>
        <p className="text-gray-500 text-lg leading-relaxed">
          We're on a mission to make premium shopping accessible to everyone. V Shop brings you
          the finest products from around the world with an exceptional shopping experience.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {stats.map(stat => (
          <div key={stat.label} className="card p-6 text-center">
            <stat.icon size={28} className="mx-auto mb-3 text-primary-600" />
            <p className="text-3xl font-bold text-primary-600">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {values.map(v => (
          <div key={v.title} className="card p-6 flex gap-4">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <v.icon size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{v.title}</h3>
              <p className="text-sm text-gray-500">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Ready to start shopping?</h2>
        <p className="text-gray-500 mb-6">Join thousands of happy customers</p>
        <Link to="/shop" className="btn-primary">Start Shopping</Link>
      </div>
    </div>
  );
}

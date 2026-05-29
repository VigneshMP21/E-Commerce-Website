import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';

const footerLinks = {
  shop: [
    { name: 'All Products', path: '/shop' },
    { name: 'New Arrivals', path: '/shop?sort=newest' },
    { name: 'Best Sellers', path: '/shop?sort=popular' },
    { name: 'Deals', path: '/deals' }
  ],
  account: [
    { name: 'My Account', path: '/dashboard' },
    { name: 'Orders', path: '/orders' },
    { name: 'Wishlist', path: '/wishlist' },
    { name: 'Cart', path: '/cart' }
  ],
  company: [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Privacy Policy', path: '#' },
    { name: 'Terms of Service', path: '#' }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="font-bold text-xl">ECW</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Premium e-commerce platform offering the finest products with exceptional shopping experience.
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-2"><HiOutlineMail /> support@ecwshop.com</p>
              <p className="flex items-center gap-2"><HiOutlinePhone /> +91 1800-ECW-SHOP</p>
              <p className="flex items-center gap-2"><HiOutlineLocationMarker /> Mumbai, India</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map(link => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-3">
              {footerLinks.account.map(link => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} ECW Shop. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

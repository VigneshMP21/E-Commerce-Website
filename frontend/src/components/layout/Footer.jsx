import { Link } from 'react-router-dom';
import {
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineSupport,
  HiOutlineTruck
} from 'react-icons/hi';
import { FaCcApplePay, FaCcMastercard, FaCcPaypal, FaCcVisa, FaGithub, FaInstagram, FaLinkedinIn, FaWhatsapp } from 'react-icons/fa';
import logo from '../../assets/images/logo.png';

const CONTACT_EMAIL = 'mpvignesh2107@gmail.com';
const CONTACT_PHONE = '+91 9393211095';
const CONTACT_ADDRESS = 'Bazar Street, Chinthala Pattadai, Nagari - 517590, Andhra Pradesh';

const serviceHighlights = [
  { icon: HiOutlineTruck, title: 'Fast Delivery', text: 'Reliable dispatch and tracking' },
  { icon: HiOutlineShieldCheck, title: 'Secure Payments', text: 'Encrypted checkout flow' },
  { icon: HiOutlineRefresh, title: 'Easy Returns', text: 'Clear return support' },
  { icon: HiOutlineSupport, title: 'Customer Care', text: 'Helpful support when needed' }
];

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
    { name: 'Categories', path: '/categories' },
    { name: 'Shop', path: '/shop' }
  ]
};

const socialLinks = [
  { name: 'Instagram', href: 'https://www.instagram.com/vignesh_mp_06/', icon: FaInstagram },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/vignesh-m-p-b7a60a373/', icon: FaLinkedinIn },
  { name: 'GitHub', href: 'https://github.com/VigneshMP21', icon: FaGithub },
  { name: 'WhatsApp', href: 'https://wa.me/919393211095/?text=Hi, I am interested in your website!', icon: FaWhatsapp }
];

const paymentIcons = [
  { name: 'Visa', icon: FaCcVisa },
  { name: 'Mastercard', icon: FaCcMastercard },
  { name: 'PayPal', icon: FaCcPaypal },
  { name: 'Apple Pay', icon: FaCcApplePay }
];

const FooterColumn = ({ title, links }) => (
  <div className="footer-column">
    <h3 className="footer-column-title text-sm font-semibold uppercase tracking-wider text-gray-900">{title}</h3>
    <ul className="mt-4 space-y-3">
      {links.map(link => (
        <li key={link.name}>
          <Link to={link.path} className="text-sm text-gray-500 transition-colors hover:text-primary-600">
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white text-gray-600">
      <div className="border-b border-gray-100 bg-primary-50/70">
        <div className="footer-service-grid container-custom grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {serviceHighlights.map(item => (
            <div key={item.title} className="footer-service-card flex items-start gap-3">
              <div className="footer-service-icon flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-primary-100 bg-white text-primary-600 shadow-sm">
                <item.icon size={22} />
              </div>
              <div>
                <p className="footer-service-title font-semibold text-gray-900">{item.title}</p>
                <p className="footer-service-text mt-1 text-sm text-gray-500">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom py-12 md:py-14">
        <div className="footer-main-grid grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr_1.25fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img src={logo} alt="V Shop logo" className="h-12 w-28 rounded-lg object-cover object-center" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-gray-500">
              V Shop brings curated products, secure checkout and dependable delivery together in one professional e-commerce experience.
            </p>

            <div className="footer-social-links mt-6 flex gap-3">
              {socialLinks.map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  aria-label={link.name}
                  className="footer-social-link flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
                >
                  <link.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="footer-link-columns">
            <FooterColumn title="Shop" links={footerLinks.shop} />
            <FooterColumn title="Account" links={footerLinks.account} />
            <FooterColumn title="Company" links={footerLinks.company} />
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">Contact</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-500">
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex gap-3 transition-colors hover:text-primary-600">
                <HiOutlineMail size={19} className="mt-0.5 flex-shrink-0 text-primary-600" />
                <span>{CONTACT_EMAIL}</span>
              </a>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="flex gap-3 transition-colors hover:text-primary-600">
                <HiOutlinePhone size={19} className="mt-0.5 flex-shrink-0 text-primary-600" />
                <span>{CONTACT_PHONE}</span>
              </a>
              <p className="flex gap-3 leading-6">
                <HiOutlineLocationMarker size={19} className="mt-0.5 flex-shrink-0 text-primary-600" />
                <span>{CONTACT_ADDRESS}</span>
              </p>
            </div>

            <Link to="/contact" className="mt-6 inline-flex rounded-xl border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-200 hover:bg-primary-100">
              Send a Message
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50">
        <div className="footer-bottom-content container-custom flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="footer-copyright text-sm text-gray-500">
            &copy; {new Date().getFullYear()} V Shop. All rights reserved.
          </p>

          <div className="footer-payment-row flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-500">Secure payments</span>
            <div className="flex items-center gap-2 text-3xl text-gray-500">
              {paymentIcons.map(item => (
                <item.icon key={item.name} title={item.name} />
              ))}
            </div>
          </div>

          <div className="footer-legal-links flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <a href="#" className="transition-colors hover:text-primary-600">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-primary-600">Terms</a>
            <a href="#" className="transition-colors hover:text-primary-600">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

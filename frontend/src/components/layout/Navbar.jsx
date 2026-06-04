import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineSearch,
  HiOutlineKey,
  HiOutlineShoppingBag,
  HiOutlineLocationMarker,
  HiOutlineShieldCheck,
  HiOutlineLogout
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/images/logo.png';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/shop' },
  { name: 'Deals', path: '/deals' },
  { name: 'Categories', path: '/categories' }
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-toggle lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            {mobileOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="V Shop logo"
              className="navbar-logo h-10 w-24 sm:h-14 sm:w-40 md:h-16 md:w-44 object-cover object-center"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="navbar-actions flex items-center gap-2 md:gap-3">
            {/* Search */}
            <button onClick={() => setSearchOpen(!searchOpen)} className="navbar-icon-button p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <HiOutlineSearch size={20} />
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="navbar-icon-button theme-toggle-button p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              {dark ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="navbar-icon-button p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <HiOutlineHeart size={20} />
            </Link>

            {/* Cart */}
            <Link to="/cart" className="navbar-icon-button relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <HiOutlineShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    {user.avatar ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <span className="text-primary-600 font-semibold text-sm">{user.name[0]}</span>}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-20 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <HiOutlineUser size={16} className="text-gray-400" />
                        Dashboard
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <HiOutlineShoppingBag size={16} className="text-gray-400" />
                        Orders
                      </Link>
                      <Link to="/addresses" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <HiOutlineLocationMarker size={16} className="text-gray-400" />
                        Address
                      </Link>
                      <Link to="/dashboard?tab=password" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <HiOutlineKey size={16} className="text-gray-400" />
                        Change Password
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <HiOutlineHeart size={16} className="text-gray-400" />
                        Wishlist
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                          <HiOutlineShieldCheck size={16} />
                          Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100 dark:border-gray-800" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <HiOutlineLogout size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="mobile-signin-button btn-primary text-sm px-4 py-2 !rounded-lg">Sign In</Link>
            )}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 animate-slide-down">
          <div className="container-custom py-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products or categories..."
                className="input-field flex-1"
                autoFocus
              />
              <button type="submit" className="btn-primary">
                <HiOutlineSearch size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 animate-slide-down">
          <div className="container-custom py-4 space-y-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path}
                className="block px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMobileOpen(false)}>
                {link.name}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="mobile-sidebar-theme-item w-full items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                  {dark ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
                </span>
                {dark ? 'Light Mode' : 'Dark Mode'}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Theme</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

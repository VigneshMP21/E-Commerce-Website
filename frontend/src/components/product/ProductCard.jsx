import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiHeart, HiOutlineHeart, HiOutlineShoppingCart, HiOutlineStar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, calculateDiscount, getImageUrl } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function HighlightText({ text, query }) {
  const value = String(text || '');
  const tokens = String(query || '')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1);

  if (!value || !tokens.length) return value;

  const matcher = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  return value.split(matcher).map((part, index) => {
    const matched = tokens.some(token => token.toLowerCase() === part.toLowerCase());
    return matched ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-100 px-0.5 text-gray-950 dark:bg-yellow-300/30 dark:text-yellow-100">
        {part}
      </mark>
    ) : part;
  });
}

export default function ProductCard({ product, onWishlistChange, searchQuery }) {
  const discount = calculateDiscount(product.price, product.compare_price);
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const inWishlist = isInWishlist(product.id);
  const loginRedirectState = { from: location.pathname + location.search };
  const highlightQuery = product.highlight_query || product.corrected_search || searchQuery || product.search_query || '';

  const redirectToLogin = (message) => {
    toast.error(message);
    navigate('/login', { state: loginRedirectState });
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      redirectToLogin('Please login to add this product to your wishlist.');
      return;
    }

    try {
      const result = await toggleWishlist(product.id);
      toast.success(result.message || (result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist'));
      onWishlistChange?.(product.id, result.inWishlist);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wishlist update failed');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      redirectToLogin('Please login to add this product to your cart.');
      return;
    }

    try {
      await addToCart(product.id, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const trackSearchClick = () => {
    if (!product.search_id) return;

    api.post('/products/search/click', {
      productId: product.id,
      query: product.search_query || searchQuery || '',
      searchId: product.search_id
    }).catch(() => {});
  };

  const HeartIcon = inWishlist ? HiHeart : HiOutlineHeart;

  return (
    <div className="group card overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
        <Link to={`/product/${product.slug}`} className="block h-full" onClick={trackSearchClick}>
          <img
            src={getImageUrl(product.images)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition-all duration-200 sm:opacity-0 sm:group-hover:opacity-100 ${
            inWishlist
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
              : 'bg-white/90 text-gray-600 hover:bg-white dark:bg-gray-900/90 dark:text-gray-400 dark:hover:bg-gray-900'
          }`}
        >
          <HeartIcon size={18} className={inWishlist ? 'fill-current' : ''} />
        </button>
        {discount > 0 && (
          <span className="absolute top-3 left-3 badge-danger text-xs font-bold">{discount}% OFF</span>
        )}
      </div>

      {/* Content */}
      <Link to={`/product/${product.slug}`} className="block p-4 space-y-2" onClick={trackSearchClick}>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <HighlightText text={product.category_name || product.brand || 'General'} query={highlightQuery} />
        </p>
        <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
          <HighlightText text={product.name} query={highlightQuery} />
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <HiOutlineStar size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-500">{product.rating || '0.0'}</span>
          <span className="text-xs text-gray-400">({product.review_count || 0})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
          {product.compare_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </Link>

      <div className="product-card-actions px-4 pb-4">
        <button type="button" onClick={handleAddToCart} className="add-to-cart-button btn-primary w-full gap-2 !py-2.5 text-sm">
          <HiOutlineShoppingCart size={17} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

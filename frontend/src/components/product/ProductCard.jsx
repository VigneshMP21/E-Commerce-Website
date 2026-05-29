import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiOutlineStar } from 'react-icons/hi';
import { formatPrice, calculateDiscount, getImageUrl } from '../../utils/helpers';

export default function ProductCard({ product }) {
  const discount = calculateDiscount(product.price, product.compare_price);

  return (
    <Link to={`/product/${product.slug}`} className="group card overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
        <img
          src={getImageUrl(product.images)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white dark:hover:bg-gray-900">
          <HiOutlineHeart size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
        {discount > 0 && (
          <span className="absolute top-3 left-3 badge-danger text-xs font-bold">{discount}% OFF</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{product.category_name || product.brand || 'General'}</p>
        <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.name}
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
      </div>
    </Link>
  );
}

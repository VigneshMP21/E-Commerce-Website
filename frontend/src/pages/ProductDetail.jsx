import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiHeart, HiOutlineShoppingCart, HiOutlineHeart, HiOutlineStar, HiOutlineMinus, HiOutlinePlus, HiOutlineCheck, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, calculateDiscount, formatDate, truncateText } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/product/ProductCard';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(res => setProduct(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleWishlistClick = async () => {
    if (!user) {
      toast.error('Please login to add this product to your wishlist.');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    try {
      const result = await toggleWishlist(product.id);
      toast.success(result.message || (result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wishlist update failed');
    }
  };

  const handleZoom = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 w-24 skeleton" />
            <div className="h-8 w-3/4 skeleton" />
            <div className="h-6 w-32 skeleton" />
            <div className="h-24 w-full skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const discount = calculateDiscount(product.price, product.compare_price);
  const images = product.images?.length ? product.images : ['https://via.placeholder.com/600'];
  const inWishlist = isInWishlist(product.id);
  const HeartIcon = inWishlist ? HiHeart : HiOutlineHeart;

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[
        { name: product.category_name, path: `/shop?category=${product.category_slug}` },
        { name: product.name }
      ]} />

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 cursor-crosshair"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={handleZoom}
          >
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {zoom && (
              <div className="absolute inset-0 bg-no-repeat bg-[length:200%] pointer-events-none"
                style={{
                  backgroundImage: `url(${images[selectedImage]})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`
                }}
              />
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge-danger text-sm font-bold">{discount}% OFF</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-primary-600 font-medium uppercase tracking-wider mb-1">{product.category_name}</p>
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <HiOutlineStar key={i} size={18} className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating} ({product.review_count} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compare_price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                <span className="badge-danger text-sm">Save {formatPrice(product.compare_price - product.price)}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-xl">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-l-xl">
                <HiOutlineMinus size={16} />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-r-xl">
                <HiOutlinePlus size={16} />
              </button>
            </div>
            <span className="text-sm text-gray-500">{product.stock_quantity} in stock</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} className="btn-primary flex-1 text-base py-4">
              <HiOutlineShoppingCart size={20} className="mr-2" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`btn-secondary !px-4 transition-colors ${
                inWishlist
                  ? '!bg-rose-50 !text-rose-600 hover:!bg-rose-100 dark:!bg-rose-950 dark:!text-rose-300'
                  : ''
              }`}
            >
              <HeartIcon size={20} className={inWishlist ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            {[
              { icon: HiOutlineTruck, text: 'Free shipping on orders $100+' },
              { icon: HiOutlineShieldCheck, text: 'Secure checkout' },
              { icon: HiOutlineRefresh, text: '30-day returns' },
              { icon: HiOutlineCheck, text: '1 year warranty' }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <f.icon size={16} className="text-primary-600 flex-shrink-0" />
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4 max-w-2xl">
            {product.reviews.map(review => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">{review.user_name?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.user_name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <HiOutlineStar key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                      ))}
                      {review.is_verified_purchase && (
                        <span className="text-xs text-green-600 ml-2">Verified Purchase</span>
                      )}
                    </div>
                  </div>
                </div>
                {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
                {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related products */}
      {product.related?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {product.related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

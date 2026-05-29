import { Link } from 'react-router-dom';
import { HiOutlineShoppingCart, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function Cart() {
  const { items, loading, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await updateQuantity(itemId, newQty);
    } catch {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
      toast.success('Item removed');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 skeleton rounded-2xl h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Shopping Cart' }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineShoppingCart size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added anything yet</p>
          <Link to="/shop" className="btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link to={`/product/${item.slug}`} className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-medium text-sm md:text-base hover:text-primary-600 transition-colors line-clamp-1">
                        {item.name}
                      </Link>
                      {item.variant_name && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variant_name}: {item.variant_value}</p>
                      )}
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg">
                        <HiOutlineMinus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg">
                        <HiOutlinePlus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                      {item.compare_price && (
                        <p className="text-xs text-gray-400 line-through">{formatPrice(item.compare_price * item.quantity)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Clear Cart</button>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{subtotal > 100 ? 'Free' : formatPrice(10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax (8%)</span>
                  <span className="font-medium">{formatPrice(subtotal * 0.08)}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(subtotal + (subtotal > 100 ? 0 : 10) + subtotal * 0.08)}</span>
                </div>
              </div>
              <Link to="/checkout" className="btn-primary w-full mt-6">
                Proceed to Checkout
              </Link>
              <Link to="/shop" className="btn-secondary w-full mt-3 text-sm">
                <HiOutlineArrowLeft size={16} className="mr-1" /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

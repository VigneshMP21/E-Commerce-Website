import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlinePhotograph,
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineTruck,
  HiStar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

const getStatusDate = (order) => (
  order.delivered_at || order.shipped_at || order.status_updated_at || order.updated_at || order.created_at
);

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingSubmitting, setRatingSubmitting] = useState(null);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const orderLines = useMemo(() => orders.flatMap(order => (
    (order.items || []).map(item => ({ order, item }))
  )), [orders]);

  const openOrderDetails = (orderNumber) => {
    navigate(`/orders/${orderNumber}`);
  };

  const handleCardKeyDown = (event, orderNumber) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openOrderDetails(orderNumber);
    }
  };

  const handleRating = async (event, order, item, rating) => {
    event.stopPropagation();
    if (order.status !== 'delivered') return;

    const ratingKey = `${order.id}-${item.id}`;
    const wasRated = Boolean(item.user_rating);

    setRatingSubmitting(ratingKey);
    try {
      await api.post('/users/reviews', {
        productId: item.product_id,
        rating
      });

      setOrders(current => current.map(currentOrder => {
        if (currentOrder.id !== order.id) return currentOrder;

        return {
          ...currentOrder,
          items: currentOrder.items.map(currentItem => (
            currentItem.id === item.id ? { ...currentItem, user_rating: rating } : currentItem
          ))
        };
      }));
      toast.success(wasRated ? 'Rating updated' : 'Rating submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit rating');
    } finally {
      setRatingSubmitting(null);
    }
  };

  const renderRating = (order, item) => {
    if (order.status !== 'delivered') {
      return <p className="text-xs text-gray-400">Rating opens after delivery</p>;
    }

    const selectedRating = Number(item.user_rating) || 0;
    const ratingKey = `${order.id}-${item.id}`;

    return (
      <div>
        <div className="flex justify-start gap-0.5 md:justify-end" aria-label={selectedRating ? `Rated ${selectedRating} stars` : 'Rate product'}>
          {[1, 2, 3, 4, 5].map(rating => {
            const StarIcon = rating <= selectedRating ? HiStar : HiOutlineStar;

            return (
              <button
                key={rating}
                type="button"
                disabled={ratingSubmitting === ratingKey}
                onClick={(event) => handleRating(event, order, item, rating)}
                className={`rounded p-0.5 transition-colors ${
                  rating <= selectedRating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
                aria-label={`Rate ${rating} star${rating === 1 ? '' : 's'}`}
              >
                <StarIcon size={18} className={rating <= selectedRating ? 'fill-current' : ''} />
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-left text-xs text-gray-400 md:text-right">
          {ratingSubmitting === ratingKey ? 'Updating...' : selectedRating ? 'Change rating' : 'Rate product'}
        </p>
      </div>
    );
  };

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'My Orders' }]} />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track items, delivery status and product ratings in one place.
          </p>
        </div>
        {!loading && orderLines.length > 0 && (
          <div className="rounded-xl bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {orderLines.length} item{orderLines.length === 1 ? '' : 's'} from {orders.length} order{orders.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : orderLines.length > 0 ? (
        <div className="space-y-4">
          {orderLines.map(({ order, item }) => (
            <div
              key={`${order.id}-${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => openOrderDetails(order.order_number)}
              onKeyDown={(event) => handleCardKeyDown(event, order.order_number)}
              className="card cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-200 md:p-5 dark:hover:border-primary-700"
            >
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px_220px] md:items-center xl:grid-cols-[minmax(0,1fr)_240px_230px]">
                <div className="flex min-w-0 gap-4">
                  <Link
                    to={item.product_slug ? `/product/${item.product_slug}` : `/orders/${order.order_number}`}
                    onClick={(event) => event.stopPropagation()}
                    className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
                  >
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <HiOutlinePhotograph size={26} className="text-gray-400" />
                    )}
                  </Link>
                  <div className="min-w-0 py-1">
                    <Link
                      to={item.product_slug ? `/product/${item.product_slug}` : `/orders/${order.order_number}`}
                      onClick={(event) => event.stopPropagation()}
                      className="line-clamp-2 font-semibold text-gray-900 transition-colors hover:text-primary-600 dark:text-white"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">Product ID: #{item.product_id}</p>
                    <div className="mt-3 space-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <HiOutlineCalendar size={16} />
                        Ordered {formatDate(order.created_at)}
                      </span>
                      <p className="text-xs font-medium text-primary-600">Order Code:- {order.order_number}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 md:justify-self-center md:self-stretch dark:bg-gray-800/70">
                  <div className="flex items-center gap-2">
                    <HiOutlineTruck size={20} className="text-primary-600" />
                    <span className={`badge text-xs capitalize ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Status updated</p>
                  <p className="text-sm text-gray-500">{formatDate(getStatusDate(order))}</p>
                  <p className="mt-2 text-xs text-gray-400 capitalize">{order.payment_method} payment: {order.payment_status}</p>
                </div>

                <div className="flex flex-col gap-3 md:items-end md:self-stretch md:justify-center">
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Item total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(item.total_price)}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity} x {formatPrice(item.unit_price)}</p>
                  </div>
                  {renderRating(order, item)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineShoppingBag size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      )}
    </div>
  );
}

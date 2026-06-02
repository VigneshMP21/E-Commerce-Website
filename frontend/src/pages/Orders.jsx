import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlinePhotograph,
  HiOutlineShoppingBag,
  HiOutlineStar,
  HiOutlineX,
  HiStar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

const normalizeStatus = (status = '') => String(status).toLowerCase().replace(/[\s-]+/g, '_');

const addDays = (date, days) => {
  const nextDate = new Date(date || Date.now());
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatCompactPrice = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(Number(value) || 0);

const formatDeliveryDate = (date) => new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: '2-digit'
}).format(new Date(date)).replace(',', '');

const getEstimatedDeliveryDate = (order) => (
  order.estimated_delivery_at || order.delivered_at || addDays(order.created_at, 5)
);

const getStatusMeta = (order) => {
  const status = normalizeStatus(order.status);

  if (status === 'delivered') {
    return {
      delivered: true,
      title: `Delivered on ${formatDeliveryDate(order.delivered_at || order.status_updated_at || order.updated_at || order.created_at)}`,
      detail: 'Your item has been delivered'
    };
  }

  if (status === 'cancelled') {
    return {
      delivered: false,
      title: 'Order cancelled',
      detail: 'This order has been cancelled.'
    };
  }

  if (status === 'refunded') {
    return {
      delivered: false,
      title: 'Refund processed',
      detail: 'Refund has been processed for this item.'
    };
  }

  const detailByStatus = {
    shipped: 'Your item has been shipped.',
    processing: 'Your item is being prepared.',
    confirmed: 'Your order has been confirmed.',
    pending: 'Your order has been placed.'
  };

  return {
    delivered: false,
    title: `Delivery expected by ${formatDeliveryDate(getEstimatedDeliveryDate(order))}`,
    detail: detailByStatus[status] || 'Your order is moving through fulfillment.'
  };
};

function LoadingRows() {
  return (
    <div className="space-y-2.5">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="h-[112px] skeleton rounded" />
      ))}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded border border-gray-200 bg-white py-20 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <HiOutlineShoppingBag size={30} className="text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-950 dark:text-white">No orders yet</h2>
      <p className="mt-2 text-sm text-gray-500">Start shopping to see your order history here.</p>
      <Link to="/shop" className="btn-primary mt-6">Start Shopping</Link>
    </div>
  );
}

function OrderListRow({ order, item, onOpen, onReview }) {
  const statusMeta = getStatusMeta(order);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order.order_number)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(order.order_number);
        }
      }}
      className="grid min-h-[112px] cursor-pointer grid-cols-[88px_minmax(0,1fr)] gap-4 rounded border border-gray-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-800 md:grid-cols-[112px_minmax(0,1.3fr)_160px_minmax(260px,0.8fr)] md:items-start md:gap-6"
    >
      <Link
        to={item.product_slug ? `/product/${item.product_slug}` : `/orders/${order.order_number}`}
        onClick={(event) => event.stopPropagation()}
        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded bg-gray-50 dark:bg-gray-800 md:mx-auto md:h-[74px] md:w-[74px]"
      >
        {item.product_image ? (
          <img src={item.product_image} alt={item.product_name} className="h-full w-full object-contain" />
        ) : (
          <HiOutlinePhotograph size={28} className="text-gray-400" />
        )}
      </Link>

      <div className="min-w-0 md:pt-1">
        <p className="line-clamp-1 text-sm font-medium text-gray-950 dark:text-white">
          {item.product_name}
        </p>
        <p className="mt-3 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
          {item.brand || item.variant_info || `Product ID: #${item.product_id}`}
        </p>
        <p className="mt-2 text-xs text-gray-400 md:hidden">Ordered {formatDate(order.created_at)}</p>
      </div>

      <div className="col-start-2 text-sm font-semibold text-gray-950 dark:text-white md:col-start-auto md:pt-1">
        {formatCompactPrice(item.total_price)}
      </div>

      <div className="col-span-2 md:col-span-1 md:pt-0.5">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              statusMeta.delivered
                ? 'bg-green-600'
                : 'border-2 border-green-600 bg-white dark:bg-gray-900'
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-gray-950 dark:text-white">{statusMeta.title}</p>
            <p className="mt-3 text-xs text-gray-700 dark:text-gray-300">{statusMeta.detail}</p>
            {statusMeta.delivered && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onReview(order, item);
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                <HiOutlineStar size={17} className="fill-current" />
                Rate & Review Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ review, rating, feedback, submitting, onClose, onRatingChange, onFeedbackChange, onSubmit }) {
  if (!review) return null;

  const { item } = review;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-gray-950 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Rate & Review</p>
            <h2 id="review-modal-title" className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
              Share your product experience
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close review modal"
          >
            <HiOutlineX size={22} />
          </button>
        </div>

        <div className="mt-5 flex gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-gray-800">
            {item.product_image ? (
              <img src={item.product_image} alt={item.product_name} className="h-full w-full object-contain" />
            ) : (
              <HiOutlinePhotograph size={28} className="text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-gray-950 dark:text-white">{item.product_name}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {item.brand || item.variant_info || `Product ID: #${item.product_id}`}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Your rating</p>
          <div className="mt-3 flex justify-center gap-2" aria-label={rating ? `Selected ${rating} stars` : 'Select a rating'}>
            {[1, 2, 3, 4, 5].map(star => {
              const StarIcon = star <= rating ? HiStar : HiOutlineStar;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onRatingChange(star)}
                  className={`rounded-2xl p-1.5 transition-all duration-200 hover:-translate-y-1 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                  }`}
                  aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                >
                  <StarIcon size={46} className={star <= rating ? 'fill-current drop-shadow-sm' : ''} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="review-feedback" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Customer feedback
          </label>
          <textarea
            id="review-feedback"
            value={feedback}
            onChange={(event) => onFeedbackChange(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:border-primary-700 dark:focus:ring-primary-950"
            placeholder="Write what you liked, what could be better, and how the product felt after use."
          />
        </div>

        <button
          type="button"
          disabled={!rating || submitting}
          onClick={onSubmit}
          className="btn-primary btn-shimmer mt-5 w-full !rounded-2xl !py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting Review...' : 'Rate & Review Submit'}
        </button>
      </div>
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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

  const openReviewModal = (order, item) => {
    setActiveReview({ order, item });
    setReviewRating(Number(item.user_rating) || 0);
    setReviewFeedback('');
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setActiveReview(null);
    setReviewRating(0);
    setReviewFeedback('');
  };

  const handleSubmitReview = async () => {
    if (!activeReview || !reviewRating) return;

    const { order, item } = activeReview;
    const wasRated = Boolean(item.user_rating);

    setReviewSubmitting(true);
    try {
      await api.post('/users/reviews', {
        productId: item.product_id,
        rating: reviewRating,
        title: 'Customer feedback',
        comment: reviewFeedback.trim() || null
      });

      setOrders(current => current.map(currentOrder => {
        if (currentOrder.id !== order.id) return currentOrder;

        return {
          ...currentOrder,
          items: (currentOrder.items || []).map(currentItem => (
            currentItem.id === item.id ? { ...currentItem, user_rating: reviewRating } : currentItem
          ))
        };
      }));

      toast.success(wasRated ? 'Review updated' : 'Review submitted');
      setActiveReview(null);
      setReviewRating(0);
      setReviewFeedback('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4 dark:bg-gray-950 md:py-6">
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4">
        <div className="mb-4">
          <Breadcrumb items={[{ name: 'My Orders' }]} />
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-950 dark:text-white">My Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                {loading ? 'Loading your purchases...' : `${orderLines.length} item${orderLines.length === 1 ? '' : 's'} from ${orders.length} order${orders.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Link to="/shop" className="hidden rounded border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 sm:inline-flex">
              Continue Shopping
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingRows />
        ) : orderLines.length > 0 ? (
          <div className="space-y-2.5">
            {orderLines.map(({ order, item }) => (
              <OrderListRow
                key={`${order.id}-${item.id}`}
                order={order}
                item={item}
                onOpen={openOrderDetails}
                onReview={openReviewModal}
              />
            ))}
          </div>
        ) : (
          <EmptyOrders />
        )}
      </div>

      <ReviewModal
        review={activeReview}
        rating={reviewRating}
        feedback={reviewFeedback}
        submitting={reviewSubmitting}
        onClose={closeReviewModal}
        onRatingChange={setReviewRating}
        onFeedbackChange={setReviewFeedback}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClipboardCheck,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineDocumentDownload,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineReceiptTax,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineSparkles,
  HiOutlineStar,
  HiOutlineSupport,
  HiOutlineTruck,
  HiOutlineUpload,
  HiOutlineX,
  HiStar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { calculateDiscount, formatDate, formatPrice, getImageUrl, getStatusColor } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const glassCardClass = 'rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(79,70,229,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(79,70,229,0.18)] dark:border-white/10 dark:bg-gray-950/75';
const compactGlassClass = 'rounded-2xl border border-white/70 bg-white/70 shadow-[0_18px_48px_rgba(79,70,229,0.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(79,70,229,0.14)] dark:border-white/10 dark:bg-gray-900/70';

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: HiOutlineShoppingBag, description: 'Your order has been received by VShop.' },
  { key: 'confirmed', label: 'Confirmed', icon: HiOutlineBadgeCheck, description: 'Payment and item availability are confirmed.' },
  { key: 'processing', label: 'Processing', icon: HiOutlineCube, description: 'The warehouse team is preparing your package.' },
  { key: 'shipped', label: 'Shipped', icon: HiOutlineTruck, description: 'Your package has left the fulfillment center.' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: HiOutlineLocationMarker, description: 'The courier is heading toward your address.' },
  { key: 'delivered', label: 'Delivered', icon: HiOutlineCheckCircle, description: 'Your order has been delivered successfully.' }
];

const statusIndex = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  outfordelivery: 4,
  delivered: 5
};

const closedStatuses = new Set(['cancelled', 'refunded']);

const normalizeStatus = (status = '') => String(status).toLowerCase().replace(/[\s-]+/g, '_');

const titleize = (value = '') => String(value || 'pending')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase());

const toNumber = (value) => Number(value) || 0;

const addDays = (date, days) => {
  const nextDate = new Date(date || Date.now());
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const formatDateTime = (date) => {
  if (!date) return 'Awaiting update';

  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(date));
};

const getProgressIndex = (status) => {
  const normalized = normalizeStatus(status);
  if (closedStatuses.has(normalized)) return 0;
  return statusIndex[normalized] ?? 0;
};

const getEstimatedDeliveryDate = (order) => (
  order.estimated_delivery_at || order.delivered_at || addDays(order.created_at, 5)
);

const getTrackingSnapshot = (order) => {
  const latestTracking = order.tracking?.[order.tracking.length - 1];
  const normalized = normalizeStatus(order.status);
  const digits = String(order.order_number || order.id || Date.now()).replace(/\D/g, '').slice(-8).padStart(8, '0');
  const etaByStatus = {
    pending: `Arrives by ${formatDate(getEstimatedDeliveryDate(order))}`,
    confirmed: `Arrives by ${formatDate(getEstimatedDeliveryDate(order))}`,
    processing: `Arrives by ${formatDate(getEstimatedDeliveryDate(order))}`,
    shipped: `Expected ${formatDate(getEstimatedDeliveryDate(order))}`,
    out_for_delivery: 'Today, before 8:00 PM',
    delivered: order.delivered_at ? formatDateTime(order.delivered_at) : 'Delivered',
    cancelled: 'No delivery scheduled',
    refunded: 'Refund processing'
  };

  return {
    currentLocation: latestTracking?.location || order.current_location || (normalized === 'delivered' ? 'Delivered to your address' : 'VShop fulfillment network'),
    deliveryPartner: order.delivery_partner || 'VShip Express',
    trackingNumber: order.tracking_number || `VSP-${digits}`,
    estimatedArrival: order.estimated_arrival || etaByStatus[normalized] || `Arrives by ${formatDate(getEstimatedDeliveryDate(order))}`
  };
};

const formatAddress = (address) => {
  if (!address) return 'Add a saved address to show delivery details.';

  return [
    address.street,
    address.city,
    address.state,
    address.zip_code,
    address.country
  ].filter(Boolean).join(', ');
};

const productLink = (item) => (
  item.product_slug
    ? `/product/${item.product_slug}`
    : `/shop?search=${encodeURIComponent(item.product_name || '')}`
);

const getTimelineDate = (order, index) => {
  const step = statusSteps[index];
  const matchedTracking = order.tracking?.find(entry => normalizeStatus(entry.status) === step.key);
  const currentIndex = getProgressIndex(order.status);

  if (matchedTracking?.created_at) return matchedTracking.created_at;
  if (index === 0) return order.created_at;
  if (index === 3 && order.shipped_at) return order.shipped_at;
  if (index === 5 && order.delivered_at) return order.delivered_at;
  if (currentIndex >= index) return order.updated_at || order.created_at;

  return addDays(order.created_at, index + 1);
};

const buildInvoiceText = (order) => {
  const lines = [
    'VShop Invoice',
    `Order ID: ${order.order_number}`,
    `Order Date: ${formatDate(order.created_at)}`,
    `Status: ${titleize(order.status)}`,
    '',
    'Items:'
  ];

  (order.items || []).forEach(item => {
    lines.push(`${item.product_name} | Qty ${item.quantity} | ${formatPrice(toNumber(item.total_price))}`);
  });

  lines.push(
    '',
    `Subtotal: ${formatPrice(toNumber(order.subtotal))}`,
    `Discount: -${formatPrice(toNumber(order.discount_amount))}`,
    `Shipping: ${formatPrice(toNumber(order.shipping_cost))}`,
    `Tax: ${formatPrice(toNumber(order.tax_amount))}`,
    `Grand Total: ${formatPrice(toNumber(order.total_amount))}`
  );

  return lines.join('\n');
};

function LoadingDetail() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/70 to-violet-50/80 py-8 dark:from-gray-950 dark:via-gray-950 dark:to-primary-950/30">
      <div className="container-custom space-y-5">
        <div className="h-48 skeleton rounded-[32px]" />
        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-5">
            <div className="h-64 skeleton rounded-[28px]" />
            <div className="h-48 skeleton rounded-[28px]" />
          </div>
          <div className="h-80 skeleton rounded-[28px]" />
        </div>
      </div>
    </div>
  );
}

function OrderNotFound() {
  return (
    <div className="container-custom py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <HiOutlineShoppingBag size={30} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-semibold text-gray-950 dark:text-white">Order not found</h1>
      <Link to="/orders" className="btn-primary mt-6">Back to Orders</Link>
    </div>
  );
}

function PageIntro({ orderCount, deliveredCount, totalSavings }) {
  return (
    <div className="mb-8 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary-600 dark:text-primary-300">Order Management</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-5xl">
          Premium order tracking
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400 md:text-base">
          Track deliveries, manage invoices, review purchases and get support from one polished dashboard.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className={`${compactGlassClass} p-4 text-center`}>
          <p className="text-2xl font-bold text-gray-950 dark:text-white">{orderCount}</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Orders</p>
        </div>
        <div className={`${compactGlassClass} p-4 text-center`}>
          <p className="text-2xl font-bold text-gray-950 dark:text-white">{deliveredCount}</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Delivered</p>
        </div>
        <div className={`${compactGlassClass} p-4 text-center`}>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">{formatPrice(totalSavings)}</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Saved</p>
        </div>
      </div>
    </div>
  );
}

function OrderHero({ order, reorderBusy, onDownloadInvoice, onReorder }) {
  const itemCount = order.items?.length || 0;

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-blue-50 to-violet-50 p-5 shadow-[0_28px_90px_rgba(79,70,229,0.16)] dark:border-white/10 dark:from-gray-950 dark:via-primary-950/20 dark:to-violet-950/20 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`badge text-xs capitalize ${getStatusColor(order.status)}`}>{titleize(order.status)}</span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm dark:bg-gray-900/80 dark:text-primary-300">
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Order ID</p>
          <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-950 dark:text-white md:text-4xl">
            {order.order_number}
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-gray-900/70">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <HiOutlineCalendar size={16} />
                Order Date
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-950 dark:text-white">{formatDate(order.created_at)}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-gray-900/70">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <HiOutlineTruck size={16} />
                Estimated Delivery
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-950 dark:text-white">{formatDate(getEstimatedDeliveryDate(order))}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm dark:bg-gray-900/70 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <HiOutlineCreditCard size={16} />
                Payment
              </div>
              <p className="mt-2 text-sm font-semibold capitalize text-gray-950 dark:text-white">
                {order.payment_method || 'Payment'} - {order.payment_status || 'pending'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <button type="button" onClick={() => onDownloadInvoice(order)} className="btn-primary btn-shimmer w-full gap-2">
            <HiOutlineDocumentDownload size={18} />
            Download Invoice
          </button>
          <Link to="/contact" className="btn-secondary w-full gap-2">
            <HiOutlineSupport size={18} />
            Contact Support
          </Link>
          <button type="button" disabled={reorderBusy} onClick={() => onReorder(order)} className="btn-outline w-full gap-2 bg-white/60 dark:bg-gray-950/40">
            <HiOutlineRefresh size={18} />
            {reorderBusy ? 'Adding...' : 'Reorder'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTracker({ order }) {
  const currentIndex = getProgressIndex(order.status);
  const normalized = normalizeStatus(order.status);
  const isClosed = closedStatuses.has(normalized);
  const progressWidth = isClosed ? '0%' : `${Math.min(100, (currentIndex / (statusSteps.length - 1)) * 100)}%`;

  return (
    <div className={`${glassCardClass} p-5 sm:p-6`}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Order Status</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Premium delivery progress</h3>
        </div>
        <span className={`badge text-xs capitalize ${getStatusColor(order.status)}`}>{titleize(order.status)}</span>
      </div>

      <div className="relative">
        <div className="absolute left-10 right-10 top-6 hidden h-1 rounded-full bg-gray-200/80 lg:block dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 shadow-[0_0_28px_rgba(99,102,241,0.45)] transition-all duration-700"
            style={{ width: progressWidth }}
          />
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const complete = !isClosed && currentIndex >= index;
            const active = !isClosed && currentIndex === index;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-500 ${
                    complete
                      ? 'border-transparent bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-950'
                  } ${active ? 'animate-pulse' : ''}`}
                >
                  {complete ? <HiOutlineCheck size={22} /> : <Icon size={22} />}
                </div>
                <p className={`mt-3 text-sm font-semibold ${complete ? 'text-gray-950 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {step.label}
                </p>
                <p className="mt-1 hidden text-xs leading-relaxed text-gray-500 dark:text-gray-400 sm:block">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LiveTrackingCard({ order }) {
  const tracking = getTrackingSnapshot(order);
  const stats = [
    { label: 'Current Location', value: tracking.currentLocation, icon: HiOutlineLocationMarker },
    { label: 'Delivery Partner', value: tracking.deliveryPartner, icon: HiOutlineTruck },
    { label: 'Tracking Number', value: tracking.trackingNumber, icon: HiOutlineClipboardCheck },
    { label: 'Estimated Arrival', value: tracking.estimatedArrival, icon: HiOutlineClock }
  ];

  return (
    <div className={`${glassCardClass} overflow-hidden p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Live Tracking</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Shipment control center</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
          <HiOutlineTruck size={24} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {stats.map(stat => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-sm dark:border-white/10 dark:bg-gray-900/65">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{stat.label}</p>
                  <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ order, item, isBusy, onBuyAgain, onOpenReview, renderRating }) {
  const hasReview = Boolean(Number(item.user_rating));

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`${compactGlassClass} overflow-hidden p-4`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to={productLink(item)}
          className="flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-primary-50 sm:h-32 sm:w-32 dark:from-gray-900 dark:to-primary-950/30"
        >
          {item.product_image ? (
            <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
          ) : (
            <HiOutlinePhotograph size={32} className="text-gray-400" />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">
                {item.brand || 'VShop Select'}
              </p>
              <Link
                to={productLink(item)}
                className="mt-1 block line-clamp-2 text-lg font-semibold leading-tight text-gray-950 transition-colors hover:text-primary-600 dark:text-white"
              >
                {item.product_name}
              </Link>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">Variant: {item.variant_info || 'Standard'}</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">Qty {item.quantity}</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">Product #{item.product_id}</span>
              </div>
            </div>

            <div className="text-left lg:text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400">Total price</p>
              <p className="text-xl font-bold text-gray-950 dark:text-white">{formatPrice(toNumber(item.total_price))}</p>
              <p className="text-xs text-gray-500">Unit {formatPrice(toNumber(item.unit_price))}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-white/70 pt-4 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
            {renderRating(order, item)}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={isBusy} onClick={() => onBuyAgain(item)} className="btn-primary btn-shimmer !px-4 !py-2 text-sm gap-2">
                <HiOutlineShoppingCart size={17} />
                {isBusy ? 'Adding...' : 'Buy Again'}
              </button>
              <button type="button" onClick={() => onOpenReview(item)} className="btn-secondary !px-4 !py-2 text-sm gap-2">
                <HiOutlineStar size={17} />
                {hasReview ? 'Rewrite Review' : 'Write Review'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({ order }) {
  const discount = toNumber(order.discount_amount);
  const couponSavings = order.coupon_code ? discount : toNumber(order.coupon_savings);
  const lineDiscount = Math.max(discount - couponSavings, 0);
  const platformFee = toNumber(order.platform_fee);
  const rows = [
    { label: 'Subtotal', value: formatPrice(toNumber(order.subtotal)) },
    { label: 'Discount', value: `-${formatPrice(lineDiscount)}`, savings: lineDiscount > 0 },
    { label: order.coupon_code ? `Coupon Savings (${order.coupon_code})` : 'Coupon Savings', value: `-${formatPrice(couponSavings)}`, savings: couponSavings > 0 },
    { label: 'Shipping', value: toNumber(order.shipping_cost) > 0 ? formatPrice(toNumber(order.shipping_cost)) : 'Free' },
    { label: 'Tax', value: formatPrice(toNumber(order.tax_amount)) },
    { label: 'Platform Fee', value: platformFee > 0 ? formatPrice(platformFee) : 'Free' }
  ];

  return (
    <div className={`${glassCardClass} p-5 sm:p-6`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Summary</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Order total</h3>
        </div>
        <HiOutlineReceiptTax size={24} className="text-primary-600 dark:text-primary-300" />
      </div>

      <div className="space-y-3 text-sm">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
            <span className={`font-semibold ${row.savings ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-950 dark:text-white'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      {discount > 0 && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          You saved {formatPrice(discount)} on this order.
        </div>
      )}

      <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
        <div className="flex items-end justify-between gap-4">
          <span className="text-base font-semibold text-gray-950 dark:text-white">Grand Total</span>
          <span className="text-2xl font-bold text-gray-950 dark:text-white">{formatPrice(toNumber(order.total_amount))}</span>
        </div>
        <p className="mt-2 text-xs capitalize text-gray-500 dark:text-gray-400">
          {order.payment_method || 'Payment'} payment: {order.payment_status || 'pending'}
        </p>
      </div>
    </div>
  );
}

function CustomerCard({ order, address, user }) {
  const rows = [
    { label: 'Customer Name', value: address?.full_name || user?.name || 'VShop Customer', icon: HiOutlineSparkles },
    { label: 'Phone Number', value: address?.phone || user?.phone || 'Not provided', icon: HiOutlinePhone },
    { label: 'Email', value: user?.email || 'Not provided', icon: HiOutlineMail },
    { label: 'Delivery Address', value: formatAddress(address), icon: HiOutlineHome }
  ];

  return (
    <div className={`${glassCardClass} p-5 sm:p-6`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Customer</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Delivery information</h3>
        </div>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
          #{order.shipping_address_id || 'default'}
        </span>
      </div>

      <div className="space-y-4">
        {rows.map(row => {
          const Icon = row.icon;

          return (
            <div key={row.label} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-sm dark:bg-gray-900 dark:text-primary-300">
                <Icon size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{row.label}</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-950 dark:text-white">{row.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineCard({ order }) {
  const currentIndex = getProgressIndex(order.status);
  const normalized = normalizeStatus(order.status);
  const isClosed = closedStatuses.has(normalized);

  return (
    <div className={`${glassCardClass} p-5 sm:p-6`}>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Timeline</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Delivery timeline</h3>
      </div>

      {statusSteps.map((step, index) => {
        const Icon = step.icon;
        const complete = !isClosed && currentIndex >= index;
        const active = !isClosed && currentIndex === index;
        const date = getTimelineDate(order, index);

        return (
          <div key={step.key} className="grid grid-cols-[44px_1fr] gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ${
                  complete
                    ? 'border-transparent bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                    : active
                      ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-gray-200 bg-white text-gray-400 dark:border-gray-800 dark:bg-gray-950'
                }`}
              >
                {complete ? <HiOutlineCheck size={20} /> : <Icon size={20} />}
              </div>
              {index < statusSteps.length - 1 && (
                <div className={`h-16 w-0.5 ${complete ? 'bg-gradient-to-b from-primary-500 to-violet-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
              )}
            </div>
            <div className="pb-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className={`font-semibold ${complete ? 'text-gray-950 dark:text-white' : active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {step.label}
                </p>
                <span className={`text-xs font-semibold ${complete ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400'}`}>
                  {complete ? 'Completed' : active ? 'In progress' : 'Upcoming'}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{step.description}</p>
              <p className="mt-2 text-xs font-medium text-gray-400">
                {complete || active ? formatDateTime(date) : `Expected ${formatDate(date)}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SupportCard({ order, onSupportAction }) {
  const actions = [
    { label: 'Live Chat', icon: HiOutlineChatAlt2, action: 'chat' },
    { label: 'Call Support', icon: HiOutlinePhone, action: 'call' },
    { label: 'Raise Return Request', icon: HiOutlineRefresh, action: 'return' },
    { label: 'Track Shipment', icon: HiOutlineTruck, action: 'track' }
  ];

  return (
    <div className={`${glassCardClass} p-5 sm:p-6`}>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Need Help?</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">Support concierge</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {actions.map(action => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={() => onSupportAction(action.action, order)}
              className="group flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-gray-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700 hover:shadow-lg dark:border-white/10 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:border-primary-800 dark:hover:text-primary-300"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-950/60 dark:text-primary-300">
                  <Icon size={18} />
                </span>
                {action.label}
              </span>
              <HiOutlineArrowRight size={17} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeliverySuccessCard({ order, firstItem, onOpenReview, renderRating }) {
  if (normalizeStatus(order.status) !== 'delivered') return null;

  const hasReview = Boolean(Number(firstItem?.user_rating));

  return (
    <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-primary-50 p-5 shadow-[0_24px_80px_rgba(16,185,129,0.16)] dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-gray-950 dark:to-primary-950/30 sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
        <HiOutlineCheckCircle size={26} />
      </div>
      <h3 className="mt-4 text-xl font-bold text-gray-950 dark:text-white">Order Delivered Successfully</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Thank you for shopping with VShop.</p>
      {firstItem && (
        <div className="mt-5 rounded-2xl bg-white/70 p-4 dark:bg-gray-900/70">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Rate your experience</p>
          {renderRating(order, firstItem)}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!firstItem}
          onClick={() => firstItem && onOpenReview(firstItem)}
          className="btn-primary btn-shimmer !px-4 !py-2 text-sm gap-2"
        >
          <HiOutlineStar size={17} />
          {hasReview ? 'Rewrite Review' : 'Write Review'}
        </button>
        <Link to="/shop" className="btn-secondary !px-4 !py-2 text-sm gap-2">
          <HiOutlineShoppingBag size={17} />
          Shop Again
        </Link>
      </div>
    </div>
  );
}

function ReviewModal({
  review,
  rating,
  feedback,
  images,
  submitting,
  onClose,
  onRatingChange,
  onFeedbackChange,
  onImagesChange,
  onRemoveImage,
  onSubmit
}) {
  if (!review) return null;

  const { item } = review;
  const hasReview = Boolean(Number(item.user_rating));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-review-title"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/70 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-gray-950 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">
              {hasReview ? 'Rewrite Review' : 'Write Review'}
            </p>
            <h2 id="detail-review-title" className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
              Rate your product experience
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Close review overlay"
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
              {item.brand || item.variant_info || `Product #${item.product_id}`}
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
                  <StarIcon size={48} className={star <= rating ? 'fill-current drop-shadow-sm' : ''} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="detail-review-feedback" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Customer feedback
          </label>
          <textarea
            id="detail-review-feedback"
            value={feedback}
            onChange={(event) => onFeedbackChange(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:focus:border-primary-700 dark:focus:ring-primary-950"
            placeholder="Write what you liked, what could be better, and how the product felt after use."
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload product images</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/60 text-primary-600 transition-all hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-50 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-300">
              <HiOutlinePlus size={24} />
              <span className="mt-1 text-xs font-semibold">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => onImagesChange(event.target.files)}
              />
            </label>

            {images.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-2 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <HiOutlineUpload size={22} className="text-gray-400" />
                <p className="mt-1 line-clamp-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">{file.name}</p>
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white shadow-md transition-colors hover:bg-red-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <HiOutlineX size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">Image files are selected for review context.</p>
        </div>

        <button
          type="button"
          disabled={!rating || submitting}
          onClick={onSubmit}
          className="btn-primary btn-shimmer mt-6 w-full !rounded-2xl !py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting Review...' : hasReview ? 'Rewrite Review Submit' : 'Rate & Review Submit'}
        </button>
      </div>
    </div>
  );
}

function RecommendedCarousel({ title, subtitle, items, cartSubmitting, onAddToCart, type = 'order' }) {
  if (!items.length) return null;

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">{subtitle}</p>
          <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{title}</h2>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map(item => {
          const isProduct = type === 'product';
          const image = isProduct ? getImageUrl(item.images) : item.product_image;
          const name = isProduct ? item.name : item.product_name;
          const price = isProduct ? item.price : item.unit_price;
          const comparePrice = isProduct ? item.compare_price : null;
          const discount = isProduct ? calculateDiscount(toNumber(item.price), toNumber(item.compare_price)) : 0;
          const slug = isProduct ? item.slug : item.product_slug;
          const productId = isProduct ? item.id : item.product_id;
          const busyKey = isProduct ? `product-${item.id}` : `again-${item.id}`;
          const isBusy = cartSubmitting === busyKey;

          return (
            <div key={`${type}-${item.id}-${productId}`} className={`${compactGlassClass} group min-w-[230px] max-w-[230px] overflow-hidden`}>
              <Link to={slug ? `/product/${slug}` : `/shop?search=${encodeURIComponent(name || '')}`} className="block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                {image ? (
                  <img src={image} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HiOutlinePhotograph size={30} className="text-gray-400" />
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                    {isProduct ? item.brand || item.category_name || 'VShop' : 'Buy Again'}
                  </span>
                  {discount > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">{discount}% OFF</span>}
                </div>
                <Link to={slug ? `/product/${slug}` : `/shop?search=${encodeURIComponent(name || '')}`} className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-tight text-gray-950 transition-colors hover:text-primary-600 dark:text-white">
                  {name}
                </Link>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-950 dark:text-white">{formatPrice(toNumber(price))}</span>
                  {comparePrice && <span className="text-xs text-gray-400 line-through">{formatPrice(toNumber(comparePrice))}</span>}
                </div>
                <button type="button" disabled={isBusy} onClick={() => onAddToCart(item, isProduct)} className="btn-primary btn-shimmer mt-4 w-full !px-3 !py-2 text-sm gap-2">
                  <HiOutlineShoppingCart size={16} />
                  {isBusy ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingSubmitting, setRatingSubmitting] = useState(null);
  const [cartSubmitting, setCartSubmitting] = useState(null);
  const [activeReview, setActiveReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    Promise.allSettled([
      api.get(`/orders/${orderNumber}`),
      api.get('/users/addresses'),
      api.get('/products?limit=12&sort=popular'),
      api.get('/orders')
    ])
      .then(([orderResult, addressesResult, productsResult, userOrdersResult]) => {
        if (!isMounted) return;

        if (orderResult.status === 'fulfilled') {
          const detailOrder = orderResult.value.data.data;
          const matchingOrder = userOrdersResult.status === 'fulfilled'
            ? (userOrdersResult.value.data.data || []).find(item => item.order_number === detailOrder.order_number)
            : null;
          const listItemsById = new Map((matchingOrder?.items || []).map(item => [item.id, item]));

          setOrder({
            ...detailOrder,
            items: (detailOrder.items || []).map(item => {
              const listItem = listItemsById.get(item.id);

              return {
                ...item,
                product_slug: item.product_slug || listItem?.product_slug,
                user_rating: item.user_rating ?? listItem?.user_rating,
                user_review_comment: item.user_review_comment ?? listItem?.user_review_comment
              };
            })
          });
        } else {
          console.error(orderResult.reason);
          toast.error('Unable to load order details');
        }

        if (addressesResult.status === 'fulfilled') {
          setAddresses(addressesResult.value.data.data || []);
        }

        if (productsResult.status === 'fulfilled') {
          setRecommendations(productsResult.value.data.data || []);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber]);

  const defaultAddress = useMemo(() => (
    addresses.find(address => address.is_default) || addresses[0] || null
  ), [addresses]);

  const address = useMemo(() => (
    addresses.find(item => item.id === order?.shipping_address_id) || defaultAddress
  ), [addresses, defaultAddress, order?.shipping_address_id]);

  const buyAgainItems = useMemo(() => order?.items || [], [order?.items]);
  const firstItem = buyAgainItems[0];
  const deliveredCount = order && normalizeStatus(order.status) === 'delivered' ? 1 : 0;

  const updateItemRating = (itemId, rating, comment) => {
    setOrder(current => {
      if (!current) return current;

      return {
        ...current,
        items: (current.items || []).map(item => (
          item.id === itemId
            ? {
              ...item,
              user_rating: rating,
              user_review_comment: comment !== undefined ? comment : item.user_review_comment
            }
            : item
        ))
      };
    });
  };

  const openReviewModal = (item) => {
    setActiveReview({ order, item });
    setReviewRating(Number(item.user_rating) || 0);
    setReviewFeedback(item.user_review_comment || '');
    setReviewImages([]);
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setActiveReview(null);
    setReviewRating(0);
    setReviewFeedback('');
    setReviewImages([]);
  };

  const handleReviewImagesChange = (files) => {
    const selectedFiles = Array.from(files || []).filter(file => file.type?.startsWith('image/'));
    setReviewImages(current => [...current, ...selectedFiles].slice(0, 5));
  };

  const handleRemoveReviewImage = (index) => {
    setReviewImages(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmitReview = async () => {
    if (!activeReview || !reviewRating) return;

    const { item } = activeReview;
    const wasRated = Boolean(item.user_rating);
    const comment = reviewFeedback.trim();

    setReviewSubmitting(true);
    try {
      await api.post('/users/reviews', {
        productId: item.product_id,
        rating: reviewRating,
        title: 'Customer feedback',
        comment: comment || null,
        images: reviewImages.map(file => file.name)
      });

      updateItemRating(item.id, reviewRating, comment);
      toast.success(wasRated ? 'Review updated' : 'Review submitted');
      setActiveReview(null);
      setReviewRating(0);
      setReviewFeedback('');
      setReviewImages([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRating = async (event, ratingOrder, item, rating) => {
    event?.stopPropagation?.();
    if (ratingOrder.status !== 'delivered') return;

    const ratingKey = `${ratingOrder.id}-${item.id}`;
    const wasRated = Boolean(item.user_rating);

    setRatingSubmitting(ratingKey);
    try {
      await api.post('/users/reviews', {
        productId: item.product_id,
        rating
      });
      updateItemRating(item.id, rating);
      toast.success(wasRated ? 'Rating updated' : 'Rating submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit rating');
    } finally {
      setRatingSubmitting(null);
    }
  };

  const renderRating = (ratingOrder, item) => {
    if (ratingOrder.status !== 'delivered') {
      return <p className="text-xs font-medium text-gray-400">Rating opens after delivery</p>;
    }

    const selectedRating = Number(item.user_rating) || 0;
    const ratingKey = `${ratingOrder.id}-${item.id}`;

    return (
      <div>
        <div className="flex justify-start gap-0.5" aria-label={selectedRating ? `Rated ${selectedRating} stars` : 'Rate product'}>
          {[1, 2, 3, 4, 5].map(rating => {
            const StarIcon = rating <= selectedRating ? HiStar : HiOutlineStar;

            return (
              <button
                key={rating}
                type="button"
                disabled={ratingSubmitting === ratingKey}
                onClick={(event) => handleRating(event, ratingOrder, item, rating)}
                className={`rounded-lg p-1 transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                  rating <= selectedRating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
                aria-label={`Rate ${rating} star${rating === 1 ? '' : 's'}`}
              >
                <StarIcon size={20} className={rating <= selectedRating ? 'fill-current' : ''} />
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-left text-xs text-gray-400">
          {ratingSubmitting === ratingKey ? 'Updating...' : selectedRating ? 'Change rating' : 'Rate product'}
        </p>
      </div>
    );
  };

  const handleDownloadInvoice = (selectedOrder) => {
    const blob = new Blob([buildInvoiceText(selectedOrder)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VShop-invoice-${selectedOrder.order_number}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  const handleBuyAgain = async (item) => {
    const key = `item-${item.id}`;
    setCartSubmitting(key);

    try {
      await addToCart(item.product_id, item.quantity || 1, item.variant_id || null);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to add item to cart');
    } finally {
      setCartSubmitting(null);
    }
  };

  const handleReorder = async (selectedOrder) => {
    const key = `order-${selectedOrder.id}`;
    setCartSubmitting(key);

    try {
      for (const item of selectedOrder.items || []) {
        await addToCart(item.product_id, item.quantity || 1, item.variant_id || null);
      }
      toast.success('Order items added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to reorder items');
    } finally {
      setCartSubmitting(null);
    }
  };

  const handleRecommendedCart = async (item, isProduct) => {
    const key = isProduct ? `product-${item.id}` : `again-${item.id}`;
    setCartSubmitting(key);

    try {
      await addToCart(isProduct ? item.id : item.product_id, isProduct ? 1 : item.quantity || 1, isProduct ? null : item.variant_id || null);
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to add item to cart');
    } finally {
      setCartSubmitting(null);
    }
  };

  const handleSupportAction = (action) => {
    if (action === 'track') {
      toast.success('You are viewing the latest shipment details');
      return;
    }

    if (action === 'call') {
      window.location.href = 'tel:+18001234567';
      return;
    }

    if (action === 'return') {
      toast.success('Return request flow opened');
      return;
    }

    toast.success('Live chat session starting');
  };

  if (loading) return <LoadingDetail />;
  if (!order) return <OrderNotFound />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/70 to-violet-50/80 py-6 dark:from-gray-950 dark:via-gray-950 dark:to-primary-950/30 md:py-8">
      <div className="container-custom">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb items={[{ name: 'Orders', path: '/orders' }, { name: orderNumber }]} />
          <button type="button" onClick={() => navigate('/orders')} className="btn-secondary !px-4 !py-2 text-sm gap-2">
            <HiOutlineArrowLeft size={16} />
            Back to Orders
          </button>
        </div>

        <PageIntro
          orderCount={1}
          deliveredCount={deliveredCount}
          totalSavings={toNumber(order.discount_amount)}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-5"
        >
          <OrderHero
            order={order}
            reorderBusy={cartSubmitting === `order-${order.id}`}
            onDownloadInvoice={handleDownloadInvoice}
            onReorder={handleReorder}
          />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
            <div className="space-y-5">
              <StatusTracker order={order} />
              <LiveTrackingCard order={order} />

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600 dark:text-primary-300">Products</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">Items in this order</h3>
                </div>

                {(order.items || []).map(item => (
                  <ProductCard
                    key={item.id}
                    order={order}
                    item={item}
                    isBusy={cartSubmitting === `item-${item.id}`}
                    onBuyAgain={handleBuyAgain}
                    onOpenReview={openReviewModal}
                    renderRating={renderRating}
                  />
                ))}
              </div>

              <TimelineCard order={order} />
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <SummaryCard order={order} />
              <CustomerCard order={order} address={address} user={user} />
              <SupportCard order={order} onSupportAction={handleSupportAction} />
              <DeliverySuccessCard order={order} firstItem={firstItem} onOpenReview={openReviewModal} renderRating={renderRating} />
            </aside>
          </div>

          <div className="space-y-8 pt-4">
            <RecommendedCarousel
              title="Buy Again"
              subtitle="Your favorites"
              items={buyAgainItems}
              cartSubmitting={cartSubmitting}
              onAddToCart={handleRecommendedCart}
            />
            <RecommendedCarousel
              title="You May Also Like"
              subtitle="Recommended Products"
              items={recommendations}
              cartSubmitting={cartSubmitting}
              onAddToCart={handleRecommendedCart}
              type="product"
            />
          </div>
        </motion.div>
      </div>

      <ReviewModal
        review={activeReview}
        rating={reviewRating}
        feedback={reviewFeedback}
        images={reviewImages}
        submitting={reviewSubmitting}
        onClose={closeReviewModal}
        onRatingChange={setReviewRating}
        onFeedbackChange={setReviewFeedback}
        onImagesChange={handleReviewImagesChange}
        onRemoveImage={handleRemoveReviewImage}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

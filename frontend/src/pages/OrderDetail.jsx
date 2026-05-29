import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineTruck } from 'react-icons/hi';
import api from '../services/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${orderNumber}`)
      .then(res => setOrder(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return <div className="container-custom py-8"><div className="h-96 skeleton rounded-2xl" /></div>;
  }

  if (!order) return null;

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Orders', path: '/orders' }, { name: orderNumber }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Order #{order.order_number}</h1>
          <p className="text-gray-500 text-sm mt-1">Placed on {formatDate(order.created_at)}</p>
        </div>
        <Link to="/orders" className="btn-secondary !px-4 !py-2 text-sm">
          <HiOutlineArrowLeft size={16} className="mr-1" /> Back
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <HiOutlineTruck size={24} className="text-primary-600" />
              <div>
                <p className="font-medium">Order Status</p>
                <span className={`badge text-sm ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-3">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  {item.product_image && (
                    <img src={item.product_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    {item.variant_info && <p className="text-xs text-gray-500">{item.variant_info}</p>}
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Tracking Updates</h3>
              <div className="space-y-4">
                {order.tracking.map((t, i) => (
                  <div key={t.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {i < order.tracking.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium capitalize">{t.status}</p>
                      <p className="text-xs text-gray-500">{t.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(t.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24 space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{formatPrice(order.shipping_cost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatPrice(order.tax_amount)}</span></div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount_amount)}</span></div>
              )}
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatPrice(order.total_amount)}</span></div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium">Payment</p>
              <p className="text-sm text-gray-500 capitalize">{order.payment_method} - {order.payment_status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag } from 'react-icons/hi';
import api from '../services/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'My Orders' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.order_number}`} className="card p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium">{order.order_number}</p>
                  <span className={`badge text-xs ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{formatDate(order.created_at)}</span>
                  <span>{order.payment_method}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{formatPrice(order.total_amount)}</p>
                <span className={`badge text-xs ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status}</span>
              </div>
            </Link>
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

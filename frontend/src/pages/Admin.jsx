import { useState, useEffect } from 'react';
import { HiOutlineShoppingBag, HiOutlineUsers, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineExclamationCircle } from 'react-icons/hi';
import api from '../services/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/dashboard')
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: HiOutlineCurrencyDollar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: HiOutlineShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: HiOutlineUsers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: HiOutlineCube, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' }
  ];

  return (
    <div className="container-custom py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label} className={`card p-4 md:p-6 ${stat.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={24} className={stat.color} />
            </div>
            <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <HiOutlineShoppingBag size={20} className="text-primary-600" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {stats?.recentOrders?.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-gray-500">{order.user_name} - {formatDate(order.created_at)}</p>
                </div>
                <span className={`badge text-xs ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <HiOutlineExclamationCircle size={20} className="text-amber-600" />
            Low Stock Alerts
          </h3>
          <div className="space-y-3">
            {stats?.lowStock?.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-gray-500">Threshold: {product.low_stock_threshold}</p>
                </div>
                <span className="badge-danger text-xs">{product.stock_quantity} left</span>
              </div>
            ))}
            {(!stats?.lowStock || stats.lowStock.length === 0) && (
              <p className="text-sm text-green-600 text-center py-4">All products are well-stocked</p>
            )}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <HiOutlineChartBar size={20} className="text-primary-600" />
            Orders by Status
          </h3>
          <div className="space-y-3">
            {stats?.ordersByStatus?.map(os => (
              <div key={os.status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{os.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(os.count / Math.max(...stats.ordersByStatus.map(s => s.count))) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{os.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Product', icon: HiOutlineCube, href: '#' },
              { label: 'View Orders', icon: HiOutlineShoppingBag, href: '#' },
              { label: 'Manage Users', icon: HiOutlineUsers, href: '#' },
              { label: 'Sales Report', icon: HiOutlineChartBar, href: '#' }
            ].map(action => (
              <button key={action.label} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <action.icon size={20} className="text-primary-600" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/helpers';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data.data)).catch(console.error);
    api.get('/users/addresses').then(res => setAddresses(res.data.data)).catch(console.error);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineUser },
    { id: 'orders', label: 'Orders', icon: HiOutlineShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: HiOutlineLocationMarker }
  ];

  return (
    <div className="container-custom py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="card p-4 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
            <hr className="my-2 border-gray-100 dark:border-gray-800" />
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <HiOutlineLogout size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">{user?.name?.[0]}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{user?.name}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <span className="badge-primary text-xs mt-1">{user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Orders', value: orders.length, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/30' },
                  { label: 'Wishlist', value: '0', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' },
                  { label: 'Addresses', value: addresses.length.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' }
                ].map(stat => (
                  <div key={stat.label} className={`card p-4 ${stat.bg}`}>
                    <p className="text-2xl font-bold ${stat.color}">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order History</h3>
              {orders.length === 0 ? (
                <div className="card p-8 text-center">
                  <HiOutlineShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No orders yet</p>
                  <Link to="/shop" className="btn-primary mt-4 inline-flex">Start Shopping</Link>
                </div>
              ) : (
                orders.map(order => (
                  <Link key={order.id} to={`/orders/${order.order_number}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-medium text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{order.total_amount}</p>
                      <span className={`badge text-xs ${order.status === 'delivered' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Saved Addresses</h3>
              {addresses.length === 0 ? (
                <div className="card p-8 text-center">
                  <HiOutlineLocationMarker size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No addresses saved</p>
                </div>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} className="card p-4">
                    <p className="font-medium">{addr.full_name}</p>
                    <p className="text-sm text-gray-500">{addr.street}, {addr.city}, {addr.state} - {addr.zip_code}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    {addr.is_default && <span className="badge-primary text-xs mt-1">Default</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

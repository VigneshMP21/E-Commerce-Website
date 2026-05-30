import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineClipboardList,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentReport,
  HiOutlineExclamationCircle,
  HiOutlinePlusCircle,
  HiOutlineRefresh,
  HiOutlineShoppingBag,
  HiOutlineUsers
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const initialProductForm = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: '',
  comparePrice: '',
  categoryId: '',
  brand: '',
  stockQuantity: '',
  sku: '',
  imageUrl: '',
  status: 'active',
  isFeatured: false
};

const makeSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const flattenCategories = (categories = []) => categories.flatMap(category => ([
  { id: category.id, name: category.name },
  ...(category.subcategories || []).map(subcategory => ({
    id: subcategory.id,
    name: `${category.name} / ${subcategory.name}`
  }))
]));

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activePanel, setActivePanel] = useState('report');
  const [productForm, setProductForm] = useState(initialProductForm);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const productRef = useRef(null);
  const ordersRef = useRef(null);
  const usersRef = useRef(null);
  const reportRef = useRef(null);

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const monthlyRevenue = stats?.monthlyRevenue || [];
  const peakMonthlyRevenue = useMemo(
    () => Math.max(0, ...monthlyRevenue.map(item => Number(item.revenue) || 0)),
    [monthlyRevenue]
  );
  const chartMaxRevenue = Math.max(1, peakMonthlyRevenue);
  const maxStatusCount = useMemo(
    () => Math.max(1, ...(stats?.ordersByStatus || []).map(item => Number(item.count) || 0)),
    [stats?.ordersByStatus]
  );

  const loadDashboard = async () => {
    const res = await api.get('/users/dashboard');
    setStats(res.data.data);
  };

  useEffect(() => {
    Promise.all([
      loadDashboard(),
      api.get('/products/categories').then(res => setCategories(res.data.data)).catch(console.error)
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/all?limit=10');
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/users/admin?limit=10');
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const scrollToPanel = (panel) => {
    const refs = {
      product: productRef,
      orders: ordersRef,
      users: usersRef,
      report: reportRef
    };

    window.setTimeout(() => {
      refs[panel]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleQuickAction = (panel) => {
    setActivePanel(panel);
    if (panel === 'orders') loadOrders();
    if (panel === 'users') loadUsers();
    scrollToPanel(panel);
  };

  const handleNameChange = (value) => {
    setProductForm(prev => ({
      ...prev,
      name: value,
      slug: !prev.slug || prev.slug === makeSlug(prev.name) ? makeSlug(value) : prev.slug
    }));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const price = Number(productForm.price);
    const comparePrice = productForm.comparePrice ? Number(productForm.comparePrice) : null;
    const stockQuantity = productForm.stockQuantity ? Number(productForm.stockQuantity) : 0;
    const slug = productForm.slug.trim() || makeSlug(productForm.name);

    if (!productForm.name.trim() || !slug || Number.isNaN(price)) {
      toast.error('Product name, slug and valid price are required');
      return;
    }

    setProductSubmitting(true);
    try {
      await api.post('/products', {
        name: productForm.name.trim(),
        slug,
        shortDescription: productForm.shortDescription.trim() || null,
        description: productForm.description.trim() || productForm.shortDescription.trim() || null,
        price,
        comparePrice,
        categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
        brand: productForm.brand.trim() || null,
        stockQuantity,
        sku: productForm.sku.trim() || null,
        images: productForm.imageUrl.split(',').map(url => url.trim()).filter(Boolean),
        specifications: [],
        isFeatured: productForm.isFeatured,
        status: productForm.status
      });

      toast.success('Product created successfully');
      setProductForm(initialProductForm);
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create product');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(current => current.map(order => (
        order.id === orderId ? { ...order, status } : order
      )));
      toast.success('Order status updated');
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update order');
    } finally {
      setUpdatingOrderId(null);
    }
  };

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

  const quickActions = [
    {
      key: 'product',
      label: 'Add Product',
      description: 'Create a new catalog item',
      icon: HiOutlinePlusCircle,
      accent: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30',
      metric: `${stats?.totalProducts || 0} live products`
    },
    {
      key: 'orders',
      label: 'View Orders',
      description: 'Review and update fulfillment',
      icon: HiOutlineClipboardList,
      accent: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
      metric: `${stats?.totalOrders || 0} total orders`
    },
    {
      key: 'users',
      label: 'Manage Users',
      description: 'Inspect customers and admins',
      icon: HiOutlineUsers,
      accent: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30',
      metric: `${stats?.totalUsers || 0} customers`
    },
    {
      key: 'report',
      label: 'Sales Report',
      description: 'Track monthly paid revenue',
      icon: HiOutlineDocumentReport,
      accent: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
      metric: `${monthlyRevenue.length} month trend`
    }
  ];

  return (
    <div className="container-custom py-6 md:py-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage store operations, inventory and sales performance.</p>
        </div>
        <button
          type="button"
          onClick={() => loadDashboard().then(() => toast.success('Dashboard refreshed'))}
          className="btn-secondary gap-2 !py-2.5"
        >
          <HiOutlineRefresh size={18} />
          Refresh
        </button>
      </div>

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

      <div className="card p-5 md:p-6 mb-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Quick Actions</h3>
            <p className="mt-1 text-sm text-gray-500">Start the most common admin tasks from one place.</p>
          </div>
          <span className="hidden sm:inline-flex badge-primary">Admin tools</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(action => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleQuickAction(action.key)}
              className={`group flex min-h-[116px] items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                activePanel === action.key
                  ? 'border-primary-300 bg-primary-50/70 ring-2 ring-primary-100 dark:border-primary-700 dark:bg-primary-950/30 dark:ring-primary-900/40'
                  : 'border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-white dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-primary-800 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.accent}`}>
                  <action.icon size={22} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{action.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{action.description}</span>
                  <span className="mt-2 block text-[11px] font-medium uppercase tracking-wide text-gray-400">{action.metric}</span>
                </span>
              </div>
              <HiOutlineArrowRight size={18} className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" />
            </button>
          ))}
        </div>
      </div>

      {activePanel === 'product' && (
        <div ref={productRef} className="card p-6 mb-8 scroll-mt-24">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HiOutlinePlusCircle size={20} className="text-primary-600" />
                Add Product
              </h3>
              <p className="text-sm text-gray-500">Create a product with pricing, inventory and catalog details.</p>
            </div>
            <span className="badge-primary w-fit">Catalog</span>
          </div>

          <form onSubmit={handleProductSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Product Name</label>
              <input className="input-field" value={productForm.name} onChange={e => handleNameChange(e.target.value)} placeholder="Premium wireless headphones" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Slug</label>
              <input className="input-field" value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: makeSlug(e.target.value) })} placeholder="premium-wireless-headphones" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Price</label>
              <input type="number" min="0" step="0.01" className="input-field" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="1999" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Compare Price</label>
              <input type="number" min="0" step="0.01" className="input-field" value={productForm.comparePrice} onChange={e => setProductForm({ ...productForm, comparePrice: e.target.value })} placeholder="2499" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select className="input-field" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categoryOptions.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Brand</label>
              <input className="input-field" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} placeholder="V Shop" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
              <input type="number" min="0" className="input-field" value={productForm.stockQuantity} onChange={e => setProductForm({ ...productForm, stockQuantity: e.target.value })} placeholder="50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">SKU</label>
              <input className="input-field" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} placeholder="VS-HEAD-001" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Short Description</label>
              <input className="input-field" value={productForm.shortDescription} onChange={e => setProductForm({ ...productForm, shortDescription: e.target.value })} placeholder="Compact summary shown in product listings" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea className="input-field min-h-[112px]" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Detailed product description" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Image URLs</label>
              <input className="input-field" value={productForm.imageUrl} onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg, https://example.com/alt.jpg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select className="input-field" value={productForm.status} onChange={e => setProductForm({ ...productForm, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              <input type="checkbox" checked={productForm.isFeatured} onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Mark as featured product
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setProductForm(initialProductForm)}>Clear</button>
              <button type="submit" disabled={productSubmitting} className="btn-primary gap-2">
                <HiOutlineCheckCircle size={18} />
                {productSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activePanel === 'orders' && (
        <div ref={ordersRef} className="card p-6 mb-8 scroll-mt-24">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HiOutlineClipboardList size={20} className="text-blue-600" />
                Order Management
              </h3>
              <p className="text-sm text-gray-500">Review the latest orders and update fulfillment status.</p>
            </div>
            <button type="button" onClick={loadOrders} className="btn-secondary gap-2 !py-2">
              <HiOutlineRefresh size={16} />
              Reload
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                <tr>
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Total</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ordersLoading && (
                  <tr><td colSpan="6" className="py-6 text-center text-gray-500">Loading orders...</td></tr>
                )}
                {!ordersLoading && orders.map(order => (
                  <tr key={order.id}>
                    <td className="py-3 pr-4 font-medium">{order.order_number}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{order.user_name}</p>
                      <p className="text-xs text-gray-500">{order.user_email}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="py-3 pr-4 font-semibold">{formatPrice(order.total_amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge text-xs ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={e => handleOrderStatusChange(order.id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
                      >
                        {orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!ordersLoading && orders.length === 0 && (
                  <tr><td colSpan="6" className="py-6 text-center text-gray-500">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === 'users' && (
        <div ref={usersRef} className="card p-6 mb-8 scroll-mt-24">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HiOutlineUsers size={20} className="text-indigo-600" />
                Manage Users
              </h3>
              <p className="text-sm text-gray-500">Inspect recent users, roles and customer value.</p>
            </div>
            <button type="button" onClick={loadUsers} className="btn-secondary gap-2 !py-2">
              <HiOutlineRefresh size={16} />
              Reload
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                <tr>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Orders</th>
                  <th className="py-3 pr-4">Total Spent</th>
                  <th className="py-3 pr-4">Joined</th>
                  <th className="py-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {usersLoading && (
                  <tr><td colSpan="6" className="py-6 text-center text-gray-500">Loading users...</td></tr>
                )}
                {!usersLoading && users.map(user => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4"><span className="badge-primary capitalize">{user.role}</span></td>
                    <td className="py-3 pr-4 font-medium">{user.order_count}</td>
                    <td className="py-3 pr-4 font-semibold">{formatPrice(user.total_spent || 0)}</td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="py-3 pr-4">
                      <span className={`badge text-xs ${user.is_verified ? 'badge-success' : 'badge-warning'}`}>
                        {user.is_verified ? 'verified' : 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {!usersLoading && users.length === 0 && (
                  <tr><td colSpan="6" className="py-6 text-center text-gray-500">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === 'report' && (
        <div ref={reportRef} className="card p-6 mb-8 scroll-mt-24">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HiOutlineDocumentReport size={20} className="text-purple-600" />
                Sales Report
              </h3>
              <p className="text-sm text-gray-500">Paid revenue trend for the latest reporting months.</p>
            </div>
            <div className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {formatPrice(stats?.totalRevenue || 0)} total revenue
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
              <div className="flex h-64 items-end gap-3">
                {monthlyRevenue.length > 0 ? monthlyRevenue.map(item => {
                  const revenue = Number(item.revenue) || 0;
                  return (
                    <div key={item.month} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div className="rounded-t-xl bg-gradient-to-t from-primary-600 to-primary-300" style={{ height: `${Math.max(8, (revenue / chartMaxRevenue) * 100)}%` }} />
                      <p className="truncate text-center text-[11px] text-gray-500">{item.month}</p>
                    </div>
                  );
                }) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No paid revenue yet</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-400">Best month</p>
                <p className="mt-2 text-2xl font-bold">{formatPrice(peakMonthlyRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-400">Orders tracked</p>
                <p className="mt-2 text-2xl font-bold">{stats?.totalOrders || 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-400">Average revenue/order</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatPrice((stats?.totalRevenue || 0) / Math.max(stats?.totalOrders || 0, 1))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
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

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <HiOutlineChartBar size={20} className="text-primary-600" />
            Orders by Status
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {stats?.ordersByStatus?.map(os => (
              <div key={os.status} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <span className="text-sm capitalize">{os.status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(os.count / maxStatusCount) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{os.count}</span>
                </div>
              </div>
            ))}
            {(!stats?.ordersByStatus || stats.ordersByStatus.length === 0) && (
              <p className="text-sm text-gray-500 py-4">No order status data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  HiOutlineMenuAlt4,
  HiOutlinePhotograph,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePlusCircle,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineShoppingBag,
  HiOutlineTrash,
  HiOutlineUpload,
  HiOutlineUsers,
  HiOutlineX
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
  categoryName: '',
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

const makeImageItem = (url, source = 'url', name = '') => ({
  id: `${source}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  url,
  source,
  name
});

const parseImageUrls = (value = '') => value
  .split(/[\n,]+/)
  .map(url => url.trim())
  .filter(Boolean);

const uniqueUrls = (urls = []) => {
  const seen = new Set();
  return urls.filter(url => {
    const normalized = url.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

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
  const [productImages, setProductImages] = useState([]);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productEditForm, setProductEditForm] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const productRef = useRef(null);
  const manageProductsRef = useRef(null);
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
  const newCategoryPending = productForm.categoryName.trim()
    && !categoryOptions.some(category => category.name.toLowerCase() === productForm.categoryName.trim().toLowerCase());

  const findCategoryMatch = (value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    return categoryOptions.find(category => category.name.toLowerCase() === normalized) || null;
  };

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

  useEffect(() => {
    if (!productForm.categoryName.trim() || productForm.categoryId) return;

    const match = findCategoryMatch(productForm.categoryName);
    if (match) {
      setProductForm(prev => ({ ...prev, categoryId: String(match.id) }));
    }
  }, [categoryOptions, productForm.categoryId, productForm.categoryName]);

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

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/products?status=all&limit=1000&sort=newest');
      setProducts(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const startProductEdit = (product) => {
    setEditingProductId(product.id);
    setProductEditForm({
      name: product.name || '',
      price: product.price ?? '',
      comparePrice: product.compare_price ?? '',
      categoryId: product.category_id ? String(product.category_id) : '',
      stockQuantity: product.stock_quantity ?? '',
      sku: product.sku || '',
      status: product.status || 'active',
      isFeatured: Boolean(product.is_featured)
    });
  };

  const cancelProductEdit = () => {
    setEditingProductId(null);
    setProductEditForm(null);
  };

  const handleProductUpdate = async (productId) => {
    if (!productEditForm?.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const price = Number(productEditForm.price);
    const comparePrice = productEditForm.comparePrice ? Number(productEditForm.comparePrice) : null;
    const stockQuantity = productEditForm.stockQuantity ? Number(productEditForm.stockQuantity) : 0;

    if (Number.isNaN(price)) {
      toast.error('Valid price is required');
      return;
    }

    try {
      await api.put(`/products/${productId}`, {
        name: productEditForm.name.trim(),
        price,
        comparePrice,
        categoryId: productEditForm.categoryId ? Number(productEditForm.categoryId) : null,
        stockQuantity,
        sku: productEditForm.sku.trim() || null,
        status: productEditForm.status,
        isFeatured: productEditForm.isFeatured
      });
      toast.success('Product updated');
      cancelProductEdit();
      await Promise.all([loadProducts(), loadDashboard()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update product');
    }
  };

  const handleProductDelete = async (product) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingProductId(product.id);
    try {
      await api.delete(`/products/${product.id}`);
      setProducts(current => current.filter(item => item.id !== product.id));
      toast.success('Product deleted');
      await loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete product');
    } finally {
      setDeletingProductId(null);
    }
  };

  const scrollToPanel = (panel) => {
    const refs = {
      product: productRef,
      manageProducts: manageProductsRef,
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
    if (panel === 'manageProducts') loadProducts();
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

  const handleCategoryChange = (value) => {
    const match = findCategoryMatch(value);
    setProductForm(prev => ({
      ...prev,
      categoryName: value,
      categoryId: match ? String(match.id) : ''
    }));
  };

  const refreshCategories = async () => {
    const res = await api.get('/products/categories');
    setCategories(res.data.data || []);
  };

  const resolveCategoryId = async () => {
    const trimmedCategory = productForm.categoryName.trim();
    if (!trimmedCategory) return null;

    const matchedCategory = findCategoryMatch(trimmedCategory);
    if (matchedCategory) return Number(matchedCategory.id);

    const res = await api.post('/products/categories', { name: trimmedCategory });
    const category = res.data.data;
    if (!category?.id) {
      throw new Error('Category could not be created');
    }

    setProductForm(prev => ({
      ...prev,
      categoryId: String(category.id),
      categoryName: category.name
    }));
    await refreshCategories();
    return Number(category.id);
  };

  const addImageUrls = () => {
    const urls = uniqueUrls(parseImageUrls(productForm.imageUrl));

    if (!urls.length) {
      toast.error('Enter at least one image URL');
      return;
    }

    const existing = new Set(productImages.map(image => image.url.trim().toLowerCase()));
    const additions = urls
      .filter(url => !existing.has(url.trim().toLowerCase()))
      .map(url => makeImageItem(url));

    if (!additions.length) {
      toast.error('Those image URLs are already in the list');
      return;
    }

    setProductImages(prev => [...prev, ...additions]);
    setProductForm(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    setUploadingImages(true);
    try {
      const res = await api.post('/products/images', formData);
      const uploadedImages = (res.data.data || []).map(file => (
        makeImageItem(file.url, 'upload', file.originalName || file.filename || 'Uploaded image')
      ));

      setProductImages(prev => [...prev, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to upload images');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const moveImage = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === toIndex) return;

    setProductImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const removeImage = (imageId) => {
    setProductImages(prev => prev.filter(image => image.id !== imageId));
  };

  const clearProductForm = () => {
    setProductForm(initialProductForm);
    setProductImages([]);
    setDraggedImageIndex(null);
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
      const categoryId = await resolveCategoryId();
      const pendingImageUrls = parseImageUrls(productForm.imageUrl);
      const images = uniqueUrls([
        ...productImages.map(image => image.url),
        ...pendingImageUrls
      ]);

      await api.post('/products', {
        name: productForm.name.trim(),
        slug,
        shortDescription: productForm.shortDescription.trim() || null,
        description: productForm.description.trim() || productForm.shortDescription.trim() || null,
        price,
        comparePrice,
        categoryId,
        brand: productForm.brand.trim() || null,
        stockQuantity,
        sku: productForm.sku.trim() || null,
        images,
        specifications: [],
        isFeatured: productForm.isFeatured,
        status: productForm.status
      });

      toast.success('Product created successfully');
      clearProductForm();
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
      key: 'manageProducts',
      label: 'Manage Product',
      description: 'Edit or remove catalog items',
      icon: HiOutlineCube,
      accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
      metric: `${products.length || stats?.totalProducts || 0} products listed`
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
              <input
                className="input-field"
                list="admin-category-options"
                value={productForm.categoryName}
                onChange={e => handleCategoryChange(e.target.value)}
                placeholder="Type or select category"
              />
              <datalist id="admin-category-options">
                {categoryOptions.map(category => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
              {newCategoryPending && (
                <p className="mt-1.5 text-xs text-primary-600">New category will be added to the dropdown list.</p>
              )}
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input-field"
                  value={productForm.imageUrl}
                  onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg, https://example.com/alt.jpg"
                />
                <button type="button" onClick={addImageUrls} className="btn-secondary shrink-0 gap-2">
                  <HiOutlinePlus size={17} />
                  Add URL
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Upload Images</label>
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors dark:border-gray-700 ${
                uploadingImages
                  ? 'border-primary-300 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300'
                  : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/60 dark:bg-gray-800 dark:hover:border-primary-700 dark:hover:bg-primary-950/20'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingImages}
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                <HiOutlineUpload size={24} className="mb-2 text-primary-600" />
                <span className="text-sm font-medium">{uploadingImages ? 'Uploading images...' : 'Choose image files'}</span>
                <span className="mt-1 text-xs text-gray-500">JPG, PNG, WebP or GIF. Multiple files supported.</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium">Image Preview Order</label>
                <span className="text-xs text-gray-500">{productImages.length} image{productImages.length === 1 ? '' : 's'}</span>
              </div>
              {productImages.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {productImages.map((image, index) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={() => setDraggedImageIndex(index)}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        moveImage(draggedImageIndex, index);
                        setDraggedImageIndex(null);
                      }}
                      className={`rounded-xl border bg-white p-2 transition-all dark:bg-gray-900 ${
                        draggedImageIndex === index
                          ? 'border-primary-300 opacity-70 ring-2 ring-primary-100 dark:ring-primary-900/40'
                          : 'border-gray-200 hover:border-primary-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        <img src={image.url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                        <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-gray-900/90"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <HiOutlineTrash size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <HiOutlineMenuAlt4 size={16} className="shrink-0 cursor-grab text-gray-400" />
                        <span className="truncate">{image.source === 'upload' ? image.name : image.url}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                  <HiOutlinePhotograph size={24} className="mx-auto mb-2 text-gray-400" />
                  Add image URLs or upload files to preview and drag images into the final order.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select className="input-field" value={productForm.status} onChange={e => setProductForm({ ...productForm, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
              <input type="checkbox" checked={productForm.isFeatured} onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Mark as featured product
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={clearProductForm}>Clear</button>
              <button type="submit" disabled={productSubmitting} className="btn-primary gap-2">
                <HiOutlineCheckCircle size={18} />
                {productSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activePanel === 'manageProducts' && (
        <div ref={manageProductsRef} className="card p-6 mb-8 scroll-mt-24">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <HiOutlineCube size={20} className="text-emerald-600" />
                Manage Product
              </h3>
              <p className="text-sm text-gray-500">Review catalog items and update or delete products.</p>
            </div>
            <button type="button" onClick={loadProducts} className="btn-secondary gap-2 !py-2">
              <HiOutlineRefresh size={16} />
              Reload
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800">
                <tr>
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Featured</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {productsLoading && (
                  <tr><td colSpan="7" className="py-6 text-center text-gray-500">Loading products...</td></tr>
                )}
                {!productsLoading && products.map(product => {
                  const productImage = Array.isArray(product.images) ? product.images[0] : '';
                  const isEditing = editingProductId === product.id && productEditForm;

                  return [
                      <tr key={product.id}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                              {productImage ? (
                                <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <HiOutlinePhotograph size={20} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900 dark:text-white">{product.name}</p>
                              <p className="truncate text-xs text-gray-500">{product.sku || product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">{product.category_name || 'Unassigned'}</td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold">{formatPrice(product.price)}</p>
                          {product.compare_price && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(product.compare_price)}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium">{product.stock_quantity}</td>
                        <td className="py-3 pr-4">
                          <span className={`badge text-xs ${
                            product.status === 'active'
                              ? 'badge-success'
                              : product.status === 'draft'
                                ? 'badge-warning'
                                : 'badge-danger'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`badge text-xs ${product.is_featured ? 'badge-primary' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                            {product.is_featured ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startProductEdit(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:bg-primary-950/30"
                              aria-label={`Edit ${product.name}`}
                            >
                              <HiOutlinePencil size={17} />
                            </button>
                            <button
                              type="button"
                              disabled={deletingProductId === product.id}
                              onClick={() => handleProductDelete(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/30"
                              aria-label={`Delete ${product.name}`}
                            >
                              <HiOutlineTrash size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>,
                      isEditing && (
                        <tr key={`${product.id}-edit`} className="bg-gray-50/80 dark:bg-gray-800/50">
                          <td colSpan="7" className="py-4">
                            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                              <div className="md:col-span-2 xl:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <input
                                  className="input-field"
                                  value={productEditForm.name}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="input-field"
                                  value={productEditForm.price}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, price: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Compare</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="input-field"
                                  value={productEditForm.comparePrice}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, comparePrice: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="input-field"
                                  value={productEditForm.stockQuantity}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">SKU</label>
                                <input
                                  className="input-field"
                                  value={productEditForm.sku}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, sku: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <select
                                  className="input-field"
                                  value={productEditForm.categoryId}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                                >
                                  <option value="">Unassigned</option>
                                  {categoryOptions.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select
                                  className="input-field"
                                  value={productEditForm.status}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, status: e.target.value }))}
                                >
                                  <option value="active">Active</option>
                                  <option value="draft">Draft</option>
                                  <option value="out_of_stock">Out of Stock</option>
                                </select>
                              </div>
                              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                                <input
                                  type="checkbox"
                                  checked={productEditForm.isFeatured}
                                  onChange={e => setProductEditForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Featured
                              </label>
                              <div className="flex items-end justify-end gap-2 md:col-span-3 xl:col-span-6">
                                <button type="button" onClick={cancelProductEdit} className="btn-secondary gap-2 !py-2">
                                  <HiOutlineX size={16} />
                                  Cancel
                                </button>
                                <button type="button" onClick={() => handleProductUpdate(product.id)} className="btn-primary gap-2 !py-2">
                                  <HiOutlineSave size={16} />
                                  Save
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  ];
                })}
                {!productsLoading && products.length === 0 && (
                  <tr><td colSpan="7" className="py-6 text-center text-gray-500">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
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

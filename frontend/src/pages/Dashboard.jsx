import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlineKey,
  HiOutlineLocationMarker,
  HiOutlineLogout,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlinePhone,
  HiOutlinePhotograph,
  HiOutlineSave,
  HiOutlineShoppingBag,
  HiOutlineUpload,
  HiOutlineUser,
  HiOutlineX
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';
import { formatDate, formatPrice } from '../utils/helpers';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const CROPPED_AVATAR_SIZE = 512;
const CROPPED_AVATAR_TYPE = 'image/jpeg';
const DEFAULT_AVATAR_CROP = { x: 0, y: 0, size: 0 };
const DASHBOARD_TABS = ['overview', 'orders', 'addresses', 'password'];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getMinimumCropSize = (naturalWidth, naturalHeight) => {
  const maxSize = Math.min(naturalWidth || 0, naturalHeight || 0);
  if (!maxSize) return 0;

  return Math.min(maxSize, Math.max(64, maxSize * 0.2));
};

const getInitialAvatarCrop = (naturalWidth, naturalHeight) => {
  const maxSize = Math.min(naturalWidth || 0, naturalHeight || 0);
  const size = maxSize ? maxSize * 0.72 : 0;

  return {
    x: Math.max(((naturalWidth || 0) - size) / 2, 0),
    y: Math.max(((naturalHeight || 0) - size) / 2, 0),
    size
  };
};

const clampAvatarCrop = (crop, naturalWidth, naturalHeight) => {
  const maxSize = Math.min(naturalWidth || 0, naturalHeight || 0);
  if (!maxSize) return DEFAULT_AVATAR_CROP;

  const minSize = getMinimumCropSize(naturalWidth, naturalHeight);
  const size = clamp(Number(crop.size) || minSize, minSize, maxSize);

  return {
    x: clamp(Number(crop.x) || 0, 0, Math.max((naturalWidth || 0) - size, 0)),
    y: clamp(Number(crop.y) || 0, 0, Math.max((naturalHeight || 0) - size, 0)),
    size
  };
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const createManualCroppedAvatarFile = async (file, imageUrl, crop) => {
  const image = await loadImage(imageUrl);
  const safeCrop = clampAvatarCrop(crop, image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = CROPPED_AVATAR_SIZE;
  canvas.height = CROPPED_AVATAR_SIZE;
  const context = canvas.getContext('2d');
  context.drawImage(
    image,
    safeCrop.x,
    safeCrop.y,
    safeCrop.size,
    safeCrop.size,
    0,
    0,
    CROPPED_AVATAR_SIZE,
    CROPPED_AVATAR_SIZE
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(result => {
      if (result) resolve(result);
      else reject(new Error('Unable to crop image'));
    }, CROPPED_AVATAR_TYPE, 0.92);
  });

  const fileName = `${file.name.replace(/\.[^.]+$/, '') || 'profile'}-cropped.jpg`;
  return new File([blob], fileName, { type: CROPPED_AVATAR_TYPE });
};

const getDefaultProfileForm = (user, phone = '') => ({
  avatar: user?.avatar || '',
  avatarFile: null,
  avatarPreview: '',
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || phone || ''
});

export default function Dashboard() {
  const { user, logout, setUser } = useAuth();
  const { wishlistIds, fetchWishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const getTabFromSearch = () => {
    const requestedTab = searchParams.get('tab');
    return DASHBOARD_TABS.includes(requestedTab) ? requestedTab : 'overview';
  };
  const [activeTab, setActiveTab] = useState(getTabFromSearch);
  const [wishlistCount, setWishlistCount] = useState(wishlistIds?.length || 0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(getDefaultProfileForm(user));
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [avatarCrop, setAvatarCrop] = useState(DEFAULT_AVATAR_CROP);
  const [avatarCropSaving, setAvatarCropSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const defaultAddress = useMemo(
    () => addresses.find(address => address.is_default) || addresses[0],
    [addresses]
  );

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data.data || [])).catch(console.error);
    api.get('/users/addresses').then(res => setAddresses(res.data.data || [])).catch(console.error);
    api.get('/users/wishlist/ids')
      .then(res => setWishlistCount((res.data.data || []).length))
      .catch(() => setWishlistCount(wishlistIds?.length || 0));
    fetchWishlistIds?.();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromSearch());
  }, [searchParams]);

  useEffect(() => {
    setWishlistCount(wishlistIds?.length || 0);
  }, [wishlistIds]);

  useEffect(() => {
    if (!editingProfile) {
      setProfileForm(getDefaultProfileForm(user, defaultAddress?.phone));
    }
  }, [user, defaultAddress, editingProfile]);

  useEffect(() => {
    const previewUrl = profileForm.avatarPreview;
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [profileForm.avatarPreview]);

  useEffect(() => {
    const pendingUrl = pendingAvatar?.url;
    return () => {
      if (pendingUrl) {
        URL.revokeObjectURL(pendingUrl);
      }
    };
  }, [pendingAvatar?.url]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineUser },
    { id: 'orders', label: 'Orders', icon: HiOutlineShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: HiOutlineLocationMarker }
  ];

  const stats = [
    {
      label: 'Total Orders',
      value: orders.length,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/30'
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/30'
    },
    {
      label: 'Addresses',
      value: addresses.length,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30'
    }
  ];

  const updateProfileForm = (field, value) => {
    setProfileForm(current => ({ ...current, [field]: value }));
  };

  const handleProfileImageChange = (file) => {
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error('Profile image must be 5 MB or smaller');
      return;
    }

    setPendingAvatar({
      file,
      url: URL.createObjectURL(file),
      naturalWidth: 0,
      naturalHeight: 0
    });
    setAvatarCrop(DEFAULT_AVATAR_CROP);
  };

  const updateAvatarCrop = (nextCrop) => {
    setAvatarCrop(current => clampAvatarCrop(
      { ...current, ...nextCrop },
      pendingAvatar?.naturalWidth,
      pendingAvatar?.naturalHeight
    ));
  };

  const handlePendingAvatarImageLoad = (naturalWidth, naturalHeight) => {
    const initialCrop = getInitialAvatarCrop(naturalWidth, naturalHeight);
    setPendingAvatar(current => current ? { ...current, naturalWidth, naturalHeight } : current);
    setAvatarCrop(clampAvatarCrop(initialCrop, naturalWidth, naturalHeight));
  };

  const closeAvatarCrop = () => {
    setPendingAvatar(null);
    setAvatarCrop(DEFAULT_AVATAR_CROP);
    setAvatarCropSaving(false);
  };

  const applyAvatarCrop = async () => {
    if (!pendingAvatar) return;

    setAvatarCropSaving(true);
    try {
      const croppedFile = await createManualCroppedAvatarFile(pendingAvatar.file, pendingAvatar.url, avatarCrop);
      const payload = new FormData();
      payload.append('avatarImage', croppedFile);

      const res = await api.put('/auth/profile', payload);
      const updatedUser = res.data.data || user;
      const nextAvatar = updatedUser?.avatar || user?.avatar || '';

      setProfileForm(current => ({
        ...current,
        avatar: nextAvatar,
        avatarFile: null,
        avatarPreview: ''
      }));
      setUser?.(updatedUser);
      setPendingAvatar(null);
      setAvatarCrop(DEFAULT_AVATAR_CROP);
      toast.success(res.data.message || 'Profile image uploaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to upload cropped image');
    } finally {
      setAvatarCropSaving(false);
    }
  };

  const cancelProfileEdit = () => {
    closeAvatarCrop();
    setProfileForm(getDefaultProfileForm(user, defaultAddress?.phone));
    setEditingProfile(false);
  };

  const updatePasswordForm = (field, value) => {
    setPasswordForm(current => ({ ...current, [field]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setProfileSaving(true);
    try {
      const hasAvatarFile = profileForm.avatarFile instanceof File;
      let payload;

      if (hasAvatarFile) {
        payload = new FormData();
        payload.append('name', profileForm.name.trim());
        payload.append('email', profileForm.email.trim());
        payload.append('phone', profileForm.phone.trim());
        payload.append('avatarImage', profileForm.avatarFile);
      } else {
        payload = {
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim() || null,
          avatar: profileForm.avatar.trim() || null
        };
      }

      const res = await api.put('/auth/profile', payload);
      const fallbackUser = {
        ...user,
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim() || null,
        avatar: profileForm.avatar.trim() || user?.avatar || null
      };
      const updatedUser = res.data.data || fallbackUser;
      setUser?.(updatedUser);
      setEditingProfile(false);
      toast.success(res.data.message || 'Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(res.data.message || 'Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: tabId }, { replace: true });
  };

  return (
    <>
      <div className="container-custom py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="card p-4 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
              <hr className="my-2 border-gray-100 dark:border-gray-800" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <HiOutlineLogout size={18} />
                Logout
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="dashboard-stats-grid grid grid-cols-3 gap-3 md:gap-4">
                  {stats.map(stat => (
                    <div key={stat.label} className={`card min-w-0 p-3 md:p-4 ${stat.bg}`}>
                      <p className={`text-xl font-bold md:text-2xl ${stat.color}`}>{stat.value}</p>
                      <p className="mt-1 truncate text-xs text-gray-500 md:text-sm">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <DashboardOverviewContent
                  orders={orders}
                  defaultAddress={defaultAddress}
                  user={user}
                  wishlistCount={wishlistCount}
                />
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
                    <Link
                      key={order.id}
                      to={`/orders/${order.order_number}`}
                      className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(order.total_amount)}</p>
                        <span className={`badge text-xs ${
                          order.status === 'delivered'
                            ? 'badge-success'
                            : order.status === 'cancelled'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                        >
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

            {activeTab === 'password' && (
              <ChangePasswordForm
                form={passwordForm}
                saving={passwordSaving}
                onChange={updatePasswordForm}
                onSubmit={handlePasswordChange}
              />
            )}
          </div>
        </div>
      </div>

      <AvatarCropModal
        pendingAvatar={pendingAvatar}
        crop={avatarCrop}
        saving={avatarCropSaving}
        onCropChange={updateAvatarCrop}
        onImageLoad={handlePendingAvatarImageLoad}
        onCancel={closeAvatarCrop}
        onApply={applyAvatarCrop}
      />
    </>
  );
}

const getOrderBadgeClass = (status) => {
  if (status === 'delivered') return 'badge-success';
  if (status === 'cancelled') return 'badge-danger';
  return 'badge-warning';
};

function DashboardOverviewContent({ orders, defaultAddress, user, wishlistCount }) {
  const recentOrders = orders.slice(0, 3);
  const activeOrders = orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length;
  const checklist = [
    {
      label: 'Account email',
      detail: user?.email || 'Add a valid email address',
      complete: Boolean(user?.email)
    },
    {
      label: 'Delivery address',
      detail: defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : 'Add a shipping address',
      complete: Boolean(defaultAddress)
    },
    {
      label: 'Wishlist',
      detail: wishlistCount > 0 ? `${wishlistCount} saved item${wishlistCount === 1 ? '' : 's'}` : 'Save products for later',
      complete: wishlistCount > 0
    }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <section className="card p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              {activeOrders > 0 ? `${activeOrders} active order${activeOrders === 1 ? '' : 's'} in progress` : 'Your latest purchases appear here.'}
            </p>
          </div>
          <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            View all
            <HiOutlineArrowRight size={16} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentOrders.map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.order_number}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(order.total_amount)}</p>
                  <span className={`badge mt-1 text-xs ${getOrderBadgeClass(order.status)}`}>{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
            <HiOutlineShoppingBag size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No orders yet</p>
            <Link to="/shop" className="btn-primary mt-4 !px-4 !py-2 text-sm">Start Shopping</Link>
          </div>
        )}
      </section>

      <div className="grid gap-6">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delivery Snapshot</h2>
              <p className="mt-1 text-sm text-gray-500">Default checkout details</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <HiOutlineLocationMarker size={20} />
            </span>
          </div>

          {defaultAddress ? (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{defaultAddress.full_name}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.zip_code}
              </p>
              <p className="mt-1 text-sm text-gray-500">{defaultAddress.phone}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Add a delivery address to speed up checkout.</p>
          )}

          <Link to="/addresses" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Manage addresses
            <HiOutlineArrowRight size={16} />
          </Link>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Checklist</h2>
              <p className="mt-1 text-sm text-gray-500">Keep your shopping profile ready</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30">
              <HiOutlineClock size={20} />
            </span>
          </div>

          <div className="space-y-3">
            {checklist.map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <HiOutlineCheckCircle
                  size={18}
                  className={item.complete ? 'mt-0.5 shrink-0 text-emerald-500' : 'mt-0.5 shrink-0 text-gray-300'}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                  <p className="truncate text-xs text-gray-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/wishlist" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700">
            Review wishlist
            <HiOutlineHeart size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}

function ProfileCard({ user, phone, onEdit }) {
  return (
    <div className="card p-6 relative">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit profile"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 dark:border-gray-800 dark:hover:bg-primary-900/30"
      >
        <HiOutlinePencil size={18} />
      </button>

      <div className="flex items-center gap-4 pr-12">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'Profile'}
            className="w-16 h-16 rounded-full object-cover bg-primary-100"
          />
        ) : (
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-600">{user?.name?.[0] || 'U'}</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold truncate">{user?.name || 'User'}</h2>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          {phone && <p className="text-sm text-gray-500 truncate">{phone}</p>}
          <span className="badge-primary text-xs mt-1">{user?.role || 'user'}</span>
        </div>
      </div>
    </div>
  );
}

function ProfileEditForm({ form, saving, onChange, onAvatarChange, onCancel, onSubmit }) {
  const avatarPreview = form.avatarPreview || form.avatar;

  return (
    <form onSubmit={onSubmit} className="card p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <p className="text-sm text-gray-500">Update your account details.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Cancel edit profile"
        >
          <HiOutlineX size={20} />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-[140px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <label
            className="group relative block h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-primary-100 text-primary-600 ring-2 ring-transparent transition hover:ring-primary-300 dark:bg-primary-900"
            aria-label="Upload profile image"
            title="Upload profile image"
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={event => {
                onAvatarChange(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <HiOutlinePhotograph size={34} />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <HiOutlineUpload size={24} />
            </span>
            <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-600 shadow-md dark:bg-gray-900">
              <HiOutlineUpload size={15} />
            </span>
          </label>
          <p className="text-xs text-gray-500 text-center">Profile image</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</span>
            <div className="relative">
              <HiOutlineUser size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.name}
                onChange={event => onChange('name', event.target.value)}
                placeholder="Your name"
                className="input-field pl-10"
              />
            </div>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Mail ID</span>
            <div className="relative">
              <HiOutlineMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={event => onChange('email', event.target.value)}
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </div>
          </label>

          <label className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Mobile No</span>
            <div className="relative">
              <HiOutlinePhone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={event => onChange('phone', event.target.value)}
                placeholder="Mobile number"
                className="input-field pl-10"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary gap-2">
          <HiOutlineSave size={18} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function AvatarCropModal({ pendingAvatar, crop, saving, onCropChange, onImageLoad, onCancel, onApply }) {
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!pendingAvatar) return undefined;

    const updateDisplaySize = () => {
      const image = imageRef.current;
      if (!image) return;

      setDisplaySize({
        width: image.clientWidth,
        height: image.clientHeight
      });
    };

    updateDisplaySize();
    window.addEventListener('resize', updateDisplaySize);

    return () => window.removeEventListener('resize', updateDisplaySize);
  }, [pendingAvatar]);

  if (!pendingAvatar) return null;

  const hasImageDimensions = pendingAvatar.naturalWidth > 0 && pendingAvatar.naturalHeight > 0;
  const scale = hasImageDimensions && displaySize.width
    ? displaySize.width / pendingAvatar.naturalWidth
    : 1;
  const safeCrop = clampAvatarCrop(crop, pendingAvatar.naturalWidth, pendingAvatar.naturalHeight);
  const cropBox = {
    left: safeCrop.x * scale,
    top: safeCrop.y * scale,
    size: safeCrop.size * scale
  };
  const canApply = hasImageDimensions && safeCrop.size > 0 && !saving;
  const cropBackground = {
    backgroundColor: '#f8fafc',
    backgroundImage: `
      linear-gradient(45deg, #d1d5db 25%, transparent 25%),
      linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d1d5db 75%),
      linear-gradient(-45deg, transparent 75%, #d1d5db 75%)
    `,
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundSize: '16px 16px'
  };

  const stopInteraction = (event) => {
    if (dragRef.current && event.currentTarget.hasPointerCapture?.(dragRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(dragRef.current.pointerId);
    }

    dragRef.current = null;
  };

  const startInteraction = (event, type) => {
    if (!hasImageDimensions || !scale) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    dragRef.current = {
      type,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      crop: safeCrop,
      scale
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const drag = dragRef.current;
    const deltaX = (event.clientX - drag.startX) / drag.scale;
    const deltaY = (event.clientY - drag.startY) / drag.scale;

    if (drag.type === 'move') {
      onCropChange({
        x: drag.crop.x + deltaX,
        y: drag.crop.y + deltaY
      });
      return;
    }

    const resizeAmountByType = {
      'resize-nw': Math.max(-deltaX, -deltaY),
      'resize-ne': Math.max(deltaX, -deltaY),
      'resize-se': Math.max(deltaX, deltaY),
      'resize-sw': Math.max(-deltaX, deltaY)
    };
    const amount = resizeAmountByType[drag.type] || 0;
    const nextCrop = { ...drag.crop, size: drag.crop.size + amount };

    if (drag.type === 'resize-nw') {
      nextCrop.x = drag.crop.x - amount;
      nextCrop.y = drag.crop.y - amount;
    }

    if (drag.type === 'resize-ne') {
      nextCrop.y = drag.crop.y - amount;
    }

    if (drag.type === 'resize-sw') {
      nextCrop.x = drag.crop.x - amount;
    }

    onCropChange(nextCrop);
  };

  const handleImageLoad = (event) => {
    const image = event.currentTarget;
    onImageLoad(image.naturalWidth, image.naturalHeight);
    window.requestAnimationFrame(() => {
      setDisplaySize({
        width: image.clientWidth,
        height: image.clientHeight
      });
    });
  };

  const handleKeyDown = (event) => {
    if (!hasImageDimensions) return;

    const moveStep = event.shiftKey ? 20 : 6;
    const resizeStep = event.shiftKey ? 24 : 8;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onCropChange({ x: safeCrop.x - moveStep });
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onCropChange({ x: safeCrop.x + moveStep });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      onCropChange({ y: safeCrop.y - moveStep });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onCropChange({ y: safeCrop.y + moveStep });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      onCropChange({ size: safeCrop.size + resizeStep });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      onCropChange({ size: safeCrop.size - resizeStep });
    }
  };

  const handleClasses = 'absolute h-4 w-4 rounded-full border-2 border-white bg-primary-600 shadow-md';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-primary-600 to-violet-600 px-5 py-4 text-white">
          <h2 id="avatar-crop-title" className="text-lg font-bold sm:text-xl">Perfect Your Profile</h2>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close crop profile image"
          >
            <HiOutlineX size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div
            className="overflow-auto rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            style={cropBackground}
          >
            <div className="relative mx-auto w-fit max-w-full">
              <img
                ref={imageRef}
                src={pendingAvatar.url}
                alt="Manual profile crop preview"
                draggable={false}
                onLoad={handleImageLoad}
                className="block max-h-[55vh] max-w-full select-none rounded-lg object-contain"
              />

              {hasImageDimensions && displaySize.width > 0 && (
                <div
                  role="application"
                  tabIndex={0}
                  aria-label="Move and resize square crop area"
                  className="absolute cursor-move touch-none border-2 border-primary-500 bg-primary-500/10 outline-none ring-1 ring-white/80 focus:ring-2 focus:ring-primary-600"
                  style={{
                    left: cropBox.left,
                    top: cropBox.top,
                    width: cropBox.size,
                    height: cropBox.size,
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.46)'
                  }}
                  onPointerDown={event => startInteraction(event, 'move')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={stopInteraction}
                  onPointerCancel={stopInteraction}
                  onKeyDown={handleKeyDown}
                >
                  <span className="pointer-events-none absolute left-1/3 top-0 h-full border-l border-white/50" />
                  <span className="pointer-events-none absolute left-2/3 top-0 h-full border-l border-white/50" />
                  <span className="pointer-events-none absolute left-0 top-1/3 w-full border-t border-white/50" />
                  <span className="pointer-events-none absolute left-0 top-2/3 w-full border-t border-white/50" />
                  <span
                    className={`${handleClasses} -left-2 -top-2 cursor-nwse-resize`}
                    onPointerDown={event => startInteraction(event, 'resize-nw')}
                  />
                  <span
                    className={`${handleClasses} -right-2 -top-2 cursor-nesw-resize`}
                    onPointerDown={event => startInteraction(event, 'resize-ne')}
                  />
                  <span
                    className={`${handleClasses} -bottom-2 -right-2 cursor-nwse-resize`}
                    onPointerDown={event => startInteraction(event, 'resize-se')}
                  />
                  <span
                    className={`${handleClasses} -bottom-2 -left-2 cursor-nesw-resize`}
                    onPointerDown={event => startInteraction(event, 'resize-sw')}
                  />
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Drag the square to reposition it, or drag a corner to resize the crop area.
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={onApply} disabled={!canApply} className="btn-primary">
              {saving ? 'Uploading...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm({ form, saving, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="card p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Change Password</h2>
        <p className="text-sm text-gray-500">Use a strong password with at least 6 characters.</p>
      </div>

      <div className="space-y-4">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Current Password</span>
          <input
            type="password"
            value={form.currentPassword}
            onChange={event => onChange('currentPassword', event.target.value)}
            placeholder="Enter current password"
            className="input-field"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">New Password</span>
          <input
            type="password"
            value={form.newPassword}
            onChange={event => onChange('newPassword', event.target.value)}
            placeholder="Enter new password"
            className="input-field"
          />
        </label>

        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm Password</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={event => onChange('confirmPassword', event.target.value)}
            placeholder="Confirm new password"
            className="input-field"
          />
        </label>
      </div>

      <button type="submit" disabled={saving} className="btn-primary mt-6 gap-2">
        <HiOutlineKey size={18} />
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}

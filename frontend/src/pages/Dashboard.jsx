import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
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
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [wishlistCount, setWishlistCount] = useState(wishlistIds?.length || 0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(getDefaultProfileForm(user));
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineUser },
    { id: 'orders', label: 'Orders', icon: HiOutlineShoppingBag },
    { id: 'addresses', label: 'Addresses', icon: HiOutlineLocationMarker },
    { id: 'password', label: 'Change Password', icon: HiOutlineKey }
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

    const previewUrl = URL.createObjectURL(file);
    setProfileForm(current => ({
      ...current,
      avatarFile: file,
      avatarPreview: previewUrl
    }));
  };

  const cancelProfileEdit = () => {
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

  return (
    <div className="container-custom py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="card p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
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
              {editingProfile ? (
                <ProfileEditForm
                  form={profileForm}
                  saving={profileSaving}
                  onChange={updateProfileForm}
                  onAvatarChange={handleProfileImageChange}
                  onCancel={cancelProfileEdit}
                  onSubmit={handleProfileSave}
                />
              ) : (
                <ProfileCard
                  user={user}
                  phone={profileForm.phone}
                  onEdit={() => setEditingProfile(true)}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map(stat => (
                  <div key={stat.label} className={`card p-4 ${stat.bg}`}>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
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

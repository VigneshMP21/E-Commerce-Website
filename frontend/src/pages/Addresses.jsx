import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSave,
  HiOutlineTrash,
  HiOutlineX
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/ui/Breadcrumb';

const initialAddressForm = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  isDefault: false
};

const toAddressForm = (address) => ({
  fullName: address.full_name || '',
  phone: address.phone || '',
  street: address.street || '',
  city: address.city || '',
  state: address.state || '',
  zipCode: address.zip_code || '',
  country: address.country || 'India',
  isDefault: Boolean(address.is_default)
});

const toAddressRow = (id, form) => ({
  id,
  full_name: form.fullName,
  phone: form.phone,
  street: form.street,
  city: form.city,
  state: form.state,
  zip_code: form.zipCode,
  country: form.country || 'India',
  is_default: form.isDefault
});

export default function Addresses() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(initialAddressForm);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editForm, setEditForm] = useState(initialAddressForm);
  const [saving, setSaving] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    api.get('/users/addresses')
      .then(res => setAddresses(res.data.data || []))
      .catch(() => toast.error('Unable to load addresses'))
      .finally(() => setLoading(false));
  }, [authLoading, navigate, user]);

  const updateForm = (setter, key, value) => {
    setter(current => ({ ...current, [key]: value }));
  };

  const validateForm = (form) => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zipCode.trim()) {
      toast.error('Please fill all required address fields');
      return false;
    }

    return true;
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    if (!validateForm(addForm)) return;

    setSaving(true);
    try {
      const res = await api.post('/users/addresses', addForm);
      const newAddress = toAddressRow(res.data.data.id, addForm);
      setAddresses(current => [
        ...current.map(address => addForm.isDefault ? { ...address, is_default: false } : address),
        newAddress
      ]);
      setAddForm(initialAddressForm);
      setAdding(false);
      toast.success('Address added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to add address');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (address) => {
    setEditingAddressId(address.id);
    setEditForm(toAddressForm(address));
  };

  const cancelEdit = () => {
    setEditingAddressId(null);
    setEditForm(initialAddressForm);
  };

  const handleUpdateAddress = async (addressId) => {
    if (!validateForm(editForm)) return;

    setSaving(true);
    try {
      await api.put(`/users/addresses/${addressId}`, editForm);
      const updatedAddress = toAddressRow(addressId, editForm);
      setAddresses(current => current.map(address => {
        if (address.id === addressId) return updatedAddress;
        return editForm.isDefault ? { ...address, is_default: false } : address;
      }));
      cancelEdit();
      toast.success('Address updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update address');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (address) => {
    const confirmed = window.confirm(`Delete address for "${address.full_name}"?`);
    if (!confirmed) return;

    setDeletingAddressId(address.id);
    try {
      await api.delete(`/users/addresses/${address.id}`);
      setAddresses(current => current.filter(item => item.id !== address.id));
      if (editingAddressId === address.id) cancelEdit();
      toast.success('Address deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete address');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const renderAddressFields = (form, setter) => (
    <div className="grid gap-3 md:grid-cols-2">
      <input className="input-field md:col-span-2" placeholder="Full Name" value={form.fullName} onChange={e => updateForm(setter, 'fullName', e.target.value)} />
      <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => updateForm(setter, 'phone', e.target.value)} />
      <input className="input-field" placeholder="ZIP Code" value={form.zipCode} onChange={e => updateForm(setter, 'zipCode', e.target.value)} />
      <input className="input-field md:col-span-2" placeholder="Street Address" value={form.street} onChange={e => updateForm(setter, 'street', e.target.value)} />
      <input className="input-field" placeholder="City" value={form.city} onChange={e => updateForm(setter, 'city', e.target.value)} />
      <input className="input-field" placeholder="State" value={form.state} onChange={e => updateForm(setter, 'state', e.target.value)} />
      <input className="input-field" placeholder="Country" value={form.country} onChange={e => updateForm(setter, 'country', e.target.value)} />
      <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
        <input type="checkbox" checked={form.isDefault} onChange={e => updateForm(setter, 'isDefault', e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
        Set as default address
      </label>
    </div>
  );

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Addresses' }]} />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Addresses</h1>
          <p className="mt-1 text-sm text-gray-500">Manage saved shipping addresses for checkout.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="btn-primary gap-2">
          <HiOutlinePlus size={18} />
          Add Address
        </button>
      </div>

      <div className="space-y-5">
        {adding && (
          <form onSubmit={handleAddAddress} className="card p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Add Address</h2>
              <button type="button" onClick={() => { setAdding(false); setAddForm(initialAddressForm); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cancel add address">
                <HiOutlineX size={18} />
              </button>
            </div>
            {renderAddressFields(addForm, setAddForm)}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary gap-2">
                <HiOutlineSave size={18} />
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => <div key={index} className="h-28 skeleton rounded-2xl" />)}
          </div>
        ) : addresses.length > 0 ? (
          addresses.map(address => {
            const isEditing = editingAddressId === address.id;

            return (
              <div key={address.id} className="card p-5 md:p-6">
                {isEditing ? (
                  <>
                    {renderAddressFields(editForm, setEditForm)}
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit} className="btn-secondary gap-2 !py-2">
                        <HiOutlineX size={16} />
                        Cancel
                      </button>
                      <button type="button" disabled={saving} onClick={() => handleUpdateAddress(address.id)} className="btn-primary gap-2 !py-2">
                        <HiOutlineSave size={16} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                        <HiOutlineLocationMarker size={24} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-gray-900 dark:text-white">{address.full_name}</h2>
                          {address.is_default && (
                            <span className="badge-primary gap-1 text-xs">
                              <HiOutlineCheckCircle size={14} />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{address.street}</p>
                        <p className="text-sm text-gray-500">{address.city}, {address.state} - {address.zip_code}</p>
                        <p className="text-sm text-gray-500">{address.country}</p>
                        <p className="mt-2 text-sm font-medium">{address.phone}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => startEdit(address)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:bg-primary-950/30" aria-label={`Edit address for ${address.full_name}`}>
                        <HiOutlinePencil size={18} />
                      </button>
                      <button type="button" disabled={deletingAddressId === address.id} onClick={() => handleDeleteAddress(address)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/30" aria-label={`Delete address for ${address.full_name}`}>
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <HiOutlineLocationMarker size={30} />
            </div>
            <h2 className="text-lg font-semibold">No addresses saved</h2>
            <p className="mt-1 text-sm text-gray-500">Add an address to speed up checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}

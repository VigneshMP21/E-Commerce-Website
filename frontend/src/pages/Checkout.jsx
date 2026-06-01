import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

const initialAddressForm = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India'
};

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [processing, setProcessing] = useState(false);
  const [newAddress, setNewAddress] = useState(initialAddressForm);
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login');
    if (user) {
      api.get('/users/addresses').then(res => {
        setAddresses(res.data.data);
        const defaultAddr = res.data.data.find(a => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }).catch(console.error);
    }
  }, [user]);

  const saveAddress = async () => {
    try {
      const res = await api.post('/users/addresses', newAddress);
      setAddresses(current => [
        ...current,
        {
          id: res.data.data.id,
          full_name: newAddress.fullName,
          phone: newAddress.phone,
          street: newAddress.street,
          city: newAddress.city,
          state: newAddress.state,
          zip_code: newAddress.zipCode,
          country: newAddress.country,
          is_default: false
        }
      ]);
      setSelectedAddress(res.data.data.id);
      setNewAddress(initialAddressForm);
      toast.success('Address saved');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a shipping address'); return; }
    setProcessing(true);
    try {
      const res = await api.post('/orders', {
        shippingAddressId: selectedAddress,
        paymentMethod,
        notes: ''
      });
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/orders/${res.data.data.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const total = subtotal + (subtotal > 100 ? 0 : 10) + subtotal * 0.08;

  return (
    <div className="container-custom py-6 md:py-8">
      <Breadcrumb items={[{ name: 'Checkout' }]} />

      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Shipping', 'Payment', 'Review'].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${i + 1 <= step ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i + 1 <= step ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>{i + 1}</div>
            <span className="text-sm font-medium hidden sm:block">{s}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${i + 1 < step ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-lg">Shipping Address</h3>
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="sr-only" />
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-sm text-gray-500">{addr.street}, {addr.city}, {addr.state} - {addr.zip_code}</p>
                      <p className="text-sm text-gray-500">{addr.phone}</p>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No addresses saved. Please add one below.</p>
              )}

              <details className="group">
                <summary className="text-sm text-primary-600 font-medium cursor-pointer">Add New Address</summary>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <input className="input-field col-span-2" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                  <input className="input-field" placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                  <input className="input-field" placeholder="ZIP Code" value={newAddress.zipCode} onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})} />
                  <input className="input-field col-span-2" placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
                  <input className="input-field" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                  <input className="input-field" placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                  <button onClick={saveAddress} className="btn-primary col-span-2">Save Address</button>
                </div>
              </details>

              <button onClick={() => setStep(2)} className="btn-primary w-full mt-4">Continue to Payment</button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-lg">Payment Method</h3>
              <div className="space-y-3">
                {[
                  { id: 'stripe', label: 'Credit/Debit Card', desc: 'Pay via Stripe' },
                  { id: 'razorpay', label: 'UPI / Net Banking', desc: 'Pay via Razorpay' },
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when delivered' }
                ].map(m => (
                  <label key={m.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="sr-only" />
                    <p className="font-medium">{m.label}</p>
                    <p className="text-sm text-gray-500">{m.desc}</p>
                  </label>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="btn-primary w-full mt-4">Review Order</button>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-lg">Review Your Order</h3>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <button onClick={handlePlaceOrder} disabled={processing} className="btn-primary w-full py-4 text-base">
                {processing ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="card p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{subtotal > 100 ? 'Free' : formatPrice(10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatPrice(subtotal * 0.08)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <HiOutlineLockClosed size={14} />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

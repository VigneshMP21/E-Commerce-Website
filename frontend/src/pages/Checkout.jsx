import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineLockClosed } from 'react-icons/hi';
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

const makePaymentImage = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const paymentMethods = [
  {
    id: 'stripe',
    label: 'Credit/Debit Card',
    desc: 'Pay via Stripe',
    imageAlt: 'Credit card payment',
    image: makePaymentImage(`
      <svg width="96" height="64" viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="64" rx="18" fill="#EEF2FF"/>
        <rect x="16" y="16" width="64" height="38" rx="8" fill="#635BFF"/>
        <rect x="22" y="24" width="20" height="5" rx="2.5" fill="#A5B4FC"/>
        <rect x="22" y="41" width="16" height="3" rx="1.5" fill="white" opacity="0.85"/>
        <rect x="42" y="41" width="12" height="3" rx="1.5" fill="white" opacity="0.55"/>
        <circle cx="63" cy="42" r="7" fill="#F59E0B" opacity="0.9"/>
        <circle cx="70" cy="42" r="7" fill="#EF4444" opacity="0.85"/>
        <text x="48" y="34" text-anchor="middle" fill="white" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="800">STRIPE</text>
      </svg>
    `)
  },
  {
    id: 'razorpay',
    label: 'UPI / Net Banking',
    desc: 'Pay via Razorpay',
    imageAlt: 'UPI and net banking payment',
    image: makePaymentImage(`
      <svg width="96" height="64" viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="64" rx="18" fill="#ECFEFF"/>
        <rect x="14" y="16" width="68" height="38" rx="10" fill="#0EA5E9"/>
        <path d="M29 24L23 40H31L27 50L43 31H35L39 24H29Z" fill="#BBF7D0"/>
        <text x="57" y="34" fill="white" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="900">UPI</text>
        <text x="57" y="45" fill="#DFF7FF" font-family="Inter, Arial, sans-serif" font-size="7" font-weight="700">Razorpay</text>
        <rect x="57" y="19" width="16" height="4" rx="2" fill="white" opacity="0.55"/>
      </svg>
    `)
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when delivered',
    imageAlt: 'Cash on delivery payment',
    image: makePaymentImage(`
      <svg width="96" height="64" viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="96" height="64" rx="18" fill="#F0FDF4"/>
        <rect x="18" y="25" width="36" height="25" rx="6" fill="#22C55E"/>
        <circle cx="36" cy="38" r="7" fill="#DCFCE7"/>
        <text x="36" y="41" text-anchor="middle" fill="#16A34A" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="900">$</text>
        <path d="M56 23H71L80 32V48H56V23Z" fill="#0F172A"/>
        <path d="M71 23V32H80" fill="#94A3B8"/>
        <rect x="61" y="51" width="8" height="8" rx="4" fill="#64748B"/>
        <rect x="73" y="51" width="8" height="8" rx="4" fill="#64748B"/>
        <text x="36" y="19" text-anchor="middle" fill="#16A34A" font-family="Inter, Arial, sans-serif" font-size="8" font-weight="800">COD</text>
      </svg>
    `)
  }
];

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
                {paymentMethods.map(m => (
                  <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="sr-only" />
                    <img
                      src={m.image}
                      alt={m.imageAlt}
                      className="h-12 w-16 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-gray-100 dark:ring-gray-800"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{m.label}</span>
                      <span className="block text-sm text-gray-500">{m.desc}</span>
                    </span>
                    {paymentMethod === m.id && (
                      <HiOutlineCheckCircle size={22} className="shrink-0 text-primary-600" />
                    )}
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

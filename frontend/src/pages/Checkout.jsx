import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlineShoppingBag } from 'react-icons/hi';
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

const confettiColors = ['#4f46e5', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];
const confettiCorners = [
  { name: 'top-left', x: 1, y: 1 },
  { name: 'top-right', x: -1, y: 1 },
  { name: 'bottom-left', x: 1, y: -1 },
  { name: 'bottom-right', x: -1, y: -1 }
];

const orderSuccessConfetti = confettiCorners.flatMap((corner, cornerIndex) => (
  Array.from({ length: 60 }, (_, index) => {
    const spreadX = 14 + Math.random() * 82;
    const spreadY = 12 + Math.random() * 82;
    const size = 3 + Math.random() * 5;

    return {
      id: `${corner.name}-${index}`,
      corner: corner.name,
      style: {
        '--tx': `${corner.x * spreadX}vw`,
        '--ty': `${corner.y * spreadY}vh`,
        '--r': `${corner.x * corner.y * (180 + Math.random() * 900)}deg`,
        '--d': `${1.25 + Math.random() * 0.8}s`,
        '--delay': `${cornerIndex * 0.04 + Math.random() * 0.18}s`,
        '--w': `${size}px`,
        '--h': `${size * (0.7 + Math.random() * 1.4)}px`,
        '--bg': confettiColors[(cornerIndex * 60 + index) % confettiColors.length]
      }
    };
  })
));

const playOrderSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audio = new AudioContext();
    const now = audio.currentTime;
    const master = audio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.28, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    master.connect(audio.destination);

    const pop = audio.createOscillator();
    const popGain = audio.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(520, now);
    pop.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
    popGain.gain.setValueAtTime(0.0001, now);
    popGain.gain.exponentialRampToValueAtTime(0.2, now + 0.015);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    pop.connect(popGain).connect(master);
    pop.start(now);
    pop.stop(now + 0.2);

    const thump = audio.createOscillator();
    const thumpGain = audio.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(140, now);
    thump.frequency.exponentialRampToValueAtTime(55, now + 0.16);
    thumpGain.gain.setValueAtTime(0.0001, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    thump.connect(thumpGain).connect(master);
    thump.start(now);
    thump.stop(now + 0.24);

    const noiseBuffer = audio.createBuffer(1, audio.sampleRate * 0.28, audio.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i += 1) {
      noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
    }

    const noise = audio.createBufferSource();
    const noiseFilter = audio.createBiquadFilter();
    const noiseGain = audio.createGain();
    noise.buffer = noiseBuffer;
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start(now + 0.02);
    noise.stop(now + 0.34);

    window.setTimeout(() => audio.close?.(), 900);
  } catch {
    // Audio is a progressive enhancement and may be blocked by browser policy.
  }
};

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [newAddress, setNewAddress] = useState(initialAddressForm);
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const successNavigationRef = useRef(null);

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

  useEffect(() => () => {
    if (successNavigationRef.current) {
      window.clearTimeout(successNavigationRef.current);
    }
  }, []);

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
    const firstItem = items[0];
    const orderPreview = {
      image: firstItem?.image || '',
      name: firstItem
        ? `${firstItem.name}${items.length > 1 ? ` + ${items.length - 1} more` : ''}`
        : 'Your order'
    };

    try {
      const res = await api.post('/orders', {
        shippingAddressId: selectedAddress,
        paymentMethod,
        notes: ''
      });
      const orderNumber = res.data.data.orderNumber;
      setOrderSuccess({ ...orderPreview, orderNumber });
      playOrderSuccessSound();
      clearCart();
      successNavigationRef.current = window.setTimeout(() => {
        navigate(`/orders/${orderNumber}`);
      }, 4200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const total = subtotal + (subtotal > 100 ? 0 : 10) + subtotal * 0.08;

  return (
    <>
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

      <div className="checkout-layout grid lg:grid-cols-3 gap-8">
        <div className="checkout-main lg:col-span-2 space-y-6">
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
            <div className="checkout-review-card card p-6 space-y-4">
              <h3 className="font-semibold text-lg">Review Your Order</h3>
              <div className="checkout-review-items space-y-3">
                {items.map(item => (
                  <div key={item.id} className="checkout-review-item flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <img src={item.image} alt={item.name} className="checkout-review-image w-14 h-14 rounded-lg object-cover" />
                    <div className="checkout-review-info flex-1 min-w-0">
                      <p className="checkout-review-name text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="checkout-review-price font-medium text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <button onClick={handlePlaceOrder} disabled={processing} className="checkout-place-order-button btn-primary w-full py-4 text-base">
                {processing ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
              </button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card card p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            <div className="checkout-summary-lines space-y-3 text-sm">
              <div className="checkout-summary-line flex justify-between">
                <span className="text-gray-500">Subtotal ({items.length} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="checkout-summary-line flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{subtotal > 100 ? 'Free' : formatPrice(10)}</span>
              </div>
              <div className="checkout-summary-line flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>{formatPrice(subtotal * 0.08)}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="checkout-summary-line flex justify-between text-lg font-bold">
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
    {orderSuccess && <OrderSuccessOverlay order={orderSuccess} />}
    </>
  );
}

function OrderSuccessOverlay({ order }) {
  return (
    <div className="order-success-overlay" role="status" aria-live="polite">
      <div className="order-success-confetti" aria-hidden="true">
        {orderSuccessConfetti.map(piece => (
          <span
            key={piece.id}
            className={`order-success-confetti-piece order-success-confetti-${piece.corner}`}
            style={piece.style}
          />
        ))}
      </div>

      <div className="order-success-card">
        <div className="order-success-image-ring">
          {order.image ? (
            <img src={order.image} alt={order.name} className="order-success-image" />
          ) : (
            <HiOutlineShoppingBag size={46} className="text-primary-600" />
          )}
        </div>
        <p className="order-success-product-name">{order.name}</p>
        <h2>Order Placed Successfully</h2>
        <p className="order-success-order-number">Redirecting to order {order.orderNumber}</p>
      </div>
    </div>
  );
}

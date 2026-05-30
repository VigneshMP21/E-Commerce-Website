import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getRememberedEmail } from '../utils/authStorage';
import logo from '../assets/images/logo.png';

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || getRememberedEmail());
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail });
      toast.success(res.data?.message || 'Reset link sent');
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <img src={logo} alt="V Shop logo" className="w-12 h-12 rounded-xl object-cover mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Forgot password</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm text-gray-700 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-gray-200">
              If an account exists for this email, a reset link has been sent. Please check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <HiOutlineMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Sending reset link...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

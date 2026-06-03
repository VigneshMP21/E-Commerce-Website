import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';
import { getRememberedEmail } from '../utils/authStorage';
import logo from '../assets/images/logo.png';

const stepContent = {
  email: {
    title: 'Forgot password',
    subtitle: 'Enter your registered email to receive an OTP'
  },
  otp: {
    title: 'Verify OTP',
    subtitle: 'Enter the 6 digit OTP sent to your email'
  },
  reset: {
    title: 'Reset password',
    subtitle: 'Create a new password for your account'
  },
  success: {
    title: 'Password updated',
    subtitle: 'Your password was reset successfully'
  }
};

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || getRememberedEmail());
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('email');

  const currentContent = stepContent[step];

  const handleSendOtp = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail });
      setEmail(trimmedEmail);
      setOtp('');
      setResetToken('');
      setStep('otp');
      toast.success(res.data?.message || 'OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error('Please enter a valid 6 digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp: otp.trim() });
      setResetToken(res.data?.data?.resetToken || '');
      setPassword('');
      setConfirmPassword('');
      setStep('reset');
      toast.success(res.data?.message || 'OTP verified successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!resetToken) {
      toast.error('Please verify your OTP again');
      setStep('otp');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${resetToken}`, { password });
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetToken('');
      setStep('success');
      toast.success(res.data?.message || 'Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (event) => {
    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const restartWithEmail = () => {
    setOtp('');
    setResetToken('');
    setPassword('');
    setConfirmPassword('');
    setStep('email');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <img src={logo} alt="V Shop logo" className="w-40 h-24 rounded-xl object-cover mx-auto mb-3" />
            <h1 className="text-2xl font-bold">{currentContent.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{currentContent.subtitle}</p>
          </div>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <HiOutlineMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-gray-700 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-gray-200">
                OTP sent to <span className="font-medium">{email}</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">OTP</label>
                <div className="relative">
                  <HiOutlineShieldCheck size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter 6 digit OTP"
                    className="input-field pl-10 tracking-[0.35em]"
                    maxLength={6}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={restartWithEmail} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                  Change email
                </button>
                <button type="button" onClick={handleSendOtp} disabled={loading} className="text-primary-600 hover:underline">
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <div className="relative">
                  <HiOutlineLockClosed size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <HiOutlineLockClosed size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'Updating password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                <HiOutlineCheckCircle size={36} />
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                Password reset successfully. A confirmation email has been sent to your inbox.
              </div>
              <Link to="/login" className="btn-primary w-full py-3.5">
                Sign In
              </Link>
            </div>
          )}

          {step !== 'success' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

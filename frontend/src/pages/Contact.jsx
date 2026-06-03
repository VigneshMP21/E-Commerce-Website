import { useState } from 'react';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock, HiOutlinePaperAirplane } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api';

const CONTACT_EMAIL = 'mpvignesh2107@gmail.com';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await api.post('/contact', form);
      toast.success('Message sent successfully.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: HiOutlineMail, label: 'Email', value: CONTACT_EMAIL },
    { icon: HiOutlinePhone, label: 'Phone', value: '+91 9393211095' },
    { icon: HiOutlineLocationMarker, label: 'Address', value: 'Bazar Street, Chinthala Pattadai, Nagari - 517590, Chittoor, Andhra Pradesh' },
    { icon: HiOutlineClock, label: 'Hours', value: 'Mon-Sat, 9AM-6PM IST' }
  ];

  return (
    <div className="container-custom py-6 md:py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Get in Touch</h1>
        <p className="text-gray-500 max-w-md mx-auto">Have a question or feedback? We'd love to hear from you.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-4xl mx-auto">
        <div className="space-y-6">
          {contactInfo.map((info, i) => (
            <div key={i} className="flex items-start gap-4 p-4 card">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <info.icon size={22} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{info.label}</p>
                <p className="font-medium">{info.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Your Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input type="email" className="input-field" placeholder="Your Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <input className="input-field" placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
          <textarea className="input-field min-h-[120px]" placeholder="Your Message..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
          <button type="submit" className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70" disabled={sending}>
            <HiOutlinePaperAirplane size={18} className="mr-2" /> {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

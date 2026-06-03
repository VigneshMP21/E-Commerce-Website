import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const LOADING_TEXT = 'Loading .....';
const MIN_VISIBLE_MS = 850;

export default function GlobalLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), MIN_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white/35 backdrop-blur-md transition-opacity duration-300 dark:bg-gray-950/35 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-live="polite"
      aria-busy={visible}
    >
      <div className="flex flex-col items-center">
        <div className="global-loader-orbit" aria-hidden="true">
          <div className="global-loader-logo">
            <img src={logo} alt="" className="h-full w-full rounded-full object-cover" />
          </div>
        </div>
        <span className="sr-only">Loading</span>
        <p className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
          {LOADING_TEXT.split('').map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="loading-typing-char"
              style={{ '--loader-char-delay': `${index * 90}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

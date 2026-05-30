import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { clearAuthTokens, getStoredToken, setAuthTokens, setRememberedEmail } from '../utils/authStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.get('/auth/profile')
        .then(res => setUser(res.data.data))
        .catch(() => clearAuthTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, options = {}) => {
    const { rememberMe = true } = options;
    const res = await api.post('/auth/login', { email, password });
    setAuthTokens(res.data.data, rememberMe);
    setRememberedEmail(email, rememberMe);
    setUser(res.data.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    setAuthTokens(res.data.data, true);
    setUser(res.data.data.user);
    return res.data;
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  const googleLogin = async (data, options = {}) => {
    const { rememberMe = true } = options;
    const res = await api.post('/auth/google', data);
    setAuthTokens(res.data.data, rememberMe);
    setRememberedEmail(data.email, rememberMe);
    setUser(res.data.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

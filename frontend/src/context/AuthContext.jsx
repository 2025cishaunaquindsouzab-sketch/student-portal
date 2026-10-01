import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('shaun_token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('shaun_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('shaun_token', token);
    } else {
      localStorage.removeItem('shaun_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('shaun_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shaun_user');
    }
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/me');
        const profile = response.data.user || response.data;
        setUser((current) => ({
          ...(current || {}),
          ...profile,
        }));
      } catch (error) {
        setToken('');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = async (credentials) => {
    const response = await api.post('/login', credentials);
    const payload = response.data;
    setToken(payload.access_token);
    setUser(payload.user);
    return payload;
  };

  const register = async (payload) => {
    const response = await api.post('/register', payload);
    return response.data;
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      setUser,
      login,
      register,
      logout,
    }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

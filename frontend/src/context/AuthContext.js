import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('rt_user');
    const token = localStorage.getItem('rt_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await auth.login({ email, password });
    localStorage.setItem('rt_token', data.access_token);
    localStorage.setItem('rt_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const { data } = await auth.register(userData);
    localStorage.setItem('rt_token', data.access_token);
    localStorage.setItem('rt_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('rt_token');
    localStorage.removeItem('rt_user');
    setUser(null);
  };

  const isPro = user?.subscription_tier === 'professional' || user?.subscription_tier === 'institution';
  const isStudent = user?.subscription_tier === 'student' || isPro;
  const isFree = !user || user?.subscription_tier === 'free';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isPro, isStudent, isFree }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

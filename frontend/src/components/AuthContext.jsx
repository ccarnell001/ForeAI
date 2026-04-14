import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('foreai_token');
    if (token) {
      api.me()
        .then((data) => setUser(data.user))
        .catch(() => localStorage.removeItem('foreai_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('foreai_token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('foreai_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

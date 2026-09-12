import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from '../services/api';

export type Role = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type User = { id: number; name: string; email: string; role: Role };

type ContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<ContextValue>({
  user: null, login: async () => undefined, logout: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const nextUser = response.data.data.user as User;
    localStorage.setItem('accessToken', response.data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

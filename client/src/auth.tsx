import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, login: () => {}, logout: () => {}, isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('leave-token');
    const savedUser = localStorage.getItem('leave-user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('leave-token', newToken);
    localStorage.setItem('leave-user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('leave-token');
    localStorage.removeItem('leave-user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

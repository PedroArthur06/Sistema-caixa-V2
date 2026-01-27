import { createContext, useState, useEffect, type ReactNode, useContext } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@sistema-caixa:user');
    const storagedToken = localStorage.getItem('@sistema-caixa:token');

    if (storagedToken && storagedUser) {
      setUser(JSON.parse(storagedUser));
    }
    setLoading(false);
  }, []);

  async function signIn(email: string, pass: string) {
    const response = await api.post('/auth/login', {
      email,
      password: pass,
    });

    const { access_token, user } = response.data;

    localStorage.setItem('@sistema-caixa:user', JSON.stringify(user));
    localStorage.setItem('@sistema-caixa:token', access_token);

    setUser(user);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  }

  function signOut() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
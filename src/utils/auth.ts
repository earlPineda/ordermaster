import { createContext, useContext, ReactNode, useState } from 'react';
import { User, UserRole, CUSTOMER_CREDENTIALS, ADMIN_CREDENTIALS } from '../types';

// Auth context type
type AuthContextProps = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for persisted login state
    try {
      const stored = localStorage.getItem('avenue_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role };
      }
    } catch {
      // Ignore errors, return null
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('avenue_authenticated') === '1';
    } catch {
      return false;
    }
  });

  const [role, setRole] = useState<UserRole | null>(() => {
    try {
      const stored = localStorage.getItem('avenue_user');
      if (stored) {
        return JSON.parse(stored).role;
      }
    } catch {
      // Ignore errors
    }
    return null;
  });

  const login = (username: string, password: string): boolean => {
    // Check admin credentials
    if (
      username.trim() === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const user: User = {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@avenuecafe.com',
        role: 'admin',
      };
      setUser(user);
      setIsAuthenticated(true);
      setRole('admin');
      try {
        localStorage.setItem('avenue_user', JSON.stringify(user));
        localStorage.setItem('avenue_authenticated', '1');
      } catch {
        // Ignore
      }
      return true;
    }

    // Check customer credentials
    if (
      username.trim() === CUSTOMER_CREDENTIALS.username &&
      password === CUSTOMER_CREDENTIALS.password
    ) {
      const user: User = {
        id: 'customer-1',
        name: 'Customer',
        email: 'customer@avenuecafe.com',
        role: 'customer',
      };
      setUser(user);
      setIsAuthenticated(true);
      setRole('customer');
      try {
        localStorage.setItem('avenue_user', JSON.stringify(user));
        localStorage.setItem('avenue_authenticated', '1');
      } catch {
        // Ignore
      }
      return true;
    }

    // Invalid credentials
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole(null);
    try {
      localStorage.removeItem('avenue_user');
      localStorage.removeItem('avenue_authenticated');
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, role }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = (): AuthContextProps => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

// Export the AuthContext for direct use if needed
export { AuthContext };
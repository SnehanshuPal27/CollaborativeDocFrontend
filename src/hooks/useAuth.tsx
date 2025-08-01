import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import config from '@/config';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Define the structure of our JWT payload
interface JwtPayload {
  sub: string; // "subject", which is the user's email in our case
  iat: number; // "issued at"
  exp: number; // "expiration time"
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const payload = jwtDecode<JwtPayload>(token);
          // Check if token is expired
          if (payload.exp * 1000 > Date.now()) {
            setUser({ id: payload.sub, name: payload.sub, email: payload.sub });
          } else {
            // Token is expired, remove it
            localStorage.removeItem('jwt_token');
            console.log("removal")
          }
        } catch (e) {
          console.error("Invalid token found:", e);
          localStorage.removeItem('jwt_token');
          console.log("removal")
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${config.documentServiceUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('Token not found in login response.');
    }

    localStorage.setItem('jwt_token', token);

    // USE THE LIBRARY INSTEAD OF THE CUSTOM FUNCTION
    const payload = jwtDecode<JwtPayload>(token);
    setUser({ id: payload.sub, name: payload.sub, email: payload.sub });
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await fetch(`${config.documentServiceUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed. The email might already be in use.');
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('jwt_token');
    console.log("removal")
  };

  return (
      <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
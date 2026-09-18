import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, LoginDto, RegisterDto } from '@mychecklist/shared';
import { AuthAPI, getStoredToken, setStoredToken, removeStoredToken, setOnUnauthorizedCallback } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await AuthAPI.getMe();
      setUser(userData);
    } catch (err) {
      console.warn('Failed to verify existing session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      logout();
    });
    refreshUser();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await AuthAPI.login(dto);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (dto: RegisterDto) => {
    const res = await AuthAPI.register(dto);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

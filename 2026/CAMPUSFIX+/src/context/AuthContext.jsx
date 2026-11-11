import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap session from non-sensitive sessionStorage marker on mount
  useEffect(() => {
    let isMounted = true;
    async function bootstrap() {
      try {
        const currentUser = await authService.getMe();
        if (isMounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Session bootstrap error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in with credentials.
   * @param {object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  async function login(credentials) {
    const authenticatedUser = await authService.login(credentials);
    setUser(authenticatedUser);
    return authenticatedUser;
  }

  /**
   * Register a new student account.
   * @param {object} payload
   */
  async function register(payload) {
    const newStudent = await authService.register(payload);
    setUser(newStudent);
    return newStudent;
  }

  /**
   * Terminate active user session.
   */
  async function logout() {
    await authService.logout();
    setUser(null);
  }

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

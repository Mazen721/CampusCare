import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authApi,
  clearStoredToken,
  getStoredToken,
  storeToken,
  UNAUTHORIZED_EVENT,
} from '@/lib/api';
import type {
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
  Role,
} from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isRestoring: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  demoLogin: (role: Role) => Promise<AuthUser>;
  logout: () => void;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(() => Boolean(getStoredToken()));

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsRestoring(false);
      return;
    }

    let active = true;

    authApi
      .me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) {
          clearStoredToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken();
      setUser(null);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    storeToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const demoLogin = useCallback(async (role: Role) => {
    const response = await authApi.demoLogin(role);
    storeToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    await authApi.changePassword(input);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      isAuthenticated: Boolean(user),
      login,
      demoLogin,
      logout,
      changePassword,
    }),
    [user, isRestoring, login, demoLogin, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}

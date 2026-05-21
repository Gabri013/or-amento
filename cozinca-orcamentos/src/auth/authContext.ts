import { createContext } from 'react';
import type { Usuario } from '../types';

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logoutUser: async () => {},
  isAdmin: false,
});
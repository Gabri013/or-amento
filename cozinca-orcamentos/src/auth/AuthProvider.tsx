import { useState, useEffect } from 'react';
import { UserCredential } from 'firebase/auth';
import { loginComEmail, logout, onAuthStateChangedWrapper } from '../firebase/auth';
import { buscarDocumento, COLECOES } from '../firebase/firestore';
import type { Usuario } from '../types';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedWrapper(async (firebaseUser) => {
      if (firebaseUser) {
        const usuarioDoc = await buscarDocumento<Usuario>(COLECOES.USUARIOS, firebaseUser.uid);
        if (usuarioDoc) {
          setUser({
            ...usuarioDoc,
            criadoEm: usuarioDoc.criadoEm instanceof Date ? usuarioDoc.criadoEm : new Date(),
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, senha: string) => {
    const cred: UserCredential = await loginComEmail(email, senha);
    const usuarioDoc = await buscarDocumento<Usuario>(COLECOES.USUARIOS, cred.user.uid);
    if (usuarioDoc) {
      setUser({
        ...usuarioDoc,
        criadoEm: usuarioDoc.criadoEm instanceof Date ? usuarioDoc.criadoEm : new Date(),
      });
    }
  };

  const logoutUser = async () => {
    await logout();
    setUser(null);
  };

  const isAdmin = user?.tipo === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logoutUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
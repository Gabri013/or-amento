import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';

export async function loginComEmail(email: string, senha: string) {
  return signInWithEmailAndPassword(auth, email, senha);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthStateChangedWrapper(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

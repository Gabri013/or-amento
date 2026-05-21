import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, QueryConstraint, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const COLECOES = {
  USUARIOS: 'usuarios',
  ORCAMENTOS: 'orcamentos',
  CLIENTES: 'clientes',
  PRODUTOS: 'produtos',
  VENDAS: 'vendas',
} as const;

export async function buscarColecao<T>(
  colecao: string,
  filtros?: QueryConstraint[]
): Promise<T[]> {
  const ref = collection(db, colecao);
  const q = filtros && filtros.length > 0 ? query(ref, ...filtros) : ref;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

export async function buscarDocumento<T>(
  colecao: string,
  id: string
): Promise<T | null> {
  const docRef = doc(db, colecao, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { ...(snapshot.data() as T), id: snapshot.id };
}

export async function salvarDocumento<T>(
  colecao: string,
  dados: Omit<T, 'id'>
): Promise<string> {
  const ref = collection(db, colecao);
  const docRef = await addDoc(ref, {
    ...dados,
    criadoEm: serverTimestamp(),
  });
  return docRef.id;
}

export async function atualizarDocumento(
  colecao: string,
  id: string,
  dados: Record<string, unknown>
): Promise<void> {
  const docRef = doc(db, colecao, id);
  await updateDoc(docRef, {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}

export async function excluirDocumento(
  colecao: string,
  id: string
): Promise<void> {
  const docRef = doc(db, colecao, id);
  await deleteDoc(docRef);
}

export async function buscarComFiltro<T>(
  colecao: string,
  campo: string,
  valor: unknown
): Promise<T[]> {
  const ref = collection(db, colecao);
  const q = query(ref, where(campo, '==', valor));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

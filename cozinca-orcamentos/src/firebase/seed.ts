import { getFirestore } from 'firebase/firestore';
import { app } from './config';

const db = getFirestore(app);

const PRODUTOS_INICIAIS = [
  { nome: 'Bancada Inox 1,00m', sku: 'BNI-100', precoBase: 850, unidade: 'un', ativo: true },
  { nome: 'Pia Inox Dupla', sku: 'PID-001', precoBase: 1200, unidade: 'un', ativo: true },
  { nome: 'Prateleira Inox', sku: 'PRI-050', precoBase: 320, unidade: 'un', ativo: true },
];

const CLIENTE_INICIAL = {
  nome: 'Restaurante Exemplo LTDA',
  documento: '00.000.000/0001-00',
  telefone: '(31) 99999-9999',
  email: 'contato@exemplo.com.br',
  endereco: 'Rua Exemplo, 100, BH/MG',
};

const COLECOES = {
  USUARIOS: 'usuarios',
  PRODUTOS: 'produtos',
  CLIENTES: 'clientes',
} as const;

export type SeedOrcamento = Record<string, unknown>;

export async function seedBancoDeDados(): Promise<void> {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('cozinca_seed_done') === 'true') {
    return;
  }

  const { collection, getDocs, query, limit, addDoc, serverTimestamp } = await import('firebase/firestore');

  const usuariosSnap = await getDocs(query(collection(db, COLECOES.USUARIOS), limit(1)));
  if (!usuariosSnap.empty) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('cozinca_seed_done', 'true');
    return;
  }

  for (const produto of PRODUTOS_INICIAIS) {
    await addDoc(collection(db, COLECOES.PRODUTOS), {
      ...produto,
      criadoEm: serverTimestamp(),
    });
  }
  await addDoc(collection(db, COLECOES.CLIENTES), {
    ...CLIENTE_INICIAL,
    criadoEm: serverTimestamp(),
  });

  if (typeof localStorage !== 'undefined') localStorage.setItem('cozinca_seed_done', 'true');
  console.log('Seed concluído.');
}

# Firebase Setup — Cozinca Inox (sistema-de-40dda)

O projeto usa o Firebase já criado: **sistema-de-40dda**.
Basta concluir os passos abaixo para colocar o sistema em funcionamento.

---

## 1. Autenticação por Email/Senha

1. Acesse https://console.firebase.google.com/project/sistema-de-40dda/authentication
2. Clique **Começar**
3. Aba **Sign-in method** → **Email/senha**
4. Ative o toggle → **Salvar**

---

## 2. Publicar as Regras do Firestore

No terminal, com o Firebase CLI instalado (`npm install -g firebase-tools`):

```bash
cd cozinca-orcamentos
firebase login
firebase use sistema-de-40dda
firebase deploy --only firestore:rules
```

Isso aplica o arquivo `firestore.rules` no banco de dados.

---

## 3. Criar o Primeiro Usuário Admin

1. Na console do Firebase → Authentication → Usuários → **Adicionar usuário**
2. Email: `admin@cozinca.com.br`
3. Senha: (escolha uma senha segura)
4. Clique **Adicionar usuário**
5. Anote o **UID** retornado

Depois, vá até Cloud Firestore → `usuarios` e crie um documento com esses campos:

```json
{
  "uid": "<UID_ANOTADO>",
  "nome": "Administrador",
  "email": "admin@cozinca.com.br",
  "tipo": "admin",
  "ativo": true,
  "criadoEm": <timestamp atual>
}
```

---

## 4. Deploy da Cloud Function (opcional — para criar usuários pela interface)

```bash
cd cozinca-orcamentos/functions
npm install
cd ..
firebase deploy --only functions:criarUsuario
```

---

## 5. Rodar em Desenvolvimento

```bash
npm install
npm run dev
```

Acesse http://localhost:5173/login e use o email/senha do admin criado no passo 3.

---

## 6. Seed de Dados Iniciais

Os dados de exemplo (3 produtos + 1 cliente) são inseridos automaticamente na
primeira abertura do app, ou você pode chamar manualmente no console do navegador:

```js
import { seedBancoDeDados } from './firebase/seed';
seedBancoDeDados();
```

---

## Estrutura do Projeto

| Pasta/Arquivo | Descrição |
|---|---|
| `src/auth/` | AuthProvider, PrivateRoute, AdminRoute |
| `src/firebase/` | Config Firebase, funções CRUD, seed |
| `src/pages/` | 9 páginas (Login, Dashboard, Criar/Editar/Listar Orçamentos, Vendas, Cadastro, Relatórios, Admin) |
| `src/components/` | Layout, FormularioOrcamento, OrcamentoPDF |
| `firestore.rules` | Regras de segurança do Firestore |
| `firestore.indexes.json` | Índices compostos do banco |
| `functions/` | Cloud Function `criarUsuario` |
| `dist/` | Build de produção |

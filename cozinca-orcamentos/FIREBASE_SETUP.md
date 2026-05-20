# Firebase Setup — Cozinca Inox

Este documento descreve o passo a passo para configurar o Firebase e colocar o sistema em funcionamento.

---

## 1. Criar o Projeto no Firebase Console

1. Acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Clique **Adicionar projeto**
3. Nome: `cozinca-orcamentos` (ou outro de sua escolha)
4. Desative **Google Analytics** (não é necessário)
5. Clique **Criar projeto**

---

## 2. Ativar Authentication (Email/Senha)

1. No menu lateral do console, clique **Authentication**
2. Clique **Começar**
3. Na aba **Sign-in method**, clique **Email/senha**
4. Ative o toggle
5. Salve

---

## 3. Ativar Firestore Database

1. No menu lateral, clique **Cloud Firestore**
2. Clique **Criar banco de dados**
3. Escolha o modo **Produção** (não Modo de Teste)
4. Escolha a localização mais próxima de você (ex: `southamerica-east1`)
5. Clique **Ativar**

---

## 4. Ativar Cloud Storage

1. No menu lateral, clique **Storage**
2. Clique **Começar**
3. Localização: mesma escolhida no Firestore
4. Clique **Pronto**

---

## 5. Configurar Cloud Functions (criar usuario)

1. Instale o Firebase CLI se ainda não tiver:
   ```bash
   npm install -g firebase-tools
   ```

2. Na raiz do projeto, inicialize o functions:
   ```bash
   firebase init functions
   ```

3. Escolha:
   - Usar o projeto existente `cozinca-orcamentos`
   - Linguagem: **TypeScript**

4. Instale dependências:
   ```bash
   cd functions
   npm install firebase-admin
   ```

5. Edite `functions/src/index.ts` e adicione a função `criarUsuario` (ver `functions/src/index.ts` no projeto)

6. Implante:
   ```bash
   firebase deploy --only functions:criarUsuario
   ```

---

## 6. Copiar Chaves para o .env

1. No console Firebase, vá em **Configurações do Projeto** (⚙️ no topo direito)
2. Role até **Seus aplicativos**
3. Selecione o app da web (icon `</>`)
4. Copie o objeto `firebaseConfig` exibido
5. Cole em `.env` substituindo os placeholders:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cozinca-orcamentos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cozinca-orcamentos
VITE_FIREBASE_STORAGE_BUCKET=cozinca-orcamentos.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:123:web:...
```

---

## 7. Criar Usuário Admin Manualmente

1. Vá em **Authentication → Usuários**
2. Clique **Adicionar usuário**
3. Email: `admin@cozinca.com.br`
4. Senha: `cozinca@2025` (ou outra de sua escolha)
5. Clique **Adicionar usuário**
6. Anote o **UID** que aparecer — será usado no seed

---

## 8. Fazer o Primeiro Deploy

```bash
npm install   # instala todas as dependências
npm run dev   # roda em modo de desenvolvimento em http://localhost:5173
```

---

## 9. Publicar dados iniciais (seed)

O seed roda automaticamente na primeira vez que o app abre.
Se precisar rodar manualmente, chame `seedBancoDeDados()` do console do navegador.

---

## Observações

- Os arquivos PHP originais (`*.php`, `db.php`, `logout.php`) não são mais usados.
- A pasta `uploads/` original não existe mais — imagens vão para o Firebase Storage.
- O deploy para produção é feito com:
  ```bash
  firebase init hosting
  firebase deploy
  ```

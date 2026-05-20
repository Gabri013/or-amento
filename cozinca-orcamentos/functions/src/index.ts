import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const criarUsuario = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Não autenticado');
  }
  const callerDoc = await admin.firestore().collection('usuarios').doc(uid).get();
  if (callerDoc.data()?.tipo !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Apenas admins podem criar usuários');
  }

  const { email, senha, nome, tipo } = data;

  const userRecord = await admin.auth().createUser({ email, password: senha });
  await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
    uid: userRecord.uid,
    nome,
    email,
    tipo: tipo || 'usuario',
    ativo: true,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid };
});

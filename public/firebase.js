import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPXKSYIDVjwm-xg92pf9aRPmqTh85Jpnk",
  authDomain: "gotavertice-gj.firebaseapp.com",
  projectId: "gotavertice-gj",
  storageBucket: "gotavertice-gj.firebasestorage.app",
  messagingSenderId: "1048167905316",
  appId: "1:1048167905316:web:88731d1ba7c8975b3100b1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfile(user) {
  const reference = doc(db, "users", user.uid);
  const snapshot = await getDoc(reference);
  const data = snapshot.exists() ? snapshot.data() : {};
  const profile = {
    email: user.email || "",
    displayName: user.displayName || "",
  };
  if (!snapshot.exists()) {
    profile.residence = { name: "Minha residência", residents: 1 };
    profile.createdAt = serverTimestamp();
  } else if (!snapshot.data().residence) {
    profile.residence = { name: "Minha residência", residents: 1 };
  }
  await setDoc(reference, profile, { merge: true });
  await migrateLegacyResidence(user, { ...data, ...profile });
}

export async function registerAccount(email, password) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function loginAccount(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export function recoverPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function hasPasswordProvider(user) {
  return user.providerData.some(({ providerId }) => providerId === "password");
}

export function reauthenticateAccount(user, password = "") {
  if (hasPasswordProvider(user)) {
    const credential = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, credential);
  }
  return reauthenticateWithPopup(user, new GoogleAuthProvider());
}

export async function updateUserProfile(user, displayName) {
  await updateProfile(user, { displayName });
  await setDoc(userRef(user), { displayName }, { merge: true });
  return user;
}

export async function loginWithGoogle() {
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function logoutAccount() {
  await signOut(auth);
}

function userRef(user) {
  return doc(db, "users", user.uid);
}

function residencesRef(user) {
  return collection(userRef(user), "residences");
}

function residenceRef(user, residenceId) {
  return doc(residencesRef(user), residenceId);
}

function readingsRef(user, residenceId) {
  return collection(residenceRef(user, residenceId), "readings");
}

async function migrateLegacyResidence(user, profileData) {
  const residencesSnapshot = await getDocs(residencesRef(user));
  if (!residencesSnapshot.empty) {
    if (!profileData.activeResidenceId)
      await setDoc(userRef(user), {
        activeResidenceId: residencesSnapshot.docs[0].id,
      }, { merge: true });
    return;
  }

  const legacyReadings = await getDocs(
    query(collection(userRef(user), "readings"), orderBy("date")),
  );
  const batch = writeBatch(db);
  batch.set(
    residenceRef(user, "default"),
    {
      ...(profileData.residence || { name: "Minha residência", residents: 1 }),
      createdAt: profileData.createdAt || serverTimestamp(),
      migratedAt: serverTimestamp(),
    },
    { merge: true },
  );
  legacyReadings.docs.forEach((item) =>
    batch.set(doc(readingsRef(user, "default"), item.id), item.data(), {
      merge: true,
    }),
  );
  batch.set(userRef(user), { activeResidenceId: "default" }, { merge: true });
  await batch.commit();
}

export async function loadUserData(user, residenceId = "") {
  const [userSnapshot, residencesSnapshot] = await Promise.all([
    getDoc(userRef(user)),
    getDocs(residencesRef(user)),
  ]);
  const data = userSnapshot.exists() ? userSnapshot.data() : {};
  const residences = residencesSnapshot.docs.map((item) => ({
    id: item.id,
    name: item.data().name || "Minha residência",
    residents: Number(item.data().residents) || 1,
  }));
  const activeId = residenceId || data.activeResidenceId || residences[0]?.id || "default";
  const [activeResidence, readingsSnapshot] = await Promise.all([
    getDoc(residenceRef(user, activeId)),
    getDocs(query(readingsRef(user, activeId), orderBy("date"))),
  ]);
  const activeData = activeResidence.exists()
    ? activeResidence.data()
    : { name: "Minha residência", residents: 1 };
  return {
    residenceId: activeId,
    residences,
    residence: {
      name: activeData.name || "Minha residência",
      residents: Number(activeData.residents) || 1,
    },
    readings: readingsSnapshot.docs.map((item) => ({
      date: item.data().date,
      meter: Number(item.data().meter),
    })),
  };
}

export async function saveResidence(user, residenceId, residence) {
  await setDoc(
    residenceRef(user, residenceId),
    residence,
    { merge: true },
  );
  return loadUserData(user, residenceId);
}

export async function createResidence(user, residence) {
  const residenceId = crypto.randomUUID();
  await setDoc(residenceRef(user, residenceId), {
    ...residence,
    createdAt: serverTimestamp(),
  });
  await setDoc(userRef(user), { activeResidenceId: residenceId }, { merge: true });
  return loadUserData(user, residenceId);
}

export function switchResidence(user, residenceId) {
  return setDoc(userRef(user), { activeResidenceId: residenceId }, { merge: true })
    .then(() => loadUserData(user, residenceId));
}

export async function saveReading(user, residenceId, reading) {
  await setDoc(
    doc(readingsRef(user, residenceId), reading.date),
    {
      date: reading.date,
      meter: reading.meter,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return loadUserData(user, residenceId);
}

export async function clearUserData(user, residenceId) {
  const snapshot = await getDocs(readingsRef(user, residenceId));
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  batch.set(
    residenceRef(user, residenceId),
    { name: "Minha residência", residents: 1 },
    { merge: true },
  );
  await batch.commit();
  return loadUserData(user, residenceId);
}

export async function deleteAccount(user) {
  const residencesSnapshot = await getDocs(residencesRef(user));
  const batch = writeBatch(db);
  for (const residence of residencesSnapshot.docs) {
    const readingsSnapshot = await getDocs(
      collection(residence.ref, "readings"),
    );
    readingsSnapshot.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(residence.ref);
  }
  const legacyReadings = await getDocs(collection(userRef(user), "readings"));
  legacyReadings.docs.forEach((item) => batch.delete(item.ref));
  batch.delete(userRef(user));
  await batch.commit();
  await deleteUser(user);
}

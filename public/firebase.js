import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
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
  writeBatch
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPXKSYIDVjwm-xg92pf9aRPmqTh85Jpnk",
  authDomain: "gotavertice-gj.firebaseapp.com",
  projectId: "gotavertice-gj",
  storageBucket: "gotavertice-gj.firebasestorage.app",
  messagingSenderId: "1048167905316",
  appId: "1:1048167905316:web:88731d1ba7c8975b3100b1"
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
  const profile = {
    email: user.email || "",
    displayName: user.displayName || ""
  };
  if (!snapshot.exists()) {
    profile.residence = { name: "Minha residência", residents: 1 };
    profile.createdAt = serverTimestamp();
  } else if (!snapshot.data().residence) {
    profile.residence = { name: "Minha residência", residents: 1 };
  }
  await setDoc(reference, profile, { merge: true });
}

export async function registerAccount(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function loginAccount(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(credential.user);
  return credential.user;
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

function readingsRef(user) {
  return collection(userRef(user), "readings");
}

export async function loadUserData(user) {
  const [userSnapshot, readingsSnapshot] = await Promise.all([
    getDoc(userRef(user)),
    getDocs(query(readingsRef(user), orderBy("date")))
  ]);
  const data = userSnapshot.exists() ? userSnapshot.data() : {};
  return {
    residence: data.residence || { name: "Minha residência", residents: 1 },
    readings: readingsSnapshot.docs.map((item) => ({ date: item.data().date, meter: Number(item.data().meter) }))
  };
}

export async function saveResidence(user, residence) {
  await setDoc(userRef(user), { email: user.email, residence }, { merge: true });
  return loadUserData(user);
}

export async function saveReading(user, reading) {
  await setDoc(doc(readingsRef(user), reading.date), {
    date: reading.date,
    meter: reading.meter,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return loadUserData(user);
}

export async function clearUserData(user) {
  const snapshot = await getDocs(readingsRef(user));
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  batch.set(userRef(user), {
    email: user.email,
    residence: { name: "Minha residência", residents: 1 }
  }, { merge: true });
  await batch.commit();
  return loadUserData(user);
}

export async function deleteAccount(user) {
  const snapshot = await getDocs(readingsRef(user));
  const batch = writeBatch(db);
  snapshot.docs.forEach((item) => batch.delete(item.ref));
  batch.delete(userRef(user));
  await batch.commit();
  await deleteUser(user);
}

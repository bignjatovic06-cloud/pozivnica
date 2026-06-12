import { initializeApp, deleteApp } from "firebase/app";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  type User,
} from "firebase/auth";
import { auth, firebaseConfig } from "./firebase";

export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Vlasnik servisa kreira nalog za klijenta kroz sekundarnu Firebase app
// instancu — createUserWithEmailAndPassword na glavnoj instanci bi
// prijavio novi nalog i izbacio vlasnika iz njegove sesije
export async function createClientAccount(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `client-signup-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return result.user.uid;
  } catch (err: unknown) {
    // Nalog već postoji — ako se lozinka poklapa, ponovo iskoristi postojeći
    // (npr. ponovni pokušaj nakon greške pri kreiranju eventa)
    if ((err as { code?: string }).code === "auth/email-already-in-use") {
      const result = await signInWithEmailAndPassword(secondaryAuth, email, password);
      return result.user.uid;
    }
    throw err;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

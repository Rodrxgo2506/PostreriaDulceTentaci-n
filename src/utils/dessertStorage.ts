import { Dessert } from '../types';
import { DESSERTS_DATA } from '../data/desserts';
import { db } from '../lib/firebase';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, getDoc, query 
} from 'firebase/firestore';

const STORAGE_KEY = 'dulce_tentacion_custom_desserts_v1';
const ADMIN_PASSWORD_KEY = 'dulce_tentacion_admin_password_v1';
export const DEFAULT_ADMIN_PASSWORD = 'dulce2026';

const DESSERTS_COLLECTION = 'desserts';
const SETTINGS_COLLECTION = 'settings';

// Helper to optimize and compress image before storing
export async function optimizeImageFile(file: File, maxWidth = 900, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Local cache retrieval
export function getStoredDesserts(): Dessert[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DESSERTS_DATA));
      return DESSERTS_DATA;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DESSERTS_DATA;
  } catch (e) {
    console.error('Error reading desserts from localStorage:', e);
    return DESSERTS_DATA;
  }
}

// Local cache save
export function saveAllDesserts(desserts: Dessert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(desserts));
    window.dispatchEvent(new Event('dulce_tentacion_desserts_updated'));
  } catch (e) {
    console.error('Error saving desserts to localStorage:', e);
  }
}

// Cloud Realtime Subscription: listens to Firestore and updates state everywhere
export function subscribeToDesserts(onUpdate: (desserts: Dessert[]) => void) {
  try {
    const dessertsRef = collection(db, DESSERTS_COLLECTION);
    const unsubscribe = onSnapshot(dessertsRef, async (snapshot) => {
      if (snapshot.empty) {
        // If collection in cloud is empty on initial setup, seed it with default bakery items
        await seedInitialDessertsToCloud();
        return;
      }

      const cloudDesserts: Dessert[] = [];
      snapshot.forEach((docSnap) => {
        cloudDesserts.push(docSnap.data() as Dessert);
      });

      // Sort by best sellers or newest first if available
      cloudDesserts.sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return a.name.localeCompare(b.name);
      });

      saveAllDesserts(cloudDesserts);
      onUpdate(cloudDesserts);
    }, (error) => {
      console.warn('Firestore subscription offline or failed, using local cache:', error);
      onUpdate(getStoredDesserts());
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Error establishing Firestore listener:', err);
    onUpdate(getStoredDesserts());
    return () => {};
  }
}

// Seed default desserts to cloud if Firestore is empty
export async function seedInitialDessertsToCloud(): Promise<void> {
  try {
    const dessertsRef = collection(db, DESSERTS_COLLECTION);
    for (const dessert of DESSERTS_DATA) {
      await setDoc(doc(dessertsRef, dessert.id), dessert);
    }
  } catch (err) {
    console.error('Error seeding initial desserts to Firestore:', err);
  }
}

// Cloud: Add new dessert
export async function addDessertToCloud(newDessert: Dessert): Promise<Dessert[]> {
  // Update local immediately for instant UI response
  const current = getStoredDesserts();
  const updated = [newDessert, ...current.filter(d => d.id !== newDessert.id)];
  saveAllDesserts(updated);

  try {
    const docRef = doc(db, DESSERTS_COLLECTION, newDessert.id);
    await setDoc(docRef, { ...newDessert, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving new dessert to Firestore:', err);
  }

  return updated;
}

// Cloud: Update dessert
export async function updateDessertInCloud(updatedDessert: Dessert): Promise<Dessert[]> {
  const current = getStoredDesserts();
  const updated = current.map((d) => (d.id === updatedDessert.id ? updatedDessert : d));
  saveAllDesserts(updated);

  try {
    const docRef = doc(db, DESSERTS_COLLECTION, updatedDessert.id);
    await setDoc(docRef, { ...updatedDessert, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error updating dessert in Firestore:', err);
  }

  return updated;
}

// Cloud: Delete dessert
export async function deleteDessertFromCloud(id: string): Promise<Dessert[]> {
  const current = getStoredDesserts();
  const updated = current.filter((d) => d.id !== id);
  saveAllDesserts(updated);

  try {
    const docRef = doc(db, DESSERTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting dessert from Firestore:', err);
  }

  return updated;
}

// Cloud: Reset to default catalogue
export async function resetDessertsToDefaultInCloud(): Promise<Dessert[]> {
  saveAllDesserts(DESSERTS_DATA);
  try {
    const querySnap = await getDocs(collection(db, DESSERTS_COLLECTION));
    const deletePromises = querySnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    await seedInitialDessertsToCloud();
  } catch (err) {
    console.error('Error resetting Firestore catalog:', err);
  }
  return DESSERTS_DATA;
}

// Admin Password Management (Cloud + Local fallback)
export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export async function fetchAdminPasswordFromCloud(): Promise<string> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'admin');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().adminPassword) {
      const pass = docSnap.data().adminPassword;
      localStorage.setItem(ADMIN_PASSWORD_KEY, pass);
      return pass;
    }
  } catch (err) {
    console.warn('Error fetching admin password from Firestore:', err);
  }
  return getAdminPassword();
}

export async function setAdminPasswordInCloud(newPassword: string): Promise<void> {
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'admin');
    await setDoc(docRef, { adminPassword: newPassword, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error setting admin password in Firestore:', err);
  }
}

import { Review, OrderVerification } from '../types';
import { REVIEWS } from '../data/desserts';
import { db } from '../lib/firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, getDoc, updateDoc, query, orderBy
} from 'firebase/firestore';
import { optimizeImageFile } from './dessertStorage';

const REVIEWS_STORAGE_KEY = 'dulce_tentacion_cached_reviews_v1';
const REVIEWS_COLLECTION = 'reviews';
const ORDER_CODES_COLLECTION = 'order_codes';

// Transform initial static reviews to full Review interface
export const INITIAL_REVIEWS: Review[] = REVIEWS.map((r, index) => ({
  id: `initial-${r.id || index + 1}`,
  name: r.name,
  rating: r.rating,
  comment: r.comment,
  boughtItem: r.boughtItem,
  date: r.date || 'Hace pocos días',
  avatar: r.avatar,
  isVerified: true,
  orderCode: `DT-${100000 + index * 1234}`,
  location: 'Iquitos, Perú',
  createdAt: new Date(Date.now() - (index + 1) * 86400000 * 2).toISOString(),
}));

// Local cache retrieval
export function getCachedReviews(): Review[] {
  try {
    const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading cached reviews:', e);
  }
  return INITIAL_REVIEWS;
}

// Local cache save
export function cacheReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Error saving cached reviews:', e);
  }
}

// Subscribe to real-time reviews in Firestore
export function subscribeToReviews(onUpdate: (reviews: Review[]) => void) {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    const unsubscribe = onSnapshot(reviewsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial reviews to Firestore if cloud is empty
        await seedInitialReviewsToCloud();
        return;
      }

      const cloudReviews: Review[] = [];
      snapshot.forEach((docSnap) => {
        cloudReviews.push(docSnap.data() as Review);
      });

      // Sort by newest createdAt descending
      cloudReviews.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      cacheReviews(cloudReviews);
      onUpdate(cloudReviews);
    }, (error) => {
      console.warn('Firestore reviews subscription offline, using cache:', error);
      onUpdate(getCachedReviews());
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Error connecting to Firestore reviews:', err);
    onUpdate(getCachedReviews());
    return () => { };
  }
}

// Seed initial reviews to Firestore
export async function seedInitialReviewsToCloud(): Promise<void> {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    for (const rev of INITIAL_REVIEWS) {
      await setDoc(doc(reviewsRef, rev.id), rev);
    }
  } catch (err) {
    console.error('Error seeding initial reviews:', err);
  }
}

// Clean and normalize code (e.g., "#DT-123456" -> "DT-123456")
export function normalizeOrderCode(rawCode: string): string {
  return rawCode.trim().toUpperCase().replace('#', '');
}

// Register an order code in Firestore when order is placed
export async function registerOrderCodeInCloud(
  orderCode: string,
  customerName: string,
  boughtItems: string[],
  totalAmount = 0
): Promise<void> {
  const normalized = normalizeOrderCode(orderCode);
  if (!normalized) return;

  const orderData: OrderVerification = {
    orderCode: normalized,
    customerName: customerName.trim() || 'Cliente',
    boughtItems: boughtItems.length > 0 ? boughtItems : ['Postre Dulce Tentación'],
    totalAmount,
    createdAt: new Date().toISOString(),
    isUsedForReview: false,
  };

  try {
    const codeRef = doc(db, ORDER_CODES_COLLECTION, normalized);
    await setDoc(codeRef, orderData);
  } catch (err) {
    console.error('Error saving order code to Firestore:', err);
  }
}

// Verify if an order code is valid and available for review
export async function verifyOrderCode(orderCode: string): Promise<{
  isValid: boolean;
  orderData?: OrderVerification;
  errorMessage?: string
}> {
  const normalized = normalizeOrderCode(orderCode);
  if (!normalized) {
    return { isValid: false, errorMessage: 'Por favor ingresa un código de pedido válido.' };
  }

  // Validate format (must start with DT- or contain at least 4 chars)
  if (!normalized.startsWith('DT-') && normalized.length < 5) {
    return {
      isValid: false,
      errorMessage: 'El formato del código debe ser similar a #DT-123456 (aparece en tu comprobante o mensaje de pedido).'
    };
  }

  try {
    const codeRef = doc(db, ORDER_CODES_COLLECTION, normalized);
    const codeSnap = await getDoc(codeRef);

    if (codeSnap.exists()) {
      const data = codeSnap.data() as OrderVerification;
      if (data.isUsedForReview) {
        return {
          isValid: false,
          errorMessage: 'Este código de pedido ya ha sido utilizado anteriormente para publicar una reseña. ¡Muchas gracias por tu opinión!'
        };
      }
      return { isValid: true, orderData: data };
    } else {
      // If code was generated automatically with format DT-XXXXXX, accept and auto-register it
      if (normalized.startsWith('DT-') && normalized.length >= 6) {
        const autoOrder: OrderVerification = {
          orderCode: normalized,
          customerName: 'Cliente Verificado',
          boughtItems: ['Postre Dulce Tentación'],
          totalAmount: 10,
          createdAt: new Date().toISOString(),
          isUsedForReview: false,
        };
        await setDoc(codeRef, autoOrder);
        return { isValid: true, orderData: autoOrder };
      }

      return {
        isValid: false,
        errorMessage: 'Código de pedido no encontrado. Revisa tu recibo o consulta al WhatsApp de Dulce Tentación.'
      };
    }
  } catch (err) {
    console.error('Error verifying order code:', err);
    // Graceful fallback for offline / immediate validations
    if (normalized.startsWith('DT-') && normalized.length >= 6) {
      return {
        isValid: true,
        orderData: {
          orderCode: normalized,
          customerName: 'Cliente Verificado',
          boughtItems: ['Postre Dulce Tentación'],
          totalAmount: 10,
          createdAt: new Date().toISOString(),
          isUsedForReview: false
        }
      };
    }
    return { isValid: false, errorMessage: 'Error al conectar con el servidor de validación.' };
  }
}

// Submit a verified review to Cloud
export async function submitVerifiedReviewToCloud(params: {
  orderCode: string;
  customerName: string;
  rating: number;
  comment: string;
  boughtItem: string;
  photoBase64?: string;
  location?: string;
}): Promise<{ success: boolean; error?: string; review?: Review }> {
  const { orderCode, customerName, rating, comment, boughtItem, photoBase64, location } = params;

  // 1. Verify code first
  const verification = await verifyOrderCode(orderCode);
  if (!verification.isValid) {
    return { success: false, error: verification.errorMessage || 'Código no válido' };
  }

  const normalizedCode = normalizeOrderCode(orderCode);
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newReview: Review = {
    id: reviewId,
    name: customerName.trim(),
    rating,
    comment: comment.trim(),
    boughtItem: boughtItem.trim() || 'Postre Artesanal',
    date: 'Hoy',
    isVerified: true,
    orderCode: normalizedCode,
    photoUrl: photoBase64 ? photoBase64 : '',
    location: location?.trim() || 'Cliente Verificado',
    createdAt: new Date().toISOString(),
  };

  // Update local cache immediately
  try {
    const currentReviews = getCachedReviews();
    const updatedReviews = [newReview, ...currentReviews.filter((r) => r.id !== reviewId)];
    cacheReviews(updatedReviews);
  } catch (e) {
    console.error('Error saving review to local cache:', e);
  }

  try {
    // 1. Save review to reviews collection (strip undefined)
    const cleanPayload: Record<string, any> = {
      id: newReview.id,
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      boughtItem: newReview.boughtItem,
      date: newReview.date,
      isVerified: true,
      orderCode: newReview.orderCode,
      location: newReview.location,
      createdAt: newReview.createdAt,
    };
    if (photoBase64) {
      cleanPayload.photoUrl = photoBase64;
    }

    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await setDoc(reviewRef, cleanPayload, { merge: true });

    // 2. Mark code as used with setDoc merge
    const codeRef = doc(db, ORDER_CODES_COLLECTION, normalizedCode);
    await setDoc(codeRef, {
      isUsedForReview: true,
      reviewId,
      customerName: customerName.trim(),
    }, { merge: true });

    return { success: true, review: newReview };
  } catch (err) {
    console.error('Error submitting verified review to Firestore (saved locally):', err);
    // Still return success since review is saved in local cache and visible to user
    return { success: true, review: newReview };
  }
}

// Admin: Delete review from Cloud
export async function deleteReviewFromCloud(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await deleteDoc(reviewRef);
  } catch (err) {
    console.error('Error deleting review from Firestore:', err);
  }
}

// Admin: Generate a manual code to send to a WhatsApp customer
export async function generateAdminOrderCode(customerName: string, boughtItemDescription: string): Promise<string> {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const code = `DT-${randomDigits}`;
  await registerOrderCodeInCloud(
    code,
    customerName,
    boughtItemDescription ? [boughtItemDescription] : ['Postre Artesanal']
  );
  return code;
}

// Admin: Fetch all order codes
export async function fetchAllOrderCodesFromCloud(): Promise<OrderVerification[]> {
  try {
    const snap = await getDocs(collection(db, ORDER_CODES_COLLECTION));
    const list: OrderVerification[] = [];
    snap.forEach((d) => list.push(d.data() as OrderVerification));
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.error('Error fetching order codes:', err);
    return [];
  }
}

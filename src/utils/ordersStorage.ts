import { CustomerOrderRecord, OrderStatus } from '../types';
import { db } from '../lib/firebase';
import {
    collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, updateDoc
} from 'firebase/firestore';

const ORDERS_STORAGE_KEY = 'dulce_tentacion_cached_orders_v1';
const ORDERS_COLLECTION = 'orders';

// Clean object helper to ensure Firestore never receives undefined values
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
    const clean: Record<string, any> = {};
    Object.keys(obj).forEach((key) => {
        const val = obj[key];
        if (val !== undefined) {
            if (Array.isArray(val)) {
                clean[key] = val.map((item) => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item));
            } else if (typeof val === 'object' && val !== null) {
                clean[key] = sanitizeForFirestore(val);
            } else {
                clean[key] = val;
            }
        }
    });
    return clean;
}

// Local cache retrieval
export function getCachedOrders(): CustomerOrderRecord[] {
    try {
        const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error reading cached orders:', e);
    }
    return [];
}

// Local cache save
export function cacheOrders(orders: CustomerOrderRecord[]): void {
    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
        console.error('Error saving cached orders:', e);
    }
}

// Subscribe to real-time orders in Firestore
export function subscribeToOrders(onUpdate: (orders: CustomerOrderRecord[]) => void) {
    try {
        const ordersRef = collection(db, ORDERS_COLLECTION);
        const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
            const cloudOrders: CustomerOrderRecord[] = [];
            snapshot.forEach((docSnap) => {
                cloudOrders.push(docSnap.data() as CustomerOrderRecord);
            });

            // Sort by newest createdAt descending
            cloudOrders.sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                return timeB - timeA;
            });

            cacheOrders(cloudOrders);
            onUpdate(cloudOrders);
        }, (error) => {
            console.warn('Firestore orders subscription offline, using cache:', error);
            onUpdate(getCachedOrders());
        });

        return unsubscribe;
    } catch (err) {
        console.warn('Error connecting to Firestore orders:', err);
        onUpdate(getCachedOrders());
        return () => { };
    }
}

// Create new order in cloud and local cache
export async function createOrderInCloud(order: CustomerOrderRecord): Promise<boolean> {
    const cleanOrder = sanitizeForFirestore(order) as CustomerOrderRecord;

    // Always update local cache first
    const currentOrders = getCachedOrders();
    const updatedOrders = [cleanOrder, ...currentOrders.filter((o) => o.id !== cleanOrder.id)];
    cacheOrders(updatedOrders);

    try {
        const orderRef = doc(db, ORDERS_COLLECTION, cleanOrder.id);
        await setDoc(orderRef, cleanOrder, { merge: true });
        return true;
    } catch (err) {
        console.error('Error saving order to Firestore (saved locally):', err);
        return true; // Return true as it's safely in local cache
    }
}

// Update order status in cloud
export async function updateOrderStatusInCloud(orderId: string, status: OrderStatus): Promise<boolean> {
    const currentOrders = getCachedOrders();
    const updatedOrders = currentOrders.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    cacheOrders(updatedOrders);

    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: new Date().toISOString()
        });
        return true;
    } catch (err) {
        console.error('Error updating order status in Firestore:', err);
        // Fallback using setDoc with merge
        try {
            const orderRef = doc(db, ORDERS_COLLECTION, orderId);
            await setDoc(orderRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
            return true;
        } catch (e2) {
            console.error('Fallback setDoc error:', e2);
            return false;
        }
    }
}

// Delete order from cloud
export async function deleteOrderFromCloud(orderId: string): Promise<boolean> {
    const currentOrders = getCachedOrders();
    const filtered = currentOrders.filter((o) => o.id !== orderId);
    cacheOrders(filtered);

    try {
        const orderRef = doc(db, ORDERS_COLLECTION, orderId);
        await deleteDoc(orderRef);
        return true;
    } catch (err) {
        console.error('Error deleting order from Firestore:', err);
        return false;
    }
}

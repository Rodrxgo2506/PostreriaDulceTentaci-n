import { StoreConfig, HeroShowcaseCard } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const DEFAULT_HERO_CARDS: HeroShowcaseCard[] = [
    {
        id: 'hero-card-1',
        name: 'Torta de Tres Leches',
        description: 'Esponjoso bizcocho bañado en la clásica mezcla de tres leches con merengue suave y canela.',
        image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=800&q=85',
        rating: 5.0,
        portion: 'Porción Generosa',
        price: 10.00,
        originalPrice: 12.00,
        buttonText: 'Pedir Tres Leches',
        accentColor: 'rose',
    },
    {
        id: 'hero-card-2',
        name: 'Crema Volteada',
        description: 'Textura suavecita y aterciopelada horneada a baño maría con abundante caramelo dorado.',
        image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=85',
        rating: 4.9,
        portion: 'Porción Generosa',
        price: 10.00,
        originalPrice: 12.00,
        buttonText: 'Pedir Crema Volteada',
        accentColor: 'amber',
    },
    {
        id: 'hero-card-3',
        name: 'Cheesecake de Maracuyá',
        description: 'Cremoso queso crema sobre base crocante de galleta y coulis natural con semillas de maracuyá.',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=85',
        rating: 5.0,
        portion: 'Porción Generosa',
        price: 10.00,
        originalPrice: 12.00,
        buttonText: 'Pedir Cheesecake',
        accentColor: 'purple',
    },
];

export const DEFAULT_STORE_CONFIG: StoreConfig = {
    bakeryName: 'Dulce Tentación',
    bakerySlogan: 'Postres que enamoran',
    bakerySubtitle: '¡Hechos con amor, para endulzar tu día!',
    heroDescription: 'Postres que enamoran · Postres caseros preparados a diario con la más fina dedicación',
    topAnnouncement: '🛵 ¡DELIVERY GRATIS en pedidos a partir de 2 unidades! | Postres a S/ 10 c/u | WhatsApp: 965 255 201',
    phoneFormatted: '965 255 201',
    phoneNumber: '51965255201',
    address: 'Jirón Manco Cápac 653',
    reference: 'Por el Seguro de Salud',
    hours: 'Sábado a Domingo: 2:00 PM - 8:00 PM',
    deliveryPromoThreshold: 2,
    defaultDeliveryFee: 4.00,
    deliveryPromoText: 'A partir de 2 unidades',
    heroCards: DEFAULT_HERO_CARDS,
};

const STORAGE_KEY = 'dulce_tentacion_store_config_v1';
const SETTINGS_COLLECTION = 'settings';
const STORE_CONFIG_DOC = 'store_config';

// Read local cache
export function getStoredStoreConfig(): StoreConfig {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_STORE_CONFIG,
                ...parsed,
                heroCards: Array.isArray(parsed.heroCards) && parsed.heroCards.length > 0
                    ? parsed.heroCards
                    : DEFAULT_HERO_CARDS
            };
        }
    } catch (e) {
        console.error('Error reading store config from localStorage:', e);
    }
    return DEFAULT_STORE_CONFIG;
}

// Save local cache
export function saveStoreConfigLocally(config: StoreConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        window.dispatchEvent(new CustomEvent('dulce_tentacion_config_updated', { detail: config }));
    } catch (e) {
        console.error('Error saving store config to localStorage:', e);
    }
}

// Real-time Cloud Subscription
export function subscribeToStoreConfig(onUpdate: (config: StoreConfig) => void) {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, STORE_CONFIG_DOC);
        const unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as Partial<StoreConfig>;
                    const merged: StoreConfig = {
                        ...DEFAULT_STORE_CONFIG,
                        ...data,
                        heroCards: Array.isArray(data.heroCards) && data.heroCards.length > 0
                            ? data.heroCards
                            : DEFAULT_HERO_CARDS
                    };
                    saveStoreConfigLocally(merged);
                    onUpdate(merged);
                } else {
                    // If not in cloud yet, seed with defaults
                    onUpdate(getStoredStoreConfig());
                }
            },
            (error) => {
                console.warn('Firestore store config subscription warning:', error);
                onUpdate(getStoredStoreConfig());
            }
        );

        return unsubscribe;
    } catch (err) {
        console.warn('Error subscribing to store config:', err);
        onUpdate(getStoredStoreConfig());
        return () => { };
    }
}

// Save to Firestore and update local state
export async function updateStoreConfigInCloud(newConfig: StoreConfig): Promise<StoreConfig> {
    saveStoreConfigLocally(newConfig);

    try {
        const docRef = doc(db, SETTINGS_COLLECTION, STORE_CONFIG_DOC);
        await setDoc(docRef, { ...newConfig, updatedAt: new Date().toISOString() });
    } catch (err) {
        console.error('Error saving store config to Firestore:', err);
        throw err;
    }

    return newConfig;
}

// Reset store config to initial defaults
export async function resetStoreConfigToDefault(): Promise<StoreConfig> {
    return await updateStoreConfigInCloud(DEFAULT_STORE_CONFIG);
}

export const resetStoreConfigInCloud = resetStoreConfigToDefault;

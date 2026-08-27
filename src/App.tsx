import React, { useState, useEffect } from 'react';
import { Dessert, CartItem } from './types';
import { BAKERY_PHONE_FORMATTED } from './data/desserts';
import { getStoredDesserts, subscribeToDesserts } from './utils/dessertStorage';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { QuickOrderCalculator } from './components/QuickOrderCalculator';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductModal } from './components/ProductModal';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { PaymentModal } from './components/PaymentModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  // Check if current URL is requesting the private admin view (?admin=true, #admin, or /admin)
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminParam = urlParams.get('admin') === 'true' || urlParams.get('admin') === '1';
    const hasAdminHash = window.location.hash === '#admin' || window.location.hash === '#/admin';
    const hasAdminPath = window.location.pathname === '/admin' || window.location.pathname === '/panel-admin';
    return hasAdminParam || hasAdminHash || hasAdminPath;
  };

  const [isAdminView, setIsAdminView] = useState<boolean>(() => checkIsAdminRoute());

  // Dynamic Desserts Catalog loaded from local storage / master catalog
  const [desserts, setDesserts] = useState<Dessert[]>(() => getStoredDesserts());
  const [selectedDessert, setSelectedDessert] = useState<Dessert | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Listen for browser popstate or hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminView(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Listen for real-time Firestore database updates
  useEffect(() => {
    const unsubscribe = subscribeToDesserts((cloudDesserts) => {
      setDesserts(cloudDesserts);
    });
    return () => unsubscribe();
  }, []);

  // Persistent cart & favorites from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dulce_tentacion_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dulce_tentacion_favs');
      return saved ? JSON.parse(saved) : ['torta-tres-leches', 'crema-volteada'];
    } catch {
      return ['torta-tres-leches', 'crema-volteada'];
    }
  });

  // State for passing order info to Payment Gateway
  const [paymentData, setPaymentData] = useState<{
    customerInfo: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      deliveryType: string;
      notes?: string;
    };
    deliveryFee: number;
  }>({
    customerInfo: {
      name: '',
      phone: '',
      email: '',
      address: '',
      deliveryType: 'delivery',
    },
    deliveryFee: 0,
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dulce_tentacion_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('dulce_tentacion_favs', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const handleAddToCart = (dessert: Dessert, quantity = 1, customDedication?: string) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.dessert.id === dessert.id && item.customDedication === customDedication
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { dessert, quantity, customDedication }];
      }
    });
  };

  const handleAddToCartMultiple = (items: { dessert: Dessert; quantity: number }[]) => {
    setCartItems((prev) => {
      let updated = [...prev];
      items.forEach(({ dessert, quantity }) => {
        const idx = updated.findIndex((it) => it.dessert.id === dessert.id);
        if (idx > -1) {
          updated[idx].quantity += quantity;
        } else {
          updated.push({ dessert, quantity });
        }
      });
      return updated;
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.dessert.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.dessert.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const handleOpenPaymentGateway = (
    customerInfo: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      deliveryType: string;
      notes?: string;
    },
    deliveryFee = 0
  ) => {
    setPaymentData({ customerInfo, deliveryFee });
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    // Clear cart upon successful transaction
    setCartItems([]);
  };

  const handleReturnToCustomerStore = () => {
    // Clean URL params/hash and switch view
    if (window.history.pushState) {
      const cleanUrl = window.location.pathname;
      window.history.pushState(null, '', cleanUrl);
    }
    setIsAdminView(false);
  };

  // If URL requests the Admin Panel, render the private Administrator Panel
  if (isAdminView) {
    return (
      <AdminPanel
        onBackToStore={handleReturnToCustomerStore}
        onDessertsUpdated={(updated) => setDesserts(updated)}
      />
    );
  }

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Customer Public Storefront (100% clean, no admin buttons)
  return (
    <div className="min-h-screen bg-[#FFF8F9] text-stone-800 flex flex-col selection:bg-rose-200 selection:text-rose-900 font-sans">
      
      {/* Top Notification Announcement Bar */}
      <div className="bg-rose-600 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2">
        <span>🛵 ¡DELIVERY GRATIS en pedidos a partir de 2 unidades! | Postres a <strong>S/ 10 c/u</strong> | WhatsApp: <strong>{BAKERY_PHONE_FORMATTED}</strong></span>
      </div>

      {/* Main Sticky Navbar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        favoritesCount={favorites.length}
        onOpenFavorites={() => {
          setShowOnlyFavorites(true);
          const el = document.getElementById('catalogo');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) {
            const el = document.getElementById('catalogo');
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Flyer-style Hero Banner Section */}
        <Hero
          onExploreMenu={() => {
            const el = document.getElementById('calculadora-pedido');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenQuickCalculator={() => {
            const el = document.getElementById('calculadora-pedido');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Quick Order Calculator with Real-time Delivery Promo */}
        <QuickOrderCalculator
          desserts={desserts}
          onAddToCartMultiple={handleAddToCartMultiple}
          onOpenPaymentGatewayDirect={(items, info, fee) => {
            handleAddToCartMultiple(items);
            handleOpenPaymentGateway(info, fee);
          }}
        />

        {/* Dessert Cards Catalog with Detail View */}
        <ProductCatalog
          desserts={desserts}
          onSelectDessert={(dessert) => setSelectedDessert(dessert)}
          onAddToCart={(dessert) => handleAddToCart(dessert, 1)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showOnlyFavorites={showOnlyFavorites}
          onClearFavoritesFilter={() => setShowOnlyFavorites(false)}
        />

        {/* Reviews / Testimonials */}
        <ReviewsSection desserts={desserts} />

        {/* Contact Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Product Details Modal */}
      {selectedDessert && (
        <ProductModal
          dessert={selectedDessert}
          onClose={() => setSelectedDessert(null)}
          onAddToCart={handleAddToCart}
          isFavorite={favorites.includes(selectedDessert.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onOpenPaymentGateway={handleOpenPaymentGateway}
        onExploreMenu={() => {
          const el = document.getElementById('catalogo');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Secure Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cartItems}
        subtotal={cartItems.reduce((acc, it) => acc + it.dessert.price * it.quantity, 0)}
        deliveryFee={paymentData.deliveryFee}
        customerInfo={paymentData.customerInfo}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Floating WhatsApp Quick Action Button */}
      <FloatingWhatsApp />

    </div>
  );
}

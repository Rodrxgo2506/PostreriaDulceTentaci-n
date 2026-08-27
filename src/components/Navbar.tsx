import React, { useState, useEffect } from 'react';
import { ShoppingBag, MessageCircle, Menu, X, Heart, Search, MapPin, Sparkles, Utensils } from 'lucide-react';
import { BAKERY_NAME, BAKERY_SLOGAN, BAKERY_PHONE_NUMBER, BAKERY_PHONE_FORMATTED } from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  favoritesCount,
  onOpenFavorites,
  searchQuery,
  onSearchChange,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppDirect = () => {
    const message = `¡Hola ${BAKERY_NAME}! 🍰 Me gustaría pedir postres (Torta de tres leches, Crema volteada o Cheesecake de maracuyá).`;
    window.open(createWhatsAppUrl(BAKERY_PHONE_NUMBER, message), '_blank', 'noopener,noreferrer');
  };

  return (
    <header
      id="main-header"
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md shadow-stone-900/5 py-3 border-b border-rose-100/60'
          : 'bg-[#FCFAF8]/95 backdrop-blur-sm py-4 border-b border-rose-100/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Boutique Emblem */}
          <a
            href="#"
            id="brand-logo"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-rose-100" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-serif-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#2D1610] group-hover:text-rose-600 transition-colors leading-none">
                  {BAKERY_NAME}
                </span>
                <span className="text-xs text-rose-500">♥</span>
              </div>
              <span className="text-[11px] font-medium text-stone-500 tracking-wide mt-1">
                {BAKERY_SLOGAN}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-stone-700 tracking-wide">
            <a
              href="#catalogo"
              className="hover:text-rose-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-rose-500 hover:after:w-full after:transition-all"
            >
              Nuestros Postres
            </a>
            <a
              href="#calculadora-pedido"
              className="hover:text-rose-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-rose-500 hover:after:w-full after:transition-all flex items-center gap-1.5 text-rose-700"
            >
              <span>🛵</span>
              <span>Pedido Rápido</span>
            </a>
            <a
              href="#testimonios"
              className="hover:text-rose-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-rose-500 hover:after:w-full after:transition-all"
            >
              Opiniones
            </a>
            <a
              href="#contacto"
              className="hover:text-rose-600 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-rose-500 hover:after:w-full after:transition-all flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Ubicación</span>
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input toggle */}
            <div className="relative">
              {showSearch ? (
                <div className="flex items-center bg-white rounded-full border border-rose-200 px-3 py-1.5 shadow-sm animate-fadeIn">
                  <Search className="w-4 h-4 text-rose-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Buscar postre..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm focus:outline-none w-28 sm:w-40 text-stone-800 placeholder-stone-400"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      onSearchChange('');
                    }}
                    className="text-stone-400 hover:text-stone-600 text-xs ml-1"
                    aria-label="Cerrar búsqueda"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  id="btn-search-toggle"
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full text-stone-600 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
                  title="Buscar postres"
                  aria-label="Buscar"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Favorites Icon */}
            <button
              id="btn-navbar-favorites"
              onClick={onOpenFavorites}
              className="relative p-2 rounded-full text-stone-600 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
              title="Mis Favoritos"
              aria-label="Favoritos"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favoritesCount > 0 ? 'text-rose-600 fill-rose-600' : ''}`} />
              {favoritesCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              id="btn-navbar-cart"
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 transition-colors flex items-center justify-center cursor-pointer"
              title="Ver Carrito de Compras"
              aria-label="Carrito de compras"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce-gentle">
                  {cartCount}
                </span>
              )}
            </button>

            {/* WhatsApp Direct Order CTA Button */}
            <button
              id="btn-navbar-whatsapp"
              onClick={handleWhatsAppDirect}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 hover:shadow-md transition-all transform hover:scale-102 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>{BAKERY_PHONE_FORMATTED}</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Menú"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-rose-100/70 mt-3 space-y-2 animate-fadeIn">
            <a
              href="#catalogo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              🍰 Nuestros Postres
            </a>
            <a
              href="#calculadora-pedido"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 transition-colors"
            >
              🛵 Pedido Rápido & Delivery
            </a>
            <a
              href="#testimonios"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              ⭐ Opiniones de Clientes
            </a>
            <a
              href="#contacto"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              📍 Ubicación & Contacto
            </a>

            <div className="pt-2 px-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleWhatsAppDirect();
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Pedir por WhatsApp ({BAKERY_PHONE_FORMATTED})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

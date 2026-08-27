import React, { useState, useEffect } from 'react';
import { Dessert } from '../types';
import { X, MessageCircle, ShoppingBag, Star, Clock, Users, ShieldAlert, Sparkles, Check, Heart } from 'lucide-react';
import { generateProductOrderWhatsAppMessage, sendToWhatsApp } from '../utils/whatsapp';

interface ProductModalProps {
  dessert: Dessert | null;
  onClose: () => void;
  onAddToCart: (dessert: Dessert, quantity: number, customDedication?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  dessert,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [dedication, setDedication] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (dessert) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [dessert]);

  if (!dessert) return null;

  const currentImage = selectedImage || dessert.image;
  const allImages = [dessert.image, ...(dessert.secondaryImages || [])];

  const handleAddToCart = () => {
    onAddToCart(dessert, quantity, dedication.trim() || undefined);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 900);
  };

  const handleWhatsAppOrder = () => {
    const msg = generateProductOrderWhatsAppMessage(dessert, quantity, dedication);
    sendToWhatsApp(msg);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        id="product-details-modal"
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-rose-100 my-auto max-h-[92vh] flex flex-col overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-rose-600 shadow-md transition-all duration-200 cursor-pointer"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left: Images Column */}
            <div className="md:col-span-6 space-y-3">
              {/* Main Preview Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-rose-50 border border-rose-100 shadow-inner group">
                <img
                  src={currentImage}
                  alt={dessert.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                
                {/* Favorite badge */}
                <button
                  onClick={() => onToggleFavorite(dessert.id)}
                  className={`absolute top-3 left-3 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all ${
                    isFavorite ? 'bg-rose-500 text-white' : 'bg-white/80 text-stone-700 hover:bg-white hover:text-rose-600'
                  }`}
                  title="Favorito"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                </button>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        currentImage === img ? 'border-rose-600 ring-2 ring-rose-300' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Details Chips */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-rose-50/70 rounded-xl p-2.5 flex items-center gap-2 text-xs text-stone-700">
                  <Users className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">Rendimiento</span>
                    <span className="font-semibold">{dessert.servings}</span>
                  </div>
                </div>

                <div className="bg-rose-50/70 rounded-xl p-2.5 flex items-center gap-2 text-xs text-stone-700">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-400 block">Disponibilidad</span>
                    <span className="font-semibold">{dessert.preparationTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info & Actions Column */}
            <div className="md:col-span-6 flex flex-col space-y-4">
              
              {/* Category & Tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  {dessert.categoryName}
                </span>
                {dessert.tags.map((tag, i) => (
                  <span key={i} className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#5B2E1E] leading-tight">
                {dessert.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <div className="flex items-center text-amber-400">
                  {'★'.repeat(Math.round(dessert.rating))}
                </div>
                <span className="font-bold text-stone-800">{dessert.rating.toFixed(1)}</span>
                <span className="text-stone-400">· {dessert.reviewCount} clientes felices</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2.5 py-1">
                <span className="text-3xl sm:text-4xl font-black text-[#2D1610] font-sans tracking-tight">
                  <span className="text-xl font-bold text-rose-600 mr-1">S/</span>
                  {dessert.price.toFixed(2)}
                </span>
                {dessert.originalPrice && (
                  <span className="text-sm text-stone-600 line-through">
                    S/ {dessert.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold ml-1">
                  🛵 Delivery Gratis desde 2 unidades
                </span>
              </div>

              {/* Full Detailed Description */}
              <div className="text-xs sm:text-sm text-stone-600 leading-relaxed space-y-2 border-t border-b border-rose-100 py-3">
                <p>{dessert.fullDescription}</p>
                {dessert.calories && (
                  <p className="text-[11px] text-stone-500 font-medium">🔥 {dessert.calories}</p>
                )}
              </div>

              {/* Ingredients List */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  Ingredientes Principales:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {dessert.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs bg-rose-50/60 text-stone-700 px-2.5 py-1 rounded-lg border border-rose-100">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Allergen Info */}
              {dessert.allergens.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Alérgenos:</strong> Contiene {dessert.allergens.join(', ')}.
                  </span>
                </div>
              )}

              {/* Dedication on Cake/Card */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Mensaje o Dedicatoria (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: ¡Para endulzar tu día! 💕"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  maxLength={60}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-rose-50/30 text-stone-800"
                />
              </div>

              {/* Quantity & CTA Buttons */}
              <div className="pt-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  {/* Quantity Counter */}
                  <div className="flex items-center border border-rose-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-sm text-stone-600 hover:bg-rose-50 active:bg-rose-100"
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-bold text-stone-800 min-w-[28px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-sm text-stone-600 hover:bg-rose-50 active:bg-rose-100"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    id="btn-modal-add-cart"
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
                      addedAnimation
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-rose-300/40 hover:shadow-lg hover:shadow-rose-400/50'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Añadir al Carrito (S/ {(dessert.price * quantity).toFixed(2)})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct WhatsApp Order */}
                <button
                  id="btn-modal-order-whatsapp"
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200 hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-white" />
                  <span>Pedir Directo por WhatsApp</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

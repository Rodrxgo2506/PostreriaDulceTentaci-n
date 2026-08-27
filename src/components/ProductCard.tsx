import React, { useState } from 'react';
import { Dessert } from '../types';
import { ShoppingBag, MessageCircle, Heart, Eye, Star, Check } from 'lucide-react';
import { generateProductOrderWhatsAppMessage, sendToWhatsApp } from '../utils/whatsapp';

interface ProductCardProps {
  dessert: Dessert;
  onSelect: (dessert: Dessert) => void;
  onAddToCart: (dessert: Dessert) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  dessert,
  onSelect,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}) => {
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(dessert);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleDirectWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = generateProductOrderWhatsAppMessage(dessert, 1);
    sendToWhatsApp(msg);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(dessert.id);
  };

  return (
    <div
      id={`product-card-${dessert.id}`}
      onClick={() => onSelect(dessert)}
      className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-rose-100/90 shadow-md hover:shadow-2xl hover:shadow-rose-950/10 hover:border-rose-300 transition-all duration-300 ease-out transform hover:-translate-y-1.5 cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-rose-50/40">
        <img
          src={dessert.image}
          alt={dessert.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />
        
        {/* Soft overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Controls: Only favorite heart button on the top right (No badge on top left as requested) */}
        <div className="absolute top-3 right-3 flex items-center justify-end z-10">
          <button
            onClick={handleFavoriteClick}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${
              isFavorite
                ? 'bg-rose-600 text-white scale-105'
                : 'bg-white/90 text-stone-600 hover:bg-white hover:text-rose-600 hover:scale-105'
            }`}
            title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            aria-label="Favorito"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Quick View Button on Image Hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-stone-800 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg border border-white">
            <Eye className="w-3.5 h-3.5 text-rose-500" />
            Ver detalles & porción
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 space-y-3.5 justify-between">
        
        <div className="space-y-2.5">
          {/* Category Tag & Rating */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70">
              {dessert.categoryName}
            </span>
            <div className="flex items-center gap-1 text-stone-700 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/60">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="font-bold text-xs text-amber-900">{dessert.rating.toFixed(1)}</span>
              <span className="text-[10px] text-amber-700/80">({dessert.reviewCount})</span>
            </div>
          </div>

          {/* Dessert Title */}
          <h3 className="font-serif-display text-xl sm:text-2xl font-bold text-[#422216] group-hover:text-rose-600 transition-colors leading-tight">
            {dessert.name}
          </h3>

          {/* Detailed Short Description */}
          <p className="text-xs sm:text-[13px] text-stone-600 line-clamp-2 leading-relaxed font-normal">
            {dessert.shortDescription}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Delivery Promo Pill */}
          <div className="text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 rounded-xl px-3 py-1.5 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🛵</span>
              <span>Delivery Gratis</span>
            </span>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
              2+ unidades
            </span>
          </div>

          {/* Price & Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-rose-100/80">
            {/* Elegant Price Block */}
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">
                Precio Especial
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#2D1610] tracking-tight font-sans">
                  <span className="text-base font-bold text-rose-600 mr-0.5">S/</span>
                  {dessert.price.toFixed(2)}
                </span>
                {dessert.originalPrice && (
                  <span className="text-xs text-stone-600 line-through">
                    S/ {dessert.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* WhatsApp direct order */}
              <button
                id={`btn-whatsapp-card-${dessert.id}`}
                onClick={handleDirectWhatsApp}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 shadow-sm transition-all duration-200 transform hover:scale-105 active:scale-95 group/wa cursor-pointer"
                title="Pedir directo por WhatsApp"
                aria-label="Pedir directo por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current transition-colors" />
              </button>

              {/* Add to Cart button */}
              <button
                id={`btn-add-cart-${dessert.id}`}
                onClick={handleAddToCart}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all duration-200 transform hover:scale-102 active:scale-95 shadow-md cursor-pointer ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white shadow-emerald-200'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-rose-300/40 hover:shadow-lg hover:shadow-rose-400/50'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Listo!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

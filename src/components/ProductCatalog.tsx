import React, { useState, useMemo } from 'react';
import { Dessert, Category } from '../types';
import { CATEGORIES } from '../data/desserts';
import { ProductCard } from './ProductCard';
import { Sparkles, SlidersHorizontal, Search, RotateCcw, Heart } from 'lucide-react';

interface ProductCatalogProps {
  desserts: Dessert[];
  onSelectDessert: (dessert: Dessert) => void;
  onAddToCart: (dessert: Dessert) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showOnlyFavorites?: boolean;
  onClearFavoritesFilter?: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  desserts,
  onSelectDessert,
  onAddToCart,
  favorites,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  showOnlyFavorites = false,
  onClearFavoritesFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('todos');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  const filteredDesserts = useMemo(() => {
    return desserts
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
          return false;
        }
        // Favorites filter
        if (showOnlyFavorites && !favorites.includes(item.id)) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(query);
          const matchDesc = item.shortDescription.toLowerCase().includes(query);
          const matchIngredients = item.ingredients.some((ing) => ing.toLowerCase().includes(query));
          const matchCategory = item.categoryName.toLowerCase().includes(query);
          const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(query));
          return matchName || matchDesc || matchIngredients || matchCategory || matchTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default: best sellers first, then rating
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      });
  }, [desserts, selectedCategory, showOnlyFavorites, favorites, searchQuery, sortBy]);

  return (
    <section id="catalogo" className="py-16 sm:py-24 bg-[#FCFAF8] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200/80">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Nuestra Carta Especial</span>
          </div>
          
          <h2 className="font-serif-display text-3xl sm:text-5xl font-bold text-[#2D1610]">
            Postres de la Casa
          </h2>
          
          <p className="text-stone-600 text-sm sm:text-base font-normal max-w-2xl mx-auto">
            Elaborados artesanalmente con ingredientes seleccionados por solo <strong>S/ 10 cada uno</strong>. Pídelos con <strong>Delivery Gratis</strong> a partir de 2 unidades.
          </p>
        </div>

        {/* Favorite view notification pill */}
        {showOnlyFavorites && (
          <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <span className="text-sm font-semibold text-rose-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <span>Mostrando solo tus postres favoritos ({filteredDesserts.length})</span>
            </span>
            {onClearFavoritesFilter && (
              <button
                onClick={onClearFavoritesFilter}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
              >
                Ver todos los postres
              </button>
            )}
          </div>
        )}

        {/* Category Pills & Sorting Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200/60">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-category-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id as Category)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                      : 'bg-white text-stone-700 border border-stone-200/80 hover:bg-rose-50 hover:text-rose-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-white border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 shadow-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-400 font-normal">Ordenar:</span>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer text-stone-800"
              >
                <option value="featured">Recomendados</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="rating">Mayor Calificación</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredDesserts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDesserts.map((dessert) => (
              <ProductCard
                key={dessert.id}
                dessert={dessert}
                onSelect={onSelectDessert}
                onAddToCart={onAddToCart}
                isFavorite={favorites.includes(dessert.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/60 p-8">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-2xl">
              🍰
            </div>
            <h3 className="font-serif-display text-xl font-bold text-stone-800 mb-2">
              No se encontraron postres
            </h3>
            <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery
                ? `No encontramos resultados para "${searchQuery}". Intenta con otro término o limpia la búsqueda.`
                : 'No hay postres en esta categoría por el momento.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

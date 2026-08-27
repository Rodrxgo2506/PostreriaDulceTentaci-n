import React, { useState, useEffect, useRef } from 'react';
import { Review, Dessert } from '../types';
import {
  Star, Sparkles, Quote, CheckCircle2, ShieldCheck, Plus,
  Upload, X, MessageSquare, AlertCircle, Camera, Check, Heart, ExternalLink,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  subscribeToReviews, verifyOrderCode, submitVerifiedReviewToCloud
} from '../utils/reviewsStorage';
import { optimizeImageFile } from '../utils/dessertStorage';

interface ReviewsSectionProps {
  desserts?: Dessert[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ desserts = [] }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5stars' | 'withPhotos'>('all');

  // Form State
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [boughtItem, setBoughtItem] = useState('');
  const [cityLocation, setCityLocation] = useState('Iquitos');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Subscribe to real-time Firestore reviews
  useEffect(() => {
    const unsub = subscribeToReviews((cloudReviews) => {
      setReviews(cloudReviews);
    });
    return () => unsub();
  }, []);

  // Check URL parameters for ?order_code=... or ?opinar=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('order_code') || params.get('codigo');
    if (codeParam) {
      setOrderCode(codeParam);
      setIsModalOpen(true);
      handleAutoVerifyCode(codeParam);
    }
  }, []);

  const handleAutoVerifyCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setVerificationError(null);
    const res = await verifyOrderCode(codeToVerify);
    setIsVerifying(false);
    if (res.isValid && res.orderData) {
      setIsCodeVerified(true);
      if (res.orderData.customerName && res.orderData.customerName !== 'Cliente Verificado') {
        setCustomerName(res.orderData.customerName);
      }
      if (res.orderData.boughtItems && res.orderData.boughtItems.length > 0) {
        setBoughtItem(res.orderData.boughtItems[0]);
      }
    } else {
      setIsCodeVerified(false);
      setVerificationError(res.errorMessage || 'Código no válido.');
    }
  };

  const handleVerifyManual = async () => {
    if (!orderCode.trim()) {
      setVerificationError('Ingresa el código que aparece en tu comprobante o mensaje.');
      return;
    }
    await handleAutoVerifyCode(orderCode.trim());
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const optimized = await optimizeImageFile(file, 800, 0.85);
      setPhotoBase64(optimized);
    } catch (err) {
      console.error('Error al procesar foto:', err);
      alert('No se pudo procesar la foto. Intenta con otra imagen.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCodeVerified) {
      setVerificationError('Debes verificar tu código de pedido antes de publicar.');
      return;
    }

    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      alert('Por favor escribe un comentario de al menos 10 caracteres contándonos tu experiencia.');
      return;
    }

    setIsSubmitting(true);
    setVerificationError(null);

    const result = await submitVerifiedReviewToCloud({
      orderCode,
      customerName,
      rating,
      comment,
      boughtItem: boughtItem.trim() || (desserts[0]?.name || 'Postre Artesanal'),
      photoBase64: photoBase64 || undefined,
      location: cityLocation.trim() || 'Iquitos, Perú',
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#FB7185', '#FBBF24', '#10B981'],
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        // Reset form
        setOrderCode('');
        setCustomerName('');
        setComment('');
        setPhotoBase64(null);
        setIsCodeVerified(false);
      }, 2500);
    } else {
      setVerificationError(result.error || 'No se pudo publicar la reseña.');
    }
  };

  // Calculations
  const totalReviewsCount = reviews.length;
  const averageRating = totalReviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  const fiveStarPercentage = totalReviewsCount > 0
    ? Math.round((reviews.filter((r) => r.rating === 5).length / totalReviewsCount) * 100)
    : 100;

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === '5stars') return r.rating === 5;
    if (selectedFilter === 'withPhotos') return Boolean(r.photoUrl);
    return true;
  });

  return (
    <section id="testimonios" className="py-16 sm:py-24 bg-[#FAF8F5] relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Trust Badge */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider border border-rose-200/80 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reseñas 100% de Compradores Reales</span>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D1610]">
            Clientes Enamorados del Sabor
          </h2>

          <p className="text-stone-600 text-sm sm:text-base font-normal max-w-xl mx-auto">
            Opiniones auténticas de quienes ya probaron nuestros postres caseros y disfrutaron de nuestras entregas inmediatas.
          </p>
        </div>

        {/* Global Rating Summary Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-200">
              <span className="font-serif-display text-3xl font-black">{averageRating}</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900 font-serif-display">
                Calificación Excelente ({averageRating}/5)
              </h3>
              <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Basado en <strong>{totalReviewsCount} opiniones verificadas</strong> con ticket de compra.</span>
              </p>
              <div className="text-[11px] text-stone-400">
                ⭐ {fiveStarPercentage}% de los clientes nos califican con 5 Estrellas
              </div>
            </div>
          </div>

          {/* CTA: Leave Review Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setIsModalOpen(true);
                setVerificationError(null);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-200 hover:shadow-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>✍️ Dejar Opinión de Compra</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedFilter === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
          >
            Todas las Opiniones ({reviews.length})
          </button>
          <button
            onClick={() => setSelectedFilter('5stars')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${selectedFilter === '5stars'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Solo 5 Estrellas ({reviews.filter(r => r.rating === 5).length})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('withPhotos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${selectedFilter === 'withPhotos'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Con Foto ({reviews.filter(r => r.photoUrl).length})</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-stone-900/5 border border-stone-200/80 transition-all duration-300 flex flex-col justify-between relative group"
            >
              <div className="space-y-3.5">

                {/* Stars & Verified Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                    ))}
                  </div>

                  {rev.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Compra Verificada</span>
                    </span>
                  )}
                </div>

                {/* Optional Customer Dessert Photo */}
                {rev.photoUrl && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden border border-rose-100 bg-stone-50 relative my-2">
                    <img
                      src={rev.photoUrl}
                      alt={`Foto de ${rev.boughtItem}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-2 left-2 bg-stone-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                      <Camera className="w-3 h-3 text-rose-300" />
                      Foto real del cliente
                    </span>
                  </div>
                )}

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {rev.avatar ? (
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-10 h-10 rounded-full object-cover border border-rose-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs uppercase border border-rose-200">
                      {rev.name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#2D1610]">{rev.name}</h4>
                    <span className="text-[10px] text-rose-600 block font-semibold">
                      Probó: {rev.boughtItem}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">{rev.date || 'Reciente'}</span>
                  {rev.orderCode && (
                    <span className="text-[9px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      #{rev.orderCode}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* MODAL: SUBMIT VERIFIED REVIEW */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overscroll-contain"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-rose-100 my-auto flex flex-col max-h-[92vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-serif-display text-base sm:text-lg font-bold">
                    Opinar como Comprador Verificado
                  </h3>
                  <p className="text-[11px] text-rose-100">
                    Solo clientes con código de pedido pueden publicar
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-5 overflow-y-auto overscroll-contain">

              {submitSuccess ? (
                <div className="text-center py-8 space-y-3 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-serif-display text-2xl font-bold text-stone-900">
                    ¡Muchas gracias por tu opinión!
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto">
                    Tu reseña con la insignia <strong>✓ Compra Verificada</strong> ya ha sido publicada en la web en tiempo real.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">

                  {/* Step 1: Order Code Validation */}
                  <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-600" />
                        <span>1. Ingresa tu Código de Pedido</span>
                      </label>
                      {isCodeVerified && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Código Válido
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. #DT-123456"
                        value={orderCode}
                        onChange={(e) => {
                          setOrderCode(e.target.value);
                          setIsCodeVerified(false);
                          setVerificationError(null);
                        }}
                        disabled={isCodeVerified}
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono tracking-wider focus:outline-none focus:ring-2 ${isCodeVerified
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-stone-300 focus:ring-rose-400'
                          }`}
                      />
                      {!isCodeVerified && (
                        <button
                          type="button"
                          onClick={handleVerifyManual}
                          disabled={isVerifying || !orderCode.trim()}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isVerifying ? 'Verificando...' : 'Verificar'}
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-stone-500 leading-tight">
                      * Lo encuentras en tu recibo de pago o en el mensaje de confirmación de tu pedido por WhatsApp.
                    </p>

                    {verificationError && (
                      <div className="p-2.5 bg-rose-100 text-rose-900 text-[11px] rounded-xl border border-rose-200 flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{verificationError}</span>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Rating & Details (enabled when verified or during typing) */}
                  <div className={`space-y-3.5 transition-opacity ${isCodeVerified ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}>

                    {/* Star Rating */}
                    <div className="text-center py-2 bg-stone-50 rounded-2xl border border-stone-200/70">
                      <span className="text-xs font-bold text-stone-700 block mb-1">
                        ¿Qué tal estuvo tu postre? (Calificación)
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${(hoverRating || rating) >= star
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-stone-300'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                        {rating === 5 && '🌟 ¡Increíble! Me encantó'}
                        {rating === 4 && '😊 Muy rico y recomendado'}
                        {rating === 3 && '👍 Bueno'}
                        {rating === 2 && '😐 Regular'}
                        {rating === 1 && '🙁 Mejorable'}
                      </span>
                    </div>

                    {/* Customer Name & Dessert */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Tu Nombre:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. María Elena"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-stone-700 block mb-1">
                          Postre que probaste:
                        </label>
                        {desserts.length > 0 ? (
                          <select
                            value={boughtItem}
                            onChange={(e) => setBoughtItem(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                          >
                            <option value="">Selecciona tu postre</option>
                            {desserts.map((d) => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Ej. Torta de Tres Leches"
                            value={boughtItem}
                            onChange={(e) => setBoughtItem(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                          />
                        )}
                      </div>
                    </div>

                    {/* Comment text */}
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Tu Opinión / Experiencia:
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Cuéntanos qué te pareció el sabor, la textura, la frescura y la rapidez de la entrega..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white resize-none"
                        required
                      />
                    </div>

                    {/* Optional Photo Upload */}
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        📸 Sube una foto de tu postre (Opcional):
                      </label>
                      {photoBase64 ? (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-rose-200">
                          <img
                            src={photoBase64}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setPhotoBase64(null)}
                            className="absolute top-2 right-2 bg-stone-900/80 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="w-full py-2.5 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-xl bg-rose-50/40 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              <span>Optimizando foto...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4" />
                              <span>Adjuntar foto de tu postre</span>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>

                  </div>

                  {/* Action Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isCodeVerified || isSubmitting || isUploadingPhoto}
                      className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando y publicando en vivo...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Publicar mi Opinión Verificada</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </section>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Dessert, Category, Review, OrderVerification } from '../types';
import {
  Plus, Edit3, Trash2, Image as ImageIcon, Upload, Check, Lock,
  Eye, LogOut, Sparkles, AlertCircle, ArrowLeft, Key,
  Share2, CheckCircle2, DollarSign, Tag, RefreshCw, X, Shield, Cloud,
  Star, MessageSquare, Ticket, Copy, Send, Camera, ShieldCheck, Search, Filter,
  Loader2
} from 'lucide-react';
import {
  getStoredDesserts, addDessertToCloud, updateDessertInCloud, deleteDessertFromCloud,
  resetDessertsToDefaultInCloud, optimizeImageFile, getAdminPassword,
  setAdminPasswordInCloud, fetchAdminPasswordFromCloud, DEFAULT_ADMIN_PASSWORD,
  subscribeToDesserts
} from '../utils/dessertStorage';
import {
  subscribeToReviews, deleteReviewFromCloud, generateAdminOrderCode,
  fetchAllOrderCodesFromCloud
} from '../utils/reviewsStorage';
import { BAKERY_NAME, BAKERY_PHONE_FORMATTED, BAKERY_PHONE_NUMBER } from '../data/desserts';
import { createWhatsAppUrl } from '../utils/whatsapp';

interface ToastNotice {
  id: string;
  type: 'loading' | 'success' | 'error';
  title: string;
  message?: string;
}

interface AdminPanelProps {
  onBackToStore: () => void;
  onDessertsUpdated: (updated: Dessert[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToStore, onDessertsUpdated }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews'>('catalog');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Global Toast / Action Notification State
  const [actionToast, setActionToast] = useState<ToastNotice | null>(null);

  const showLoadingToast = (title: string, message?: string) => {
    const id = Date.now().toString();
    setActionToast({ id, type: 'loading', title, message });
    return id;
  };

  const showSuccessToast = (title: string, message?: string) => {
    const id = Date.now().toString();
    setActionToast({ id, type: 'success', title, message });
    setTimeout(() => {
      setActionToast((current) => (current?.id === id ? null : current));
    }, 3800);
  };

  const showErrorToast = (title: string, message?: string) => {
    const id = Date.now().toString();
    setActionToast({ id, type: 'error', title, message });
    setTimeout(() => {
      setActionToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Password Change Modal
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Link copy notification
  const [copiedLink, setCopiedLink] = useState(false);

  // Desserts Data State
  const [desserts, setDesserts] = useState<Dessert[]>(() => getStoredDesserts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Reviews & Order Codes State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orderCodes, setOrderCodes] = useState<OrderVerification[]>([]);
  const [newCodeCustomerName, setNewCodeCustomerName] = useState('');
  const [newCodeDessert, setNewCodeDessert] = useState('');
  const [generatedCodeResult, setGeneratedCodeResult] = useState<{ code: string; url: string; msg: string } | null>(null);
  const [copiedCodeMsg, setCopiedCodeMsg] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | 'with-photo'>('all');
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewActionNotice, setReviewActionNotice] = useState<string | null>(null);

  // Sync with Firestore in real-time
  useEffect(() => {
    const unsubDesserts = subscribeToDesserts((cloudDesserts) => {
      setDesserts(cloudDesserts);
      onDessertsUpdated(cloudDesserts);
    });

    const unsubReviews = subscribeToReviews((cloudReviews) => {
      setReviews(cloudReviews);
    });

    fetchAdminPasswordFromCloud();
    refreshOrderCodes();

    return () => {
      unsubDesserts();
      unsubReviews();
    };
  }, []);

  const refreshOrderCodes = async () => {
    const codes = await fetchAllOrderCodesFromCloud();
    setOrderCodes(codes);
  };

  // Form / Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDessertId, setEditingDessertId] = useState<string | null>(null);

  // Lock background body scroll when admin modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('postres');
  const [formCategoryName, setFormCategoryName] = useState('Pastelería Artesanal');
  const [formPrice, setFormPrice] = useState<number>(10.00);
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formFullDescription, setFormFullDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formServings, setFormServings] = useState('1 porción individual generosa');
  const [formPrepTime, setFormPrepTime] = useState('Disponible para Entrega Inmediata');
  const [formTags, setFormTags] = useState('Hecho con Amor, Especialidad');
  const [formIngredients, setFormIngredients] = useState('Ingredientes frescos y seleccionados');
  const [formAllergens, setFormAllergens] = useState('Lácteos, Gluten, Huevos');
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsNew, setFormIsNew] = useState(true);

  // Image upload handling
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getAdminPassword();
    if (passwordInput === correctPassword || passwordInput === DEFAULT_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. Por favor intenta de nuevo.');
    }
  };

  // Handle Copy Admin Link
  const handleCopyLink = () => {
    const adminUrl = `${window.location.origin}${window.location.pathname}?admin=true`;
    navigator.clipboard.writeText(adminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Handle Image File Selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      showLoadingToast('Optimizando foto...', 'Procesando y comprimiendo imagen para carga ultrarrápida...');
      const compressedBase64 = await optimizeImageFile(file, 900, 0.85);
      setFormImage(compressedBase64);
      showSuccessToast('¡Foto cargada con éxito!', 'La imagen se optimizó y está lista para guardarse.');
    } catch (err) {
      console.error('Error cargando imagen:', err);
      showErrorToast('Error al procesar imagen', 'Hubo un error al procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingDessertId(null);
    setFormName('');
    setFormCategory('postres');
    setFormCategoryName('Pastelería Artesanal');
    setFormPrice(10.00);
    setFormShortDescription('');
    setFormFullDescription('');
    setFormImage('https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1000&q=85');
    setFormServings('1 porción individual generosa');
    setFormPrepTime('Disponible para Entrega Inmediata');
    setFormTags('Hecho con Amor, Especialidad');
    setFormIngredients('Ingredientes frescos y seleccionados');
    setFormAllergens('Lácteos, Gluten, Huevos');
    setFormIsBestSeller(false);
    setFormIsNew(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dessert: Dessert) => {
    setEditingDessertId(dessert.id);
    setFormName(dessert.name);
    setFormCategory(dessert.category);
    setFormCategoryName(dessert.categoryName || 'Pastelería Artesanal');
    setFormPrice(dessert.price);
    setFormShortDescription(dessert.shortDescription);
    setFormFullDescription(dessert.fullDescription);
    setFormImage(dessert.image);
    setFormServings(dessert.servings);
    setFormPrepTime(dessert.preparationTime);
    setFormTags(dessert.tags ? dessert.tags.join(', ') : '');
    setFormIngredients(dessert.ingredients ? dessert.ingredients.join(', ') : '');
    setFormAllergens(dessert.allergens ? dessert.allergens.join(', ') : '');
    setFormIsBestSeller(Boolean(dessert.isBestSeller));
    setFormIsNew(Boolean(dessert.isNew));
    setIsModalOpen(true);
  };

  // Handle Save Dessert (Add or Edit) with Cloud Sync
  const handleSaveDessert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showErrorToast('Falta el nombre', 'Por favor ingresa el nombre del postre.');
      return;
    }

    if (!formImage.trim()) {
      showErrorToast('Falta la imagen', 'Por favor sube una foto o ingresa un enlace de imagen.');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const ingredientsArray = formIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const allergensArray = formAllergens
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setIsSavingCloud(true);
    const actionLabel = editingDessertId ? 'Guardando cambios del postre...' : 'Publicando nuevo postre en la tienda...';
    showLoadingToast(actionLabel, 'Sincronizando y guardando en la base de datos en la nube...');

    try {
      if (editingDessertId) {
        // Update
        const existing = desserts.find((d) => d.id === editingDessertId);
        const updatedItem: Dessert = {
          id: editingDessertId,
          name: formName.trim(),
          category: formCategory,
          categoryName: formCategoryName.trim() || 'Pastelería Artesanal',
          price: Number(formPrice) || 10.00,
          originalPrice: Number(formPrice) + 2.00,
          shortDescription: formShortDescription.trim() || `Delicioso ${formName.trim()} preparado artesanalmente.`,
          fullDescription: formFullDescription.trim() || formShortDescription.trim() || `Exquisito ${formName.trim()} elaborado con ingredientes seleccionados de primera calidad en Dulce Tentación.`,
          image: formImage.trim(),
          servings: formServings.trim() || '1 porción individual generosa',
          preparationTime: formPrepTime.trim() || 'Disponible para Entrega Inmediata',
          rating: existing?.rating || 5.0,
          reviewCount: existing?.reviewCount || 24,
          tags: tagsArray.length > 0 ? tagsArray : ['Artesanal', 'Recomendado'],
          ingredients: ingredientsArray.length > 0 ? ingredientsArray : ['Ingredientes frescos'],
          allergens: allergensArray.length > 0 ? allergensArray : ['Lácteos'],
          isBestSeller: formIsBestSeller,
          isNew: formIsNew,
        };

        const updatedList = await updateDessertInCloud(updatedItem);
        setDesserts(updatedList);
        onDessertsUpdated(updatedList);
        showSuccessToast('¡Cambios guardados con éxito! 🎉', `El postre "${formName.trim()}" se actualizó en vivo en la tienda.`);
      } else {
        // Add New
        const slugId = `postre-${formName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const newItem: Dessert = {
          id: slugId,
          name: formName.trim(),
          category: formCategory,
          categoryName: formCategoryName.trim() || 'Pastelería Artesanal',
          price: Number(formPrice) || 10.00,
          originalPrice: Number(formPrice) + 2.00,
          shortDescription: formShortDescription.trim() || `Delicioso ${formName.trim()} preparado artesanalmente.`,
          fullDescription: formFullDescription.trim() || formShortDescription.trim() || `Exquisito ${formName.trim()} elaborado con ingredientes seleccionados de primera calidad en Dulce Tentación.`,
          image: formImage.trim(),
          servings: formServings.trim() || '1 porción individual generosa',
          preparationTime: formPrepTime.trim() || 'Disponible para Entrega Inmediata',
          rating: 5.0,
          reviewCount: 1,
          tags: tagsArray.length > 0 ? tagsArray : ['Nuevo', 'Artesanal'],
          ingredients: ingredientsArray.length > 0 ? ingredientsArray : ['Ingredientes frescos'],
          allergens: allergensArray.length > 0 ? allergensArray : ['Lácteos'],
          isBestSeller: formIsBestSeller,
          isNew: true,
        };

        const updatedList = await addDessertToCloud(newItem);
        setDesserts(updatedList);
        onDessertsUpdated(updatedList);
        showSuccessToast('¡Postre subido con éxito! 🎉', `"${formName.trim()}" ha sido publicado en el catálogo web.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error al guardar en la nube:', err);
      showErrorToast('Error al guardar cambios', 'No se pudieron sincronizar los datos. Revisa tu conexión.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Handle Delete with Cloud Sync
  const handleDeleteDessert = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar "${name}" del catálogo global?`)) {
      try {
        showLoadingToast('Eliminando postre...', `Borrando "${name}" del catálogo global...`);
        const updatedList = await deleteDessertFromCloud(id);
        setDesserts(updatedList);
        onDessertsUpdated(updatedList);
        showSuccessToast('¡Postre eliminado!', `"${name}" fue retirado del catálogo en vivo.`);
      } catch (err) {
        console.error('Error al eliminar postre:', err);
        showErrorToast('Error al eliminar', 'No se pudo eliminar el postre.');
      }
    }
  };

  // Handle Reset to defaults in Cloud
  const handleResetCatalog = async () => {
    try {
      showLoadingToast('Restaurando catálogo...', 'Cargando postres originales predeterminados...');
      const defaultList = await resetDessertsToDefaultInCloud();
      setDesserts(defaultList);
      onDessertsUpdated(defaultList);
      setShowResetConfirm(false);
      showSuccessToast('¡Catálogo restaurado con éxito!', 'Se han restablecido los postres iniciales de Dulce Tentación.');
    } catch (err) {
      console.error('Error al restaurar:', err);
      showErrorToast('Error al restaurar catálogo', 'Inténtalo de nuevo.');
    }
  };

  // Handle Change Password in Cloud
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) {
      showErrorToast('Contraseña muy corta', 'La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    try {
      showLoadingToast('Actualizando contraseña...', 'Guardando nueva clave de administrador en la nube...');
      await setAdminPasswordInCloud(newPassword.trim());
      setPasswordChangeSuccess(true);
      showSuccessToast('¡Contraseña actualizada con éxito!', 'Tu nueva clave ya está activa.');
      setTimeout(() => {
        setPasswordChangeSuccess(false);
        setIsChangingPassword(false);
        setNewPassword('');
      }, 1500);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      showErrorToast('Error al guardar contraseña', 'No se pudo actualizar.');
    }
  };

  // Review and Code Generator Handlers
  const handleGenerateReviewCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeCustomerName.trim()) {
      showErrorToast('Falta el cliente', 'Ingresa el nombre del cliente');
      return;
    }

    try {
      setIsGeneratingCode(true);
      showLoadingToast('Generando código...', 'Registrando comprador verificado en la base de datos...');
      const code = await generateAdminOrderCode(newCodeCustomerName.trim(), newCodeDessert.trim());
      const baseUrl = window.location.origin;
      const directReviewUrl = `${baseUrl}/?order_code=${code}#testimonios`;
      const message = `🌸 *¡Hola ${newCodeCustomerName.trim()}!* 🍰\n\nMuchas gracias por comprar en *${BAKERY_NAME}* 💕\n\nNos encantaría que nos compartas tu experiencia real en nuestra web como *Comprador Verificado* usando tu código exclusivo:\n\n🎟️ *Tu Código de Compra:* #${code}\n\n👉 *Haz clic aquí para calificar:* ${directReviewUrl}\n\n¡Te tomará menos de 1 minuto y nos ayuda un montón! ✨`;

      setGeneratedCodeResult({
        code,
        url: directReviewUrl,
        msg: message,
      });

      setNewCodeCustomerName('');
      setNewCodeDessert('');
      await refreshOrderCodes();
      showSuccessToast('¡Código generado con éxito!', 'El código ya está listo para copiar y enviar a tu cliente.');
    } catch (err) {
      console.error('Error al generar código:', err);
      showErrorToast('Error al generar código', 'Inténtalo nuevamente.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDeleteReview = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la reseña de "${name}"? Esta acción borrará la opinión de la web en tiempo real.`)) {
      try {
        setDeletingReviewId(id);
        showLoadingToast('Eliminando opinión...', `Borrando comentario de "${name}" de la web...`);
        await deleteReviewFromCloud(id);
        setReviewActionNotice(`Se eliminó la reseña de "${name}" correctamente.`);
        showSuccessToast('¡Opinión eliminada con éxito!', `La reseña de "${name}" fue removida de la tienda.`);
        setTimeout(() => setReviewActionNotice(null), 3500);
      } catch (err) {
        console.error('Error al borrar reseña:', err);
        showErrorToast('Error al borrar', 'Hubo un error al intentar eliminar la reseña.');
      } finally {
        setDeletingReviewId(null);
      }
    }
  };

  const handleCopyReviewMessage = () => {
    if (!generatedCodeResult) return;
    navigator.clipboard.writeText(generatedCodeResult.msg);
    setCopiedCodeMsg(true);
    showSuccessToast('¡Mensaje copiado!', 'El texto con el enlace para el cliente ya está en tu portapapeles.');
    setTimeout(() => setCopiedCodeMsg(false), 2000);
  };

  // Filtered Reviews list for Moderation
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      (r.boughtItem && r.boughtItem.toLowerCase().includes(reviewSearchQuery.toLowerCase())) ||
      (r.orderCode && r.orderCode.toLowerCase().includes(reviewSearchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (reviewRatingFilter === '5') return r.rating === 5;
    if (reviewRatingFilter === '4') return r.rating === 4;
    if (reviewRatingFilter === '3') return r.rating <= 3;
    if (reviewRatingFilter === 'with-photo') return !!r.photoUrl;

    return true;
  });

  // Filtered list
  const filteredDesserts = desserts.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || d.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8F8] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-rose-100 shadow-xl space-y-6 text-center">

          <div className="w-16 h-16 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-center mx-auto text-3xl">
            👑
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
              Acceso Exclusivo de Administración
            </span>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
              {BAKERY_NAME}
            </h1>
            <p className="text-xs text-stone-500">
              Panel privado para subir, editar y gestionar los postres de tu tienda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Ingresa tu Contraseña Maestra:</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Contraseña de administrador"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (authError) setAuthError('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50/50"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                (Clave predeterminada: <code className="text-rose-600 font-bold">dulce2026</code>)
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-sm shadow-md shadow-rose-200 hover:shadow-rose-300 transition-all cursor-pointer"
            >
              Entrar al Panel de Control
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1.5 mx-auto font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Tienda de Clientes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FFFBFB] text-stone-900 pb-20">

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg shadow-sm">
              🍰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-display font-bold text-base sm:text-lg text-stone-900">
                  {BAKERY_NAME}
                </span>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin
                </span>
                <span className="hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Base de Datos en la Nube Conectada</span>
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden sm:block">
                Gestor Privado con Sincronización en Tiempo Real para Vercel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copiar link secreto de este panel"
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Copiar Link Privado</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsChangingPassword(true)}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
              title="Cambiar Contraseña Maestra"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="p-2 rounded-xl hover:bg-rose-50 text-stone-500 hover:text-rose-600 transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'catalog'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
          >
            <span>🍰 Catálogo de Postres ({desserts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reviews');
              refreshOrderCodes();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'reviews'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>⭐ Opiniones Verificadas ({reviews.length})</span>
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <>
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-[#2D1610] to-[#451B12] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gestor en Vivo de Dulce Tentación</span>
                  </div>
                  <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                    Catálogo de Postres
                  </h1>
                  <p className="text-stone-300 text-xs sm:text-sm">
                    Sube nuevos postres con foto desde tu celular o computadora. Todo lo que agregues o edites aquí se actualiza inmediatamente en la tienda para tus clientes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    id="btn-admin-add-dessert"
                    onClick={handleOpenAddModal}
                    className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Nuevo Postre</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Postres</span>
                <span className="font-serif-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1 block">
                  {desserts.length}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Precio Estándar</span>
                <span className="font-serif-display text-2xl sm:text-3xl font-bold text-rose-600 mt-1 block">
                  S/ 10.00
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Modalidad 1 Postre</span>
                <span className="text-xs sm:text-sm font-bold text-stone-800 mt-2 block">
                  🏪 Recojo en Tienda
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Modalidad 2+ Postres</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 mt-2 block">
                  🛵 ¡DELIVERY GRATIS!
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Buscar por nombre o ingrediente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'postres', label: 'Postres' },
                  { id: 'tortas', label: 'Tortas' },
                  { id: 'tartas', label: 'Tartas' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategoryFilter === cat.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDesserts.map((dessert) => (
                <div
                  key={dessert.id}
                  className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Product Image Preview */}
                  <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={dessert.image}
                      alt={dessert.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {dessert.category}
                      </span>
                      {dessert.isBestSeller && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          ★ Favorito
                        </span>
                      )}
                      {dessert.isNew && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          ¡Nuevo!
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full shadow-md">
                      <span className="font-serif-display font-black text-rose-700 text-sm">
                        S/ {dessert.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-serif-display font-bold text-lg text-stone-900 leading-snug">
                        {dessert.name}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {dessert.shortDescription}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {dessert.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-400 font-medium truncate">
                        {dessert.servings}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dessert)}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDessert(dessert.id, dessert.name)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                          title="Eliminar postre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state if search has no results */}
            {filteredDesserts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 p-8">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="font-serif-display text-lg font-bold text-stone-800">No se encontraron postres</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Prueba buscando con otro término o añade un nuevo postre a tu catálogo.
                </p>
              </div>
            )}

            {/* Bottom Catalog Reset Zone */}
            <div className="pt-10 border-t border-stone-200 text-center">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs text-stone-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Catálogo Predeterminado de Dulce Tentación</span>
                </button>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl max-w-md mx-auto space-y-3">
                  <p className="text-xs text-amber-900 font-bold">
                    ⚠️ ¿Deseas restablecer los postres a los originales iniciales?
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetCatalog}
                      className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Sí, Restaurar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-4 py-1.5 rounded-xl bg-stone-200 text-stone-800 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ============================================================== */
          /* REVIEWS & VERIFIED ORDER CODES TAB */
          /* ============================================================== */
          <div className="space-y-8 animate-fadeIn">

            {/* Reviews Header Banner */}
            <div className="bg-gradient-to-r from-[#2D1610] to-[#451B12] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Sistema Antifraude & Opiniones Reales</span>
                  </div>
                  <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                    Gestión de Opiniones Verificadas
                  </h1>
                  <p className="text-stone-300 text-xs sm:text-sm">
                    Solo los compradores con un código de pedido registrado pueden publicar reseñas en tu web. Se publican automáticamente al instante.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 text-center border border-white/10">
                  <span className="text-[11px] text-stone-300 uppercase font-bold tracking-wider block">Total Opiniones</span>
                  <span className="font-serif-display text-3xl font-black text-white">{reviews.length}</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Grid: Generator for WhatsApp orders & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Box: Manual Code Generator for WhatsApp Buyers */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif-display text-base font-bold text-stone-900">
                      Generar Código para Cliente de WhatsApp
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Crea un código para enviárselo a un cliente que te compró por mensaje o en tienda
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGenerateReviewCode} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Nombre del Cliente:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Carmen Rodríguez"
                        value={newCodeCustomerName}
                        onChange={(e) => setNewCodeCustomerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 bg-stone-50/50"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Postre Comprado:
                      </label>
                      <select
                        value={newCodeDessert}
                        onChange={(e) => setNewCodeDessert(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-400 bg-stone-50/50"
                      >
                        <option value="">Selecciona o escribe postre</option>
                        {desserts.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generar Código & Link Directo para WhatsApp</span>
                  </button>
                </form>

                {/* Generated Result Box */}
                {generatedCodeResult && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Código Generado con Éxito:
                      </span>
                      <span className="font-mono font-black text-sm text-rose-600 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300">
                        #{generatedCodeResult.code}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] text-stone-700 whitespace-pre-line leading-relaxed font-sans">
                      {generatedCodeResult.msg}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReviewMessage}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedCodeMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCodeMsg ? '¡Texto Copiado!' : 'Copiar Mensaje'}</span>
                      </button>

                      <a
                        href={createWhatsAppUrl(BAKERY_PHONE_NUMBER, generatedCodeResult.msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Abrir WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Box: How the Verified System Works */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-rose-100 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif-display text-base font-bold text-stone-900">
                      ¿Cómo funciona el Sistema Antifraude?
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Seguridad automática para proteger la reputación de Dulce Tentación
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl">
                    <span className="font-bold text-rose-600 shrink-0">1.</span>
                    <p>Cuando un cliente paga por la pasarela Yape/Plin o confirma por WhatsApp, se genera un <strong>código único (#DT-XXXXXX)</strong> registrado en Firestore.</p>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl">
                    <span className="font-bold text-rose-600 shrink-0">2.</span>
                    <p>Cualquier persona que intente dejar una reseña falsa será rechazada por el sistema si no tiene un código de pedido válido.</p>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 bg-stone-50 rounded-xl">
                    <span className="font-bold text-rose-600 shrink-0">3.</span>
                    <p>Cada código solo se puede usar <strong>una única vez</strong>. Al publicarse la opinión, el código queda marcado como utilizado y la opinión aparece con la insignia verde de <strong>Compra Verificada</strong>.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* List of Published Reviews with Moderation & Search */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-xs p-6 space-y-5">

              {/* Header & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                    <span>Opiniones Publicadas en Vivo</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold font-sans">
                      {reviews.length} total
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    Aquí se cargan automáticamente todas las opiniones que suben los clientes en tiempo real. Puedes buscar y borrar cualquier comentario que no sea de tu agrado.
                  </p>
                </div>
              </div>

              {/* Feedback notification when a review is deleted */}
              {reviewActionNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reviewActionNotice}</span>
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, postre, código o palabras en el comentario..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 bg-stone-50/50"
                  />
                  {reviewSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setReviewSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setReviewRatingFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${reviewRatingFilter === 'all'
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    Todas ({reviews.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewRatingFilter('5')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${reviewRatingFilter === '5'
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    <span>5 ⭐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewRatingFilter('4')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${reviewRatingFilter === '4'
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    <span>4 ⭐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewRatingFilter('with-photo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${reviewRatingFilter === 'with-photo'
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    <Camera className="w-3 h-3" />
                    <span>Con Foto</span>
                  </button>
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${deletingReviewId === rev.id
                      ? 'opacity-40 bg-red-50 border-red-200 pointer-events-none'
                      : 'bg-stone-50/60 border-stone-200 hover:border-rose-200 hover:bg-white hover:shadow-xs'
                      }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.isVerified && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verificada
                            </span>
                          )}

                          {/* Delete Review Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id, rev.name)}
                            disabled={deletingReviewId === rev.id}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group flex items-center gap-1"
                            title="Eliminar este comentario de la web"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-red-600 hidden group-hover:inline">
                              Borrar
                            </span>
                          </button>
                        </div>
                      </div>

                      {rev.photoUrl && (
                        <div className="w-full h-36 rounded-xl overflow-hidden border border-rose-100 relative group">
                          <img src={rev.photoUrl} alt="Foto cliente" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[11px] text-white font-bold bg-black/60 px-2.5 py-1 rounded-full">
                              📸 Foto enviada por el cliente
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded-xl border border-stone-100 shadow-2xs">
                        <p className="text-xs text-stone-800 leading-relaxed italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold text-stone-900">{rev.name}</span>
                        <span className="text-stone-500 block text-[10px]">🍰 Probó: <strong className="text-stone-700">{rev.boughtItem}</strong></span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-400 text-[10px] block">{rev.date}</span>
                        {rev.orderCode && (
                          <span className="font-mono text-[9px] text-stone-600 bg-white px-1.5 py-0.5 rounded border border-stone-200 font-semibold">
                            #{rev.orderCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredReviews.length === 0 && (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold text-stone-600">
                    {reviewSearchQuery || reviewRatingFilter !== 'all'
                      ? 'No se encontraron opiniones que coincidan con la búsqueda o filtro.'
                      : 'No hay opiniones publicadas todavía.'}
                  </p>
                  {(reviewSearchQuery || reviewRatingFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewSearchQuery('');
                        setReviewRatingFilter('all');
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* List of Registered Order Codes in Firestore */}
            <div className="bg-white rounded-3xl border border-rose-100 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-display text-base font-bold text-stone-900">
                    Historial de Códigos de Compra ({orderCodes.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Todos los códigos emitidos por pedidos y su estado de uso
                  </p>
                </div>
                <button
                  type="button"
                  onClick={refreshOrderCodes}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-600 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-semibold">
                      <th className="pb-2">Código</th>
                      <th className="pb-2">Cliente</th>
                      <th className="pb-2">Postre(s)</th>
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orderCodes.slice(0, 15).map((codeItem) => (
                      <tr key={codeItem.id} className="hover:bg-stone-50/50">
                        <td className="py-2.5 font-mono font-bold text-rose-600">
                          #{codeItem.orderCode}
                        </td>
                        <td className="py-2.5 font-medium text-stone-800">
                          {codeItem.customerName}
                        </td>
                        <td className="py-2.5 text-stone-500 truncate max-w-xs">
                          {codeItem.boughtItems?.join(', ') || 'Postre Artesanal'}
                        </td>
                        <td className="py-2.5 text-stone-400 text-[11px]">
                          {codeItem.createdAt ? new Date(codeItem.createdAt).toLocaleDateString() : 'Reciente'}
                        </td>
                        <td className="py-2.5 text-right">
                          {codeItem.isUsed ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                              ✓ Opinó
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                              ⏳ Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>


      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT DESSERT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-rose-100 my-8 animate-fadeIn">

            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍰</span>
                <h3 className="font-serif-display text-lg font-bold">
                  {editingDessertId ? 'Editar Postre' : 'Agregar Nuevo Postre a la Tienda'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDessert} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* IMAGE UPLOAD SECTION */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-800 block flex items-center justify-between">
                  <span>📸 Foto del Postre *</span>
                  <span className="text-[10px] text-rose-600 font-normal">
                    (Se optimiza automáticamente para cargar ultra rápido)
                  </span>
                </label>

                {/* Upload Tabs */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageUploadType('file')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${imageUploadType === 'file' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                      }`}
                  >
                    📁 Subir archivo desde Celular / PC
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadType('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${imageUploadType === 'url' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                      }`}
                  >
                    🔗 Enlace Web de Imagen
                  </button>
                </div>

                {imageUploadType === 'file' ? (
                  <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    {isUploadingImage ? (
                      <div className="py-4 text-xs font-bold text-rose-600 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Procesando imagen...</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <Upload className="w-7 h-7 text-rose-500 mx-auto" />
                        <p className="text-xs font-bold text-stone-800">
                          Toca aquí para seleccionar una foto de tu galería o cámara
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Formatos compatibles: JPG, PNG, WEBP
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto-postre.jpg"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                )}

                {/* Image Live Preview */}
                {formImage && (
                  <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-rose-200 mt-2 bg-stone-100">
                    <img
                      src={formImage}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      Vista previa de la imagen
                    </span>
                  </div>
                )}
              </div>

              {/* NAME & PRICE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-stone-700 block mb-1">Nombre del Postre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Torta Selva Negra"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Precio (S/) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 10.00)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* CATEGORY & SUBTITLE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  >
                    <option value="postres">Postres Caseros / Tradición</option>
                    <option value="tortas">Tortas & Pasteles</option>
                    <option value="tartas">Tartas & Pies</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Subtítulo / Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Tradición Casera, Especialidad"
                    value={formCategoryName}
                    onChange={(e) => setFormCategoryName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* SHORT DESCRIPTION */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Descripción Corta (Vista en el Catálogo) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. Bizcocho húmedo de chocolate con licor de cerezas, chantilly sedoso y virutas de chocolate amargo."
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* FULL DESCRIPTION */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Descripción Detallada (Ventana Modal)</label>
                <textarea
                  rows={3}
                  placeholder="Detalle completo sobre la elaboración, textura, sabor y porciones..."
                  value={formFullDescription}
                  onChange={(e) => setFormFullDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />
              </div>

              {/* SERVINGS & PREPARATION TIME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Porciones</label>
                  <input
                    type="text"
                    placeholder="Ej. 1 porción individual generosa"
                    value={formServings}
                    onChange={(e) => setFormServings(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Tiempo de Entrega / Stock</label>
                  <input
                    type="text"
                    placeholder="Ej. Disponible para Entrega Inmediata"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* TAGS & INGREDIENTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Etiquetas (Separadas por comas)</label>
                  <input
                    type="text"
                    placeholder="Ej. Favorito, Chocolate, Sin Conservantes"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Ingredientes Principales</label>
                  <input
                    type="text"
                    placeholder="Ej. Cacao puro, Crema fresca, Cerezas"
                    value={formIngredients}
                    onChange={(e) => setFormIngredients(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* BADGES CHECKBOXES */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-400"
                  />
                  <span>★ Destacar como Favorito / Más Vendido</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsNew}
                    onChange={(e) => setFormIsNew(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-400"
                  />
                  <span>✨ Marcar como Nuevo Lanzamiento</span>
                </label>
              </div>

              {/* SUBMIT BUTTONS */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingCloud}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingCloud || isUploadingImage}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-200 cursor-pointer flex items-center gap-2 transition-all active:scale-98"
                >
                  {isSavingCloud ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{editingDessertId ? 'Guardando cambios...' : 'Publicando postre...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingDessertId ? 'Guardar Cambios' : 'Publicar Postre en la Tienda'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CHANGE PASSWORD MODAL */}
      {/* ------------------------------------------------------------- */}
      {isChangingPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-rose-100 animate-fadeIn text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif-display text-lg font-bold text-stone-900">Cambiar Contraseña</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Establece una nueva clave para acceder a tu panel de administración.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Nueva Contraseña:</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {passwordChangeSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Contraseña actualizada con éxito!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="w-1/2 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING ACTION NOTIFICATION TOAST (Loading / Success / Error) */}
      {/* ------------------------------------------------------------- */}
      {actionToast && (
        <div className="fixed top-6 right-4 sm:right-8 z-50 max-w-md w-[calc(100%-2rem)] sm:w-auto animate-bounce-subtle pointer-events-auto">
          <div
            className={`px-4 py-3.5 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 ${actionToast.type === 'loading'
              ? 'bg-stone-900/95 text-white border-rose-500/40 shadow-rose-950/30'
              : actionToast.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-400/50 shadow-emerald-950/30'
                : 'bg-red-900/95 text-white border-red-400/50 shadow-red-950/30'
              }`}
          >
            <div className="mt-0.5 shrink-0">
              {actionToast.type === 'loading' && (
                <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
              )}
              {actionToast.type === 'success' && (
                <div className="w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
              {actionToast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>

            <div className="flex-1 pr-2">
              <p className="text-xs font-bold tracking-tight leading-snug">
                {actionToast.title}
              </p>
              {actionToast.message && (
                <p className="text-[11px] opacity-85 leading-tight mt-0.5">
                  {actionToast.message}
                </p>
              )}
            </div>

            {actionToast.type !== 'loading' && (
              <button
                type="button"
                onClick={() => setActionToast(null)}
                className="text-white/60 hover:text-white text-xs p-1 -mr-1 rounded-md transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

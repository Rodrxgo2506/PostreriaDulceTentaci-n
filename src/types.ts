export type Category = 'todos' | 'postres' | 'tortas' | 'tartas';

export interface Dessert {
  id: string;
  name: string;
  category: Category;
  categoryName: string;
  price: number;
  originalPrice?: number;
  shortDescription: string;
  fullDescription: string;
  image: string;
  secondaryImages?: string[];
  servings: string;
  preparationTime: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  ingredients: string[];
  allergens: string[];
  isBestSeller?: boolean;
  isNew?: boolean;
  calories?: string;
}

export interface CartItem {
  dessert: Dessert;
  quantity: number;
  selectedSize?: string;
  customDedication?: string;
}

export interface CustomOrder {
  customerName: string;
  phone: string;
  email: string;
  eventType: string;
  servings: number;
  preferredFlavor: string;
  deliveryDate: string;
  deliveryType: 'pickup' | 'delivery';
  address?: string;
  dedicationText?: string;
  specialInstructions?: string;
  referenceTheme?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  likes: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  boughtItem: string;
  date: string;
  avatar?: string;
  photoUrl?: string;
  isVerified: boolean;
  orderCode: string;
  location?: string;
  createdAt: string;
}

export interface OrderVerification {
  orderCode: string;
  customerName: string;
  boughtItems: string[];
  totalAmount: number;
  createdAt: string;
  isUsedForReview: boolean;
  reviewId?: string;
}

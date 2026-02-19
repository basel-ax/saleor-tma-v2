/**
 * Type definitions for the Saleor Telegram Mini App
 */

export type Store = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  variantId: string | null;
  variantName: string;
  variantSku: string;
  quantityAvailable: number | null;
  priceAmount: number | null;
  priceCurrency: string | null;
};

export type Category = {
  id: string;
  name: string;
  products: Product[];
};

export type CartEntry = {
  product: Product;
  quantity: number;
};

export type CartSummary = {
  items: number;
  total: {
    amount: number;
    currency: string;
  };
};

export type GraphQLError = {
  message?: string;
  code?: string;
  field?: string;
};

export type GraphQLResponse<T = unknown> = {
  data?: T;
  errors?: GraphQLError[];
};

export type AppConfig = {
  saleorApiUrl: string;
  saleorChannel: string;
  saleorDocsUrl: string;
};

export type TelegramUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
};

export type ToastState = {
  message: string;
  visible: boolean;
};

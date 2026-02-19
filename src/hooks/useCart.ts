/**
 * Custom hook for cart management
 */

import { useCallback, useState } from "react";
import type { CartEntry, CartSummary, Product } from "../types";

/**
 * Hook for managing shopping cart state
 */
export function useCart() {
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());
  const [currency, setCurrency] = useState<string | null>(null);

  const updateCart = useCallback((product: Product, nextQuantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (nextQuantity <= 0) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, quantity: nextQuantity });
      }
      return next;
    });

    if (product.priceCurrency) {
      setCurrency(product.priceCurrency);
    }
  }, []);

  const resetCart = useCallback(() => {
    setCart(new Map());
    setCurrency(null);
  }, []);

  const summarizeCart = useCallback((): CartSummary => {
    let items = 0;
    let amount = 0;
    let nextCurrency = currency;

    cart.forEach(({ product, quantity }) => {
      if (product.priceAmount != null) {
        items += quantity;
        amount += product.priceAmount * quantity;
        nextCurrency = product.priceCurrency || nextCurrency;
      }
    });

    return {
      items,
      total: {
        amount,
        currency: nextCurrency || "USD",
      },
    };
  }, [cart, currency]);

  return {
    cart,
    currency,
    updateCart,
    resetCart,
    summarizeCart,
  };
}

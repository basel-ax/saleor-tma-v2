import { useCallback, useEffect, useMemo, useState } from "react";
import {
  backButton,
  isTMA,
  mainButton,
  openLink,
  themeParams,
  useLaunchParams,
  useSignal,
} from "@tma.js/sdk-react";

import type {
  Store,
  Product,
  Category,
  TelegramUser,
} from "./types";
import type {
  CollectionsResponse,
  CollectionProductsResponse,
  CheckoutCreateResponse,
} from "./types/graphql";
import { useGraphQL } from "./hooks/useGraphQL";
import { useCart } from "./hooks/useCart";
import { useToast } from "./hooks/useToast";
import {
  stripHtml,
  truncateText,
  formatMoney,
  buildPseudoEmail,
} from "./utils";

const DEFAULT_TITLE = "Order goods";
const DEFAULT_SUBTITLE =
  "Pick a restaurant or shop powered by Saleor to start your Telegram order.";

export default function App() {
  const isDark = useSignal(themeParams.isDark);
  const launchParams = useLaunchParams(true);
  const isTelegram = useMemo(() => isTMA(), []);

  const { request: graphQLRequest, config } = useGraphQL();
  const { cart, updateCart, resetCart, summarizeCart } = useCart();
  const { toast, showToast } = useToast();

  const telegramUser: TelegramUser | null =
    launchParams?.tgWebAppData?.user || null;

  const [stores, setStores] = useState<Store[]>([]);
  const [storeEmptyMessage, setStoreEmptyMessage] = useState("Loading stores…");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [productsByCategory, setProductsByCategory] = useState<
    Map<string, Category>
  >(new Map());
  const [productEmptyMessage, setProductEmptyMessage] = useState(
    "This category has no products right now. Try another one.",
  );
  const [orderSheetVisible, setOrderSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => {
    const values = Array.from(productsByCategory.values());
    return values.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [productsByCategory]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) {
      return null;
    }
    return productsByCategory.get(selectedCategoryId) || null;
  }, [productsByCategory, selectedCategoryId]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  const loadStores = useCallback(async () => {
    setStoreEmptyMessage("Loading stores…");
    const query = `
      query StoreCollections($channel: String!) {
        collections(first: 12, channel: $channel) {
          edges {
            node {
              id
              slug
              name
              description
              seoDescription
              backgroundImage(size: 900) {
                url
                alt
              }
            }
          }
        }
      }
    `;

    try {
      const data = await graphQLRequest<CollectionsResponse>(query, {
        channel: config.saleorChannel,
      });

      const edges = data?.collections?.edges ?? [];
      const nextStores = edges
        .filter((edge) => edge?.node)
        .map((edge) => {
          const node = edge.node!;
          return {
            id: node.id || "",
            slug: node.slug || "",
            name: node.name || "",
            description: node.seoDescription || node.description || "",
            image: node.backgroundImage?.url || "",
            imageAlt: node.backgroundImage?.alt || node.name || "",
          };
        });

      setStores(nextStores);

      if (!nextStores.length) {
        setStoreEmptyMessage(
          "No active stores were found in this Saleor channel.",
        );
      } else {
        setStoreEmptyMessage("");
      }
    } catch (error: any) {
      console.error("Failed to load stores:", error);
      setStoreEmptyMessage(
        "Unable to load stores. Pull to refresh or try again later.",
      );
    }
  }, [config.saleorChannel, graphQLRequest]);

  const loadStoreProducts = useCallback(
    async (store: Store) => {
      const query = `
        query CollectionProducts($id: ID!, $channel: String!) {
          collection(id: $id, channel: $channel) {
            id
            name
            description
            products(first: 60, channel: $channel) {
              edges {
                node {
                  id
                  name
                  slug
                  description
                  category {
                    id
                    name
                  }
                  thumbnail(size: 512) {
                    url
                    alt
                  }
                  pricing {
                    priceRange {
                      start {
                        gross {
                          amount
                          currency
                        }
                      }
                    }
                  }
                  variants(first: 5) {
                    id
                    name
                    sku
                    quantityAvailable
                    pricing {
                      price {
                        gross {
                          amount
                          currency
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const data = await graphQLRequest<CollectionProductsResponse>(query, {
          id: store.id,
          channel: config.saleorChannel,
        });

        const edges = data?.collection?.products?.edges ?? [];
        const byCategory = new Map<string, Category>();

        edges.forEach((edge) => {
          const node = edge?.node;
          if (!node) return;
          const categoryId = node.category?.id || "uncategorized";
          const categoryName = node.category?.name || "Menu";

          if (!byCategory.has(categoryId)) {
            byCategory.set(categoryId, {
              id: categoryId,
              name: categoryName,
              products: [],
            });
          }

          const variants = Array.isArray(node.variants)
            ? node.variants
            : [];

          const selectedVariant = variants?.[0] || null;
          const price =
            selectedVariant?.pricing?.price?.gross ||
            node.pricing?.priceRange?.start?.gross ||
            null;

          byCategory.get(categoryId)!.products.push({
            id: node.id || "",
            slug: node.slug || "",
            name: node.name || "",
            description: node.description || "",
            image: node.thumbnail?.url || "",
            imageAlt: node.thumbnail?.alt || node.name || "",
            variantId: selectedVariant?.id || null,
            variantName: selectedVariant?.name || "",
            variantSku: selectedVariant?.sku || "",
            quantityAvailable:
              typeof selectedVariant?.quantityAvailable === "number"
                ? selectedVariant.quantityAvailable
                : null,
            priceAmount: price?.amount ?? null,
            priceCurrency: price?.currency ?? null,
          });
        });

        setProductsByCategory(byCategory);
        const firstCategory = Array.from(byCategory.values()).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        )[0];

        setSelectedCategoryId(firstCategory?.id || null);
      } catch (error: any) {
        console.error("Failed to load products:", error);
        throw error;
      }
    },
    [config.saleorChannel, graphQLRequest],
  );

  const selectStore = useCallback(
    async (store: Store) => {
      setSelectedStore(store);
      resetCart();
      setProductEmptyMessage(
        "This category has no products right now. Try another one.",
      );

      try {
        await loadStoreProducts(store);
      } catch (error: any) {
        console.error(error);
        showToast(error.message || "Unable to load products for this store.");
        setProductsByCategory(new Map());
        setSelectedCategoryId(null);
        setProductEmptyMessage("Unable to load products. Swipe down to retry.");
      }
    },
    [loadStoreProducts, resetCart, showToast],
  );

  const exitStoreView = useCallback(() => {
    setSelectedStore(null);
    setSelectedCategoryId(null);
    setProductsByCategory(new Map());
    resetCart();
  }, [resetCart]);

  const syncMainButton = useCallback(() => {
    if (!isTelegram) {
      return;
    }
    const { items, total } = summarizeCart();

    if (items === 0) {
      mainButton.hide();
      mainButton.setParams({ isVisible: false });
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const buttonColor = styles.getPropertyValue("--accent-color")?.trim();
    const buttonTextColor = styles.getPropertyValue("--accent-text")?.trim();

    mainButton.setParams({
      text: `Review order · ${formatMoney(total.amount, total.currency)}`,
      bgColor: (buttonColor as `#${string}`) || undefined,
      textColor: (buttonTextColor as `#${string}`) || undefined,
      isVisible: true,
      isEnabled: true,
    });
    mainButton.show();
  }, [isTelegram, summarizeCart]);

  const openOrderSheet = useCallback(() => {
    if (orderSheetVisible) return;
    setOrderSheetVisible(true);
  }, [orderSheetVisible]);

  const closeOrderSheet = useCallback(() => {
    if (!orderSheetVisible) return;
    setOrderSheetVisible(false);
  }, [orderSheetVisible]);

  useEffect(() => {
    loadStores().catch((error) => {
      console.error("Failed to load stores:", error);
      setStoreEmptyMessage(
        "Unable to load stores. Pull to refresh or try again later.",
      );
    });
  }, [loadStores]);

  useEffect(() => {
    if (!isTelegram) {
      return;
    }
    const shouldShow = Boolean(selectedStore || orderSheetVisible);
    if (shouldShow) {
      backButton.show();
    } else {
      backButton.hide();
    }
  }, [isTelegram, selectedStore, orderSheetVisible]);

  useEffect(() => {
    if (!isTelegram) {
      return;
    }
    const off = backButton.onClick(() => {
      if (orderSheetVisible) {
        closeOrderSheet();
        return;
      }
      if (selectedStore) {
        exitStoreView();
        return;
      }
    });

    return () => {
      off();
    };
  }, [
    isTelegram,
    orderSheetVisible,
    selectedStore,
    exitStoreView,
    closeOrderSheet,
  ]);

  useEffect(() => {
    if (!isTelegram) {
      return;
    }
    const off = mainButton.onClick(() => {
      if (cart.size > 0) {
        openOrderSheet();
      }
    });

    return () => {
      off();
    };
  }, [isTelegram, cart, openOrderSheet]);

  useEffect(() => {
    syncMainButton();
  }, [cart, syncMainButton]);

  const submitOrder = useCallback(async () => {
    if (isSubmitting) return;

    const lines: { quantity: number; variantId: string }[] = [];
    cart.forEach(({ product, quantity }) => {
      if (product.variantId && product.priceAmount != null) {
        lines.push({
          quantity,
          variantId: product.variantId,
        });
      }
    });

    if (!lines.length) {
      showToast("Nothing to submit. Add items first.");
      return;
    }

    setIsSubmitting(true);

    const summary = summarizeCart();
    const fallbackCurrency = summary.total.currency || "USD";

    const metadata = [
      {
        key: "telegram_user_id",
        value: telegramUser?.id ? String(telegramUser.id) : "guest",
      },
      {
        key: "telegram_username",
        value: telegramUser?.username || "",
      },
      {
        key: "store_slug",
        value: selectedStore?.slug || "",
      },
      {
        key: "telegram_order_total",
        value: formatMoney(summary.total.amount, fallbackCurrency),
      },
    ];

    const mutation = `
      mutation CheckoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
          }
          errors {
            field
            message
            code
          }
        }
      }
    `;

    const payload = {
      channel: config.saleorChannel,
      email: buildPseudoEmail(telegramUser),
      lines,
      metadata,
    };

    try {
      const data = await graphQLRequest<CheckoutCreateResponse>(mutation, {
        input: payload,
      });
      const result = data?.checkoutCreate;
      const errors = result?.errors || [];

      if (errors.length) {
        const errorMessage = errors
          .map((err) => err.message || err.code || "")
          .filter(Boolean)
          .join(", ");
        throw new Error(errorMessage || "Saleor returned an error.");
      }

      const checkoutUrl = result?.checkout?.webUrl || null;
      closeOrderSheet();
      resetCart();
      showToast("Order draft created. Continue in Saleor to finalize.");

      if (checkoutUrl) {
        try {
          openLink(checkoutUrl);
        } catch {
          window.open(checkoutUrl, "_blank");
        }
      }
    } catch (error: any) {
      console.error(error);
      showToast(`Order submission failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cart,
    closeOrderSheet,
    config.saleorChannel,
    graphQLRequest,
    isSubmitting,
    resetCart,
    showToast,
    summarizeCart,
    telegramUser,
    selectedStore,
  ]);

  const renderQuantityCounter = (product: Product, quantity: number) => (
    <div className="qty-counter">
      <button
        type="button"
        className="qty-button"
        onClick={() => updateCart(product, quantity - 1)}
      >
        −
      </button>
      <span className="qty-value">{quantity}</span>
      <button
        type="button"
        className="qty-button"
        onClick={() => updateCart(product, quantity + 1)}
      >
        +
      </button>
    </div>
  );

  const summary = summarizeCart();

  return (
    <>
      <div className="app-shell" id="app">
        <header className="app-header">
          <h1 className="app-title" id="app-title">
            {selectedStore?.name || DEFAULT_TITLE}
          </h1>
          <p className="app-subtitle" id="app-subtitle">
            {selectedStore
              ? truncateText(stripHtml(selectedStore.description), 140) ||
                "Browse the categories below to add items to your order."
              : DEFAULT_SUBTITLE}
          </p>
        </header>
        <main className="app-main">
          <section
            id="store-view"
            className={`view ${selectedStore ? "" : "view--active"}`}
            aria-labelledby="store-view-title"
          >
            <div className="view-header">
              <h2 id="store-view-title">Choose a store</h2>
              <p>Tap a restaurant or shop to see the menu.</p>
            </div>
            <div className="store-grid" id="store-grid" role="list">
              {stores.map((store) => (
                <button
                  type="button"
                  key={store.id}
                  className="store-card"
                  role="listitem"
                  onClick={() => selectStore(store)}
                  aria-label={`Select store: ${store.name}`}
                >
                  <div
                    className="store-card__cover"
                    style={{
                      backgroundImage: store.image
                        ? `url(${store.image})`
                        : "linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02))",
                    }}
                  >
                    <div className="store-card__title">{store.name}</div>
                  </div>
                  <div className="store-card__body">
                    <p className="store-card__description">
                      {truncateText(stripHtml(store.description), 96) ||
                        "Tap to explore the menu."}
                    </p>
                    <div className="store-card__meta">
                      <span>Menu</span>
                      <span>View</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {storeEmptyMessage && (
              <div className="empty-state" id="store-empty" role="status">
                {storeEmptyMessage}
              </div>
            )}
          </section>

          <section
            id="menu-view"
            className={`view ${selectedStore ? "view--active" : ""}`}
            aria-labelledby="menu-view-title"
          >
            <div
              className="menu-view__hero"
              id="store-hero"
              style={{
                backgroundImage: selectedStore?.image
                  ? `linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.5)), url(${selectedStore.image})`
                  : "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25))",
              }}
            >
              <div className="menu-view__hero-content">
                <h2 className="menu-view__hero-title" id="menu-view-title">
                  {selectedStore?.name || ""}
                </h2>
                <p className="menu-view__hero-subtitle" id="menu-view-subtitle">
                  {selectedStore
                    ? truncateText(stripHtml(selectedStore.description), 120) ||
                      "Browse the categories below to add items to your order."
                    : ""}
                </p>
                <div className="menu-view__hero-actions">
                  <button
                    type="button"
                    className="link-button"
                    id="back-to-stores-btn"
                    onClick={() => {
                      if (orderSheetVisible) {
                        closeOrderSheet();
                      }
                      exitStoreView();
                    }}
                  >
                    ◀ Stores
                  </button>
                  <button
                    type="button"
                    className="link-button"
                    id="store-info-btn"
                    onClick={() => {
                      if (!selectedStore) return;
                      const description = stripHtml(selectedStore.description);
                      showToast(
                        description ||
                          "We could not find extra info about this store yet.",
                      );
                    }}
                  >
                    ℹ About
                  </button>
                </div>
              </div>
            </div>

            {categories.length > 0 && (
              <nav
                className="category-tabs"
                id="category-tabs"
                aria-label="Menu categories"
              >
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={`category-tab ${
                      selectedCategoryId === category.id
                        ? "category-tab--active"
                        : ""
                    }`}
                    onClick={() => setSelectedCategoryId(category.id)}
                    aria-pressed={selectedCategoryId === category.id}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            )}

            <div className="product-grid" id="product-grid" role="list">
              {selectedCategory?.products?.map((product) => {
                const cartEntry = cart.get(product.id);
                return (
                  <article
                    className="product-card"
                    role="listitem"
                    key={product.id}
                  >
                    <div
                      className="product-card__media"
                      style={{
                        backgroundImage: product.image
                          ? `url(${product.image})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: product.image
                          ? "transparent"
                          : "rgba(0,0,0,0.06)",
                      }}
                    />
                    <div className="product-card__info">
                      <h3 className="product-card__title">{product.name}</h3>
                      <p className="product-card__description">
                        {truncateText(stripHtml(product.description), 120) ||
                          "No description yet."}
                      </p>
                      <div className="product-card__footer">
                        <div className="product-price">
                          {product.priceAmount != null && product.priceCurrency
                            ? formatMoney(
                                product.priceAmount,
                                product.priceCurrency,
                              )
                            : "—"}
                        </div>
                        {cartEntry ? (
                          renderQuantityCounter(product, cartEntry.quantity)
                        ) : (
                          <button
                            type="button"
                            className="add-button"
                            disabled={
                              !product.variantId || product.priceAmount == null
                            }
                            onClick={() => updateCart(product, 1)}
                            aria-label={`Add ${product.name} to cart`}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedStore &&
              (!selectedCategory || !selectedCategory.products.length) && (
                <div className="empty-state" id="product-empty" role="status">
                  {selectedCategoryId
                    ? productEmptyMessage
                    : "Select a category to view items."}
                </div>
              )}

            {cart.size > 0 && (
              <div className="mini-cart" id="mini-cart">
                <button
                  type="button"
                  className="mini-cart__pill"
                  id="mini-cart-button"
                  onClick={openOrderSheet}
                  aria-label={`View cart with ${summary.items} items`}
                >
                  <span id="mini-cart-count">
                    {summary.items} item{summary.items === 1 ? "" : "s"}
                  </span>
                  <span id="mini-cart-total">
                    {formatMoney(summary.total.amount, summary.total.currency)}
                  </span>
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <div
        id="order-sheet"
        className={`order-sheet ${
          orderSheetVisible ? "order-sheet--visible" : ""
        }`}
        aria-hidden={!orderSheetVisible}
      >
        <div
          className="order-sheet__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-sheet-title"
        >
          <header className="order-sheet__header">
            <h2 id="order-sheet-title">Review order</h2>
            <button
              type="button"
              className="order-sheet__close"
              id="order-close-btn"
              aria-label="Close order sheet"
              onClick={closeOrderSheet}
            >
              ×
            </button>
          </header>
          <div className="order-sheet__body">
            <div id="order-items" className="order-lines">
              {summary.items === 0 ? (
                <p className="order-line__meta">
                  Your cart is empty. Add some products to place an order.
                </p>
              ) : (
                Array.from(cart.values()).map(({ product, quantity }) => (
                  <div className="order-line" key={product.id}>
                    <div className="order-line__info">
                      <p className="order-line__title">
                        {quantity} × {product.name}
                      </p>
                      <span className="order-line__meta">
                        {product.variantName
                          ? `Variant: ${product.variantName}`
                          : product.variantSku
                            ? `SKU: ${product.variantSku}`
                            : "Default variant"}
                      </span>
                      {renderQuantityCounter(product, quantity)}
                    </div>
                    <div className="order-line__total">
                      {product.priceAmount != null && product.priceCurrency
                        ? formatMoney(
                            product.priceAmount * quantity,
                            product.priceCurrency,
                          )
                        : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="order-summary" id="order-summary">
              <div className="order-summary__row">
                <span>Subtotal</span>
                <strong>
                  {summary.items > 0
                    ? formatMoney(summary.total.amount, summary.total.currency)
                    : "—"}
                </strong>
              </div>
              <div className="order-summary__row">
                <span>Store</span>
                <span>{selectedStore ? selectedStore.name : "—"}</span>
              </div>
            </div>
          </div>
          <footer className="order-sheet__footer">
            <button
              type="button"
              className="cta-button"
              id="order-submit-btn"
              disabled={summary.items === 0 || isSubmitting}
              onClick={submitOrder}
              aria-label={
                isSubmitting
                  ? "Submitting order"
                  : `Submit order for ${formatMoney(
                      summary.total.amount,
                      summary.total.currency,
                    )}`
              }
            >
              {isSubmitting ? "Submitting…" : "Submit order"}
            </button>
          </footer>
        </div>
      </div>

      <div
        id="toast"
        className={`toast ${toast.visible ? "toast--visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>
    </>
  );
}

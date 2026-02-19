/**
 * GraphQL response types
 */

export type CollectionsResponse = {
  collections?: {
    edges?: Array<{
      node?: {
        id?: string;
        slug?: string;
        name?: string;
        description?: string;
        seoDescription?: string;
        backgroundImage?: {
          url?: string;
          alt?: string;
        } | null;
      };
    }>;
  };
};

export type CollectionProductsResponse = {
  collection?: {
    id?: string;
    name?: string;
    description?: string;
    products?: {
      edges?: Array<{
        node?: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          category?: {
            id?: string;
            name?: string;
          } | null;
          thumbnail?: {
            url?: string;
            alt?: string;
          } | null;
          pricing?: {
            priceRange?: {
              start?: {
                gross?: {
                  amount?: number;
                  currency?: string;
                };
              };
            };
          } | null;
          variants?: Array<{
            id?: string;
            name?: string;
            sku?: string;
            quantityAvailable?: number | null;
            pricing?: {
              price?: {
                gross?: {
                  amount?: number;
                  currency?: string;
                };
              } | null;
            } | null;
          }> | null;
        };
      }>;
    } | null;
  } | null;
};

export type CheckoutCreateResponse = {
  checkoutCreate?: {
    checkout?: {
      id?: string;
      webUrl?: string;
    } | null;
    errors?: Array<{
      field?: string | null;
      message?: string | null;
      code?: string | null;
    }>;
  };
};

# Saleor Telegram Mini App - Agent Development Guide

> Build and maintain Telegram Mini Apps for restaurant and retail ordering with Saleor integration.

## Project Overview

This is a modern Telegram Mini App built with React, TypeScript, and Vite, designed for restaurant and retail ordering powered by Saleor's GraphQL API. The app integrates Telegram's native UI components and is optimized for static hosting on Cloudflare Pages.

**Key Technologies:**
- React 18 + TypeScript
- Vite 5
- @tma.js/sdk-react (Telegram Mini Apps SDK)
- Saleor GraphQL API
- Cloudflare Pages (deployment)

**Architecture:**
- Pure frontend application (no server-side code)
- Static hosting ready
- Telegram authentication via init data
- GraphQL API integration for product catalog and orders
- Modular architecture with separated concerns (hooks, utils, components, types)
- Error boundaries for robust error handling
- Type-safe GraphQL responses

## Build and Test Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Type-check + production build (outputs to dist/)
npm run preview      # Preview production build locally

# Testing
npm test             # Run tests (if configured)
npm run lint         # Run linter (if configured)
npm run type-check   # Run TypeScript type checking
```

## Code Style Guidelines

### Project Structure
```
src/
├── components/          # Reusable React components
│   ├── ErrorBoundary.tsx
│   └── index.ts
├── hooks/              # Custom React hooks
│   ├── useCart.ts
│   ├── useGraphQL.ts
│   ├── useToast.ts
│   └── index.ts
├── types/              # TypeScript type definitions
│   ├── index.ts
│   └── graphql.ts
├── utils/              # Utility functions
│   ├── bootstrap.ts
│   ├── graphql.ts
│   └── index.ts
├── styles/             # CSS styles
│   └── app.css
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

### Import Organization
```typescript
// 1. React imports
import { useCallback, useEffect, useMemo, useState } from "react";

// 2. Third-party library imports
import {
  backButton,
  isTMA,
  mainButton,
  openLink,
  themeParams,
  useLaunchParams,
  useSignal,
} from "@tma.js/sdk-react";

// 3. Type imports
import type { Store, Product, Category } from "./types";

// 4. Hook imports
import { useGraphQL } from "./hooks/useGraphQL";
import { useCart } from "./hooks/useCart";

// 5. Utility imports
import { formatMoney, stripHtml } from "./utils";

// 6. Component imports
import { ErrorBoundary } from "./components";

// 7. Style imports
import "./styles/app.css";
```

### TypeScript Conventions
- Use explicit type annotations for function parameters and return types
- Prefer interfaces for object shapes, types for unions/primitives
- Use generic types where appropriate
- Enable strict mode in tsconfig.json

```typescript
// Good: Explicit types
type Store = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
};

// Good: Generic types
const [stores, setStores] = useState<Store[]>([]);
const productsByCategory = useMemo<Map<string, Category>>(() => new Map(), []);
```

### Naming Conventions
- **Components:** PascalCase (e.g., `App`, `OrderSheet`)
- **Functions/Variables:** camelCase (e.g., `loadStores`, `selectedStore`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_TITLE`, `DEFAULT_CONFIG`)
- **Types/Interfaces:** PascalCase with descriptive names (e.g., `CartEntry`, `GraphQLError`)

### Error Handling
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors for debugging
- Show user-friendly error messages via toast notifications

```typescript
const graphQLRequest = useCallback(
  async (query: string, variables: Record<string, unknown>) => {
    try {
      // API call
    } catch (error: any) {
      console.error(error);
      throw new Error(`API request failed: ${error.message}`);
    }
  },
  [authHeader, config.saleorApiUrl],
);
```

### State Management
- Use React hooks for local state
- Prefer `useMemo` and `useCallback` for expensive computations
- Use `useEffect` for side effects
- Keep state close to where it's used

```typescript
// Good: Local state with proper dependencies
const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());
const [currency, setCurrency] = useState<string | null>(null);

const summarizeCart = useCallback((): CartSummary => {
  // Computation logic
}, [cart, currency]);
```

### Component Structure
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use descriptive prop names
- Implement proper accessibility attributes

```typescript
// Good: Accessible component
<button
  type="button"
  className="store-card"
  role="listitem"
  onClick={() => selectStore(store)}
  aria-label={`Select store: ${store.name}`}
>
  {/* Content */}
</button>
```

### API Integration
- Use consistent error handling
- Include proper authentication headers
- Handle loading states
- Validate responses

```typescript
const graphQLRequest = useCallback(
  async (query: string, variables: Record<string, unknown>) => {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(config.saleorApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`API request failed (${response.status})`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((err: GraphQLError) => err.message).join(", "));
    }

    return payload.data;
  },
  [authHeader, config.saleorApiUrl],
);
```

### Telegram Mini App Integration
- Initialize SDK properly using `bootstrapTelegramSDK()` utility
- Handle Telegram-specific UI components
- Manage theme parameters
- Implement proper error handling for SDK methods
- Use error boundaries for React error handling

```typescript
// SDK initialization is handled in src/utils/bootstrap.ts
import { bootstrapTelegramSDK } from "./utils/bootstrap";

bootstrapTelegramSDK();

// Error boundaries wrap the app in main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Custom Hooks
- `useGraphQL()` - Handles GraphQL requests with authentication
- `useCart()` - Manages shopping cart state and operations
- `useToast()` - Manages toast notification state

### Error Handling
- Error boundaries catch React component errors
- GraphQL errors are properly typed and handled
- SDK initialization errors are gracefully handled with fallbacks
- User-friendly error messages via toast notifications

### CSS and Styling
- Use CSS custom properties for theming
- Follow Telegram's design guidelines
- Implement responsive design
- Use semantic HTML elements

```css
/* Good: CSS custom properties for theming */
:root {
  --accent-color: #007bff;
  --accent-text: #ffffff;
  --background-color: #ffffff;
  --text-color: #000000;
}

/* Dark theme */
[data-theme="dark"] {
  --background-color: #000000;
  --text-color: #ffffff;
}
```

### Testing Guidelines
- Test Telegram-specific functionality
- Mock Telegram SDK methods
- Test GraphQL API integration
- Verify accessibility features
- Test responsive design

### Deployment Considerations
- Ensure proper environment variable configuration
- Test build process
- Verify static hosting compatibility
- Check Telegram domain verification

## Usage Notes

This guide is intended for agentic coding agents working on this Telegram Mini App project. The project follows modern React/TypeScript best practices and integrates with Telegram's Mini App platform and Saleor's e-commerce backend.

**Key Points:**
- The app is designed for static hosting (Cloudflare Pages)
- Telegram authentication is handled via init data
- GraphQL API integration is the primary data source
- Telegram SDK provides native UI components
- Error handling and user feedback are implemented via toast notifications

**Common Tasks:**
- Adding new product features
- Modifying store/product data structures
- Updating Telegram SDK integration
- Enhancing error handling and user experience
- Adding new GraphQL queries/mutations

**Development Workflow:**
1. Make changes to components or logic
2. Test locally with `npm run dev`
3. Verify TypeScript compilation with `npm run build`
4. Test production build with `npm run preview`
5. Deploy to Cloudflare Pages for final testing
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  availableQuantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  function addToCart(product: CartItem) {
    setItems(current => {
      const existing = current.find(item => item.productId === product.productId);

      if (existing) {
        return current.map(item =>
          item.productId === product.productId
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  item.availableQuantity
                ),
              }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setItems(current => current.filter(item => item.productId !== productId));
  }

  function updateQuantity(productId: number, quantity: number) {
    setItems(current =>
      current.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(quantity, item.availableQuantity)
              ),
            }
          : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
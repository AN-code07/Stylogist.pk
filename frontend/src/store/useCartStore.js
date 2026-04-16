import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart stored per-(productId + sku) so two different variants of the same product
// coexist as independent lines. Keyed tuple makes "add / update quantity / remove" cheap.
const lineKey = (productId, sku) => `${productId}::${sku}`;

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const key = lineKey(item.productId, item.sku);
                const existing = get().items.find((i) => lineKey(i.productId, i.sku) === key);
                if (existing) {
                    set({
                        items: get().items.map((i) =>
                            lineKey(i.productId, i.sku) === key
                                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...get().items, { ...item, quantity: item.quantity || 1 }] });
                }
            },

            setQuantity: (productId, sku, quantity) => {
                const qty = Math.max(1, Number(quantity) || 1);
                set({
                    items: get().items.map((i) =>
                        lineKey(i.productId, i.sku) === lineKey(productId, sku)
                            ? { ...i, quantity: qty }
                            : i
                    ),
                });
            },

            removeItem: (productId, sku) => {
                set({
                    items: get().items.filter(
                        (i) => lineKey(i.productId, i.sku) !== lineKey(productId, sku)
                    ),
                });
            },

            clear: () => set({ items: [] }),

            subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
            count: () => get().items.reduce((s, i) => s + i.quantity, 0),
        }),
        {
            name: 'stylogist-cart',
        }
    )
);

export default useCartStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Wishlist is keyed by productId (one row per product, unlike the cart which
// is keyed by productId + sku so variants coexist). "Saved for later" is a
// product-level concept, the variant choice is made back on the product page.
const useWishlistStore = create(
    persist(
        (set, get) => ({
            items: [], // { productId, slug, name, image, price, originalPrice, brandName, averageRating }

            add: (item) => {
                if (get().items.some((i) => i.productId === item.productId)) return;
                set({ items: [...get().items, item] });
            },

            remove: (productId) => {
                set({ items: get().items.filter((i) => i.productId !== productId) });
            },

            toggle: (item) => {
                const exists = get().items.some((i) => i.productId === item.productId);
                if (exists) {
                    set({ items: get().items.filter((i) => i.productId !== item.productId) });
                } else {
                    set({ items: [...get().items, item] });
                }
                return !exists; // returns the new saved state
            },

            has: (productId) => get().items.some((i) => i.productId === productId),

            clear: () => set({ items: [] }),

            count: () => get().items.length,
        }),
        {
            name: 'stylogist-wishlist',
        }
    )
);

export default useWishlistStore;

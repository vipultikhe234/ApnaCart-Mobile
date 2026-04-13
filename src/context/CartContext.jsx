import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('cart');
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("Cart data corruption:", e);
            return [];
        }
    });

    const [coupon, setCoupon] = useState(() => {
        try {
            const saved = localStorage.getItem('cart_coupon');
            if (!saved || saved === 'undefined') return null;
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        if (coupon) {
            localStorage.setItem('cart_coupon', JSON.stringify(coupon));
        } else {
            localStorage.removeItem('cart_coupon');
        }
    }, [cartItems, coupon]);

    const addToCart = (product, quantity = 1, variant = null, merchant = null) => {
        setCartItems(prev => {
            // Check if cart is not empty and the new product is from a different Merchant
            if (prev.length > 0 && prev[0].merchant_id !== product.merchant_id) {
                const confirmed = window.confirm("Your cart contains products from another Merchant. Do you want to clear your cart and add this instead?");
                if (!confirmed) return prev;
                
                // If confirmed, clear coupon as well
                setCoupon(null);

                const newItem = { 
                    ...product, 
                    quantity, 
                    variant, 
                    merchant: merchant || product.merchant,
                    cart_item_id: `${product.id}${variant ? '-' + variant.id : ''}` 
                };
                return [newItem];
            }

            const cartItemId = `${product.id}${variant ? '-' + variant.id : ''}`;
            const existing = prev.find(item => item.cart_item_id === cartItemId);
            
            if (existing) {
                return prev.map(item =>
                    item.cart_item_id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            
            return [...prev, { 
                ...product, 
                quantity, 
                variant, 
                merchant: merchant || product.merchant,
                cart_item_id: cartItemId 
            }];
        });
    };

    const removeFromCart = (cartItemId) => {
        setCartItems(prev => {
            const newItems = prev.filter(item => item.cart_item_id !== cartItemId);
            if (newItems.length === 0) setCoupon(null);
            return newItems;
        });
    };

    const updateQuantity = (cartItemId, quantity) => {
        if (quantity < 1) return removeFromCart(cartItemId);
        setCartItems(prev =>
            prev.map(item => item.cart_item_id === cartItemId ? { ...item, quantity } : item)
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setCoupon(null);
    };

    const applyCoupon = (couponData) => setCoupon(couponData);
    const removeCoupon = () => setCoupon(null);

    const subtotal = cartItems.reduce((acc, item) => {
        const price = item.variant ? parseFloat(item.variant.price) : parseFloat(item.price);
        return acc + (price * item.quantity);
    }, 0);

    // Reactive Coupon Recalculation
    useEffect(() => {
        if (coupon && cartItems.length > 0) {
            // If subtotal falls below min required, remove it
            if (subtotal < parseFloat(coupon.min_order_amount)) {
                setCoupon(null);
                return;
            }

            // Recalculate discount based on current subtotal
            let newDiscount = 0;
            if (coupon.type === 'percentage') {
                newDiscount = (subtotal * parseFloat(coupon.value)) / 100;
                if (coupon.max_discount > 0 && newDiscount > parseFloat(coupon.max_discount)) {
                    newDiscount = parseFloat(coupon.max_discount);
                }
            } else {
                newDiscount = parseFloat(coupon.value);
            }

            // Standardize discount to 2 decimal places
            newDiscount = Math.round(newDiscount * 100) / 100;

            // Update discount if it changed
            if (newDiscount !== parseFloat(coupon.discount)) {
                setCoupon(prev => ({ ...prev, discount: newDiscount }));
            }
        }
    }, [subtotal, cartItems.length]);

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, updateQuantity, clearCart, 
            subtotal, coupon, applyCoupon, removeCoupon
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);


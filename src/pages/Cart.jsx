import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    ArrowRight,
    Ticket,
    ReceiptText,
    Wallet,
    ChevronRight,
    X
} from 'lucide-react';
import { couponService } from '../services/api';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart, subtotal, coupon, applyCoupon, removeCoupon } = useCart();
    const navigate = useNavigate();

    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponApplied, setCouponApplied] = useState(null);

    // Directly derive charges from the data already present in the cart items 
    // to avoid redundant DB fetches within the component.
    const charges = cartItems[0]?.merchant?.other_charges || {
        delivery_charge: 0,
        packaging_charge: 0,
        platform_fee: 0,
        delivery_charge_tax: 0,
        packaging_charge_tax: 0,
        platform_fee_tax: 0
    };

    const safeSubtotal = parseFloat(subtotal || 0);
    const deliveryFee = parseFloat(charges.delivery_charge || 0);
    const packingCharge = parseFloat(charges.packaging_charge || 0);
    const platformFee = parseFloat(charges.platform_fee || 0);

    const foodTaxes = cartItems.reduce((acc, item) => {
        const price = item.variant ? parseFloat(item.variant.price) : parseFloat(item.price);
        const rate = (parseFloat(item.tax_rate) || 0) / 100;
        return acc + (price * item.quantity * rate);
    }, 0);

    const taxes = foodTaxes + 
                  (packingCharge * (Number(charges.packaging_charge_tax) / 100 || 0)) +
                  (platformFee * (Number(charges.platform_fee_tax) / 100 || 0));

    // Validation Guard: Catch items that require variants but don't have them
    const invalidItems = cartItems.filter(item => item.has_variants && !item.variant);
    const hasInvalidItems = invalidItems.length > 0;

    // Coupon Calculation
    const discount = coupon ? parseFloat(coupon.discount) : 0;
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

    // Scroll to top on page load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (isCouponModalOpen) {
            const fetchCoupons = async () => {
                setIsLoadingCoupons(true);
                try {
                    const merchantId = cartItems[0]?.merchant_id;
                    const response = await couponService.getAll(merchantId);
                    
                    const now = new Date();
                    // FILTER ONLY ACTIVE & NON-EXPIRED
                    const validCoupons = response.data.data.filter(c => 
                        c.is_active && (!c.expires_at || new Date(c.expires_at) > now)
                    );

                    validCoupons.sort((a, b) => {
                        const canA = parseFloat(a.min_order_amount) <= safeSubtotal;
                        const canB = parseFloat(b.min_order_amount) <= safeSubtotal;
                        if (canA && !canB) return -1;
                        if (!canA && canB) return 1;
                        return 0;
                    });
                    setAvailableCoupons(validCoupons);
                } catch (e) {
                    console.error("Failed to fetch coupons", e);
                } finally {
                    setIsLoadingCoupons(false);
                }
            };
            fetchCoupons();
        }
    }, [isCouponModalOpen, safeSubtotal, cartItems]);

    const handleApplyCoupon = async (code = null) => {
        const finalCode = (code || couponCode).trim();
        if (!finalCode) return;
        setIsApplyingCoupon(true);
        setCouponApplied(null);
        try {
            const restId = cartItems[0]?.merchant_id || cartItems[0]?.shop_id;
            const response = await couponService.validate(finalCode, safeSubtotal, restId);
            const couponData = response.data.coupon; 

            applyCoupon({
                code: finalCode,
                discount: response.data.discount,
                message: response.data.message,
                type: couponData.type,
                value: couponData.value,
                min_order_amount: couponData.min_order_amount,
                max_discount: couponData.max_discount
            });
            setCouponApplied({ type: 'success', message: `Saved ₹${response.data.discount}` });
            setIsCouponModalOpen(false);
            setCouponCode('');
        } catch (error) {
            removeCoupon();
            setCouponApplied({ type: 'error', message: error.response?.data?.message || 'Invalid code' });
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const total = Math.max(0, safeSubtotal - discount + packingCharge + platformFee + taxes);

    const fadeUp = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="pb-52 bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen">
            {/* Header */}
            <div className="px-6 pt-12 pb-4 sticky top-0 z-40 bg-zinc-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white transition-transform active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Your Cart</h2>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{cartItems.length} items</p>
                </div>
                <div className="w-10 h-10"></div>
            </div>

            <div className="px-6 mt-6 space-y-4">
                {hasInvalidItems && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 p-4 rounded-3xl mb-4"
                    >
                        <p className="text-[11px] font-black italic uppercase text-red-500 tracking-widest text-center">
                            Selection Required: Please re-add items marked with warning
                        </p>
                    </motion.div>
                )}
                <AnimatePresence mode="popLayout">
                    {cartItems.length === 0 ? (
                        <motion.div
                            key="empty-cart"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center px-8 shadow-sm"
                        >
                            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                                <ShoppingBag size={32} className="text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Cart is empty</h3>
                            <p className="text-sm text-zinc-500 mb-8">Discover our menu to add your favorite meals.</p>

                            <Link to="/" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-all">
                                Browse Menu
                            </Link>
                        </motion.div>
                    ) : (
                        cartItems.map((item) => (
                            <motion.div
                                key={item.cart_item_id}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, x: -20 }}
                                variants={fadeUp}
                                className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 relative overflow-hidden"
                            >
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-zinc-900 dark:text-white text-sm truncate pr-2">{item.name}</h4>
                                        <button
                                            onClick={() => removeFromCart(item.cart_item_id)}
                                            className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.category?.name || 'Exclusive'}</p>
                                        {item.variant ? (
                                            <>
                                                <span className="w-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full"></span>
                                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">{item.variant.quantity}</span>
                                            </>
                                        ) : item.has_variants && (
                                            <>
                                                <span className="w-1 h-1 bg-red-500/30 rounded-full"></span>
                                                <span className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full underline decoration-double">Selection Required</span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-semibold text-zinc-900 dark:text-white">₹{parseFloat(item.variant ? item.variant.price : item.price).toFixed(2)}</span>
                                        <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 border border-zinc-100 dark:border-zinc-700">
                                            <button
                                                onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                                className="w-7 h-7 rounded-full bg-white dark:bg-zinc-700 text-zinc-500 flex items-center justify-center shadow-sm active:scale-95"
                                            >
                                                <Minus size={12} strokeWidth={2.5} />
                                            </button>
                                            <span className="text-xs font-semibold text-zinc-900 dark:text-white px-3">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                                className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-sm active:scale-95"
                                            >
                                                <Plus size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>

                {cartItems.length > 0 && (
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="pt-6 space-y-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Subtotal</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">₹{safeSubtotal.toFixed(2)}</span>
                            </div>
                            {packingCharge > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Packaging Fee</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">₹{packingCharge.toFixed(2)}</span>
                                </div>
                            )}
                            {platformFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Platform Fee</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">₹{platformFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Taxes</span>
                                <span className="font-semibold text-zinc-900 dark:text-white">₹{taxes.toFixed(2)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-500">
                                    <span className="flex items-center gap-1"><Ticket size={14} /> Coupon Applied</span>
                                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4"></div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Total</span>
                                <span className="text-2xl font-bold text-zinc-900 dark:text-white">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div 
                            onClick={() => !coupon && setIsCouponModalOpen(true)}
                            className={`p-4 rounded-3xl flex items-center justify-between transition-all ${
                                coupon 
                                ? 'bg-emerald-500/10 border-2 border-emerald-500/30' 
                                : 'bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 active:scale-[0.98]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${
                                    coupon 
                                    ? 'bg-emerald-500 text-white border-emerald-400' 
                                    : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-100 dark:border-zinc-800'
                                }`}>
                                    <Ticket size={18} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${coupon ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>
                                        {coupon ? `Code: ${coupon.code}` : 'Add Promo Code'}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {coupon ? `You're saving ₹${discount.toFixed(2)}` : 'Save on your order'}
                                    </p>
                                </div>
                            </div>
                            {coupon ? (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeCoupon();
                                    }}
                                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            ) : (
                                <ChevronRight size={18} className="text-zinc-400" />
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {cartItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-28 w-full px-6 z-40"
                    >
                        <button
                            onClick={() => {
                                if (hasInvalidItems) return;
                                const token = localStorage.getItem('access_token');
                                if (!token) navigate('/login');
                                else navigate('/checkout');
                            }}
                            disabled={hasInvalidItems}
                            className={`w-full h-[64px] rounded-2xl shadow-lg flex items-center justify-between px-6 active:scale-[0.98] transition-transform ${
                                hasInvalidItems 
                                ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            }`}
                        >
                            <span className="font-semibold text-base">₹{total.toFixed(2)}</span>
                            <span className="text-sm font-semibold flex items-center gap-2 uppercase tracking-widest italic">
                                {hasInvalidItems ? 'Resolve Selection' : 'Checkout'} <ArrowRight size={18} />
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCouponModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-white dark:bg-[#0A0A0A] rounded-t-[32px] w-full max-w-lg p-6 pb-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6 shrink-0"></div>
                            
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Select Promo</h2>
                                    <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">Offers and Coupons</p>
                                </div>
                                <button 
                                    onClick={() => setIsCouponModalOpen(false)}
                                    className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-8 custom-scrollbar">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="Enter Code (e.g. WELCOME)"
                                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-16 rounded-[20px] px-6 font-bold text-lg text-zinc-900 dark:text-white outline-none focus:border-zinc-900 dark:focus:border-white transition-all uppercase placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400"
                                        />
                                        <button
                                            onClick={() => handleApplyCoupon()}
                                            disabled={isApplyingCoupon || !couponCode.trim()}
                                            className="absolute right-2 top-2 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 rounded-2xl font-bold text-xs disabled:opacity-50"
                                        >
                                            {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponApplied && (
                                        <p className={`text-[11px] font-bold ml-2 uppercase tracking-tight ${couponApplied.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {couponApplied.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Available Offers</span>
                                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800"></div>
                                    </div>

                                    {isLoadingCoupons ? (
                                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs text-zinc-500">Discovering best deals...</p>
                                        </div>
                                    ) : availableCoupons.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <p className="text-sm font-semibold text-zinc-400">No applicable coupons found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {availableCoupons.map((c) => {
                                                const isApplicable = parseFloat(c.min_order_amount) <= safeSubtotal;
                                                const diff = parseFloat(c.min_order_amount) - safeSubtotal;

                                                const valueText = c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`;
                                                const capText = (c.type === 'percentage' && c.max_discount > 0) ? ` up to ₹${c.max_discount}` : '';

                                                return (
                                                    <motion.div
                                                        key={c.id}
                                                        whileTap={isApplicable ? { scale: 0.98 } : {}}
                                                        onClick={() => isApplicable && handleApplyCoupon(c.code)}
                                                        className={`group relative bg-white dark:bg-zinc-900 p-5 rounded-[24px] border transition-all flex items-center justify-between overflow-hidden shadow-sm ${
                                                            isApplicable 
                                                            ? 'border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-500/50' 
                                                            : 'border-zinc-200 dark:border-zinc-800 opacity-60 grayscale'
                                                        }`}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                                                    isApplicable ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 text-zinc-500'
                                                                }`}>
                                                                    {valueText} OFF
                                                                </span>
                                                            </div>
                                                            <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1 uppercase tracking-tight">{c.code}</h4>
                                                            <p className={`text-xs font-semibold ${isApplicable ? 'text-zinc-500' : 'text-emerald-600 italic'}`}>
                                                                {valueText} OFF on above ₹{c.min_order_amount} order{capText}
                                                            </p>
                                                            {!isApplicable && (
                                                                <p className="text-[10px] text-zinc-400 mt-1 font-medium">Add ₹{diff.toFixed(0)} more to unlock</p>
                                                            )}
                                                        </div>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                                            isApplicable 
                                                            ? 'bg-zinc-50 dark:bg-zinc-800 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' 
                                                            : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-300'
                                                        }`}>
                                                            <Plus size={20} strokeWidth={2.5} />
                                                        </div>
                                                        
                                                        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-zinc-50 dark:bg-[#0A0A0A] rounded-full -translate-y-1/2 border-r border-zinc-100 dark:border-zinc-800 shadow-inner"></div>
                                                        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-zinc-50 dark:bg-[#0A0A0A] rounded-full -translate-y-1/2 border-l border-zinc-100 dark:border-zinc-800 shadow-inner"></div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Cart;

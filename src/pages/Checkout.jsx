import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { couponService, orderService, addressService, MerchantService } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePayment from '../components/StripePayment';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    MapPin,
    Banknote,
    CreditCard,
    ShieldCheck,
    X,
    ArrowRight,
    Ticket,
    ReceiptText,
    Wallet
} from 'lucide-react';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const Checkout = () => {
    const { cartItems, subtotal, clearCart, coupon, applyCoupon, removeCoupon } = useCart();
    const navigate = useNavigate();
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [showStripeModal, setShowStripeModal] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);
    const [orderType, setOrderType] = useState('delivery'); // delivery or pickup

    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponApplied, setCouponApplied] = useState(null);

    const [addresses, setAddresses] = useState([]);
    const [newAddress, setNewAddress] = useState('');
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [userLoc, setUserLoc] = useState(null);
    const [distanceKm, setDistanceKm] = useState(0);

    // Scroll reset on page mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Sync coupon from context if it exists
    useEffect(() => {
        if (coupon) {
            setCouponCode(coupon.code);
            setCouponApplied({ type: 'success', message: `Saved ₹${coupon.discount}` });
        }
    }, [coupon]);

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
                        const canA = parseFloat(a.min_order_amount) <= Number(subtotal);
                        const canB = parseFloat(b.min_order_amount) <= Number(subtotal);
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
    }, [isCouponModalOpen, subtotal, cartItems]);

    // Directly derive merchant metadata from the already loaded product data 
    // to keep the frontend fast and synchronized with the latest database state.
    const merchant = cartItems[0]?.merchant || {};
    const chargesSnapshot = merchant.other_charges || {
        delivery_charge: 0,
        packaging_charge: 0,
        platform_fee: 0,
        delivery_charge_tax: 0,
        packaging_charge_tax: 0,
        platform_fee_tax: 0,
        delivery_charge_type: 'fixed',
        delivery_charge_per_km: 0,
        max_delivery_distance: 0
    };

    // Recalculate context based on snapshot rather than state fetch
    const merchantLocation = { 
        lat: parseFloat(merchant.latitude || 0), 
        lng: parseFloat(merchant.longitude || 0) 
    };

    const baseDelivery = chargesSnapshot.delivery_charge_type === 'distance' 
        ? (distanceKm * (Number(chargesSnapshot.delivery_charge_per_km) || 0))
        : (Number(chargesSnapshot.delivery_charge) || 0);

    const currentDeliveryFee = orderType === 'delivery' ? baseDelivery : 0;
    const currentPackagingCharge = (Number(chargesSnapshot.packaging_charge) || 0);
    const currentPlatformFee = (Number(chargesSnapshot.platform_fee) || 0);

    const deliveryTax = currentDeliveryFee * ((Number(chargesSnapshot.delivery_charge_tax) || 0) / 100);
    const packagingTax = currentPackagingCharge * ((Number(chargesSnapshot.packaging_charge_tax) || 0) / 100);
    const platformTax = currentPlatformFee * ((Number(chargesSnapshot.platform_fee_tax) || 0) / 100);

    const totalMerchantFees = currentDeliveryFee + currentPackagingCharge + currentPlatformFee;
    const totalMerchantTaxes = deliveryTax + packagingTax + platformTax;
    
    // Food Tax (Dynamic from DB items)
    const foodTax = cartItems.reduce((acc, item) => {
        const price = item.variant ? parseFloat(item.variant.price) : parseFloat(item.price);
        const rate = (parseFloat(item.tax_rate) || 0) / 100;
        return acc + (price * item.quantity * rate);
    }, 0);

    const couponDiscount = coupon ? parseFloat(coupon.discount) : 0;
    const finalSubtotal = (Number(subtotal) || 0) - couponDiscount;
    const total = finalSubtotal + totalMerchantFees + totalMerchantTaxes + foodTax;

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        const fetchUserData = async () => {
            // Get user location for distance calc
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    (err) => console.log('Geolocation unavailable')
                );
            }

            const fetchAddresses = async () => {
                try {
                    const response = await addressService.getAddresses();
                    if (response.data.data && response.data.data.length > 0) {
                        setAddresses(response.data.data);
                        const defaultAddress = response.data.data.find(a => a.is_default);
                        setAddress(defaultAddress ? defaultAddress.address_line : response.data.data[0].address_line);
                    }
                } catch {}
            };
            fetchAddresses();
        };

        fetchUserData();
    }, [navigate, cartItems]);

    // Haversine Distance Calc
    useEffect(() => {
        if (userLoc && merchantLocation) {
            const rad = x => x * Math.PI / 180;
            const R = 6371; // Earth Radius
            const dLat = rad(merchantLocation.lat - userLoc.lat);
            const dLong = rad(merchantLocation.lng - userLoc.lng);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(rad(userLoc.lat)) * Math.cos(rad(merchantLocation.lat)) *
                      Math.sin(dLong / 2) * Math.sin(dLong / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setDistanceKm(Number((R * c).toFixed(2)));
        }
    }, [userLoc, merchantLocation]);

    // Financial Calculation Helper
    // Consolidated above to prevent redeclaration conflict

    const handleSaveNewAddress = async () => {
        if (!newAddress.trim()) return;
        try {
            const res = await addressService.addAddress({ address_line: newAddress, is_default: true });
            setAddresses([res.data.data, ...addresses]);
            setAddress(res.data.data.address_line);
            setNewAddress('');
            setIsAddingAddress(false);
        } catch (e) {
            alert('Failed to save address');
        }
    };

    const handleApplyCoupon = async (code = null) => {
        const finalCode = (code || couponCode).trim();
        if (!finalCode) return;
        setIsApplyingCoupon(true);
        setCouponApplied(null);
        try {
            const restId = cartItems[0]?.merchant_id || cartItems[0]?.shop_id;
            const response = await couponService.validate(finalCode, subtotal, restId);
            const couponData = response.data.coupon; // Get the full coupon object from backend response

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

    const handleRemoveCoupon = () => {
        removeCoupon();
        setCouponCode('');
        setCouponApplied(null);
    };

    const handlePlaceOrder = async (stripeIntentId = null) => {
        if (orderType === 'delivery' && !address.trim()) {
            return alert('Please enter delivery address.');
        }

        // Phase 1: Stripe - Initialize Payment first if not already done
        if (paymentMethod === 'stripe' && !stripeIntentId) {
            setLoading(true);
            try {
                const response = await orderService.createIntent(total);
                setClientSecret(response.data.client_secret);
                setPlacedOrderId('PAYMENT_PENDING'); // Visual state
                setShowStripeModal(true);
            } catch (error) {
                const status = error.response?.status;
                const msg = error.response?.data?.message || error.message;
                alert(`Payment initiation failed (Status: ${status}): ${msg}`);
                console.error('Phase 1 Error:', error);
                setLoading(false);
            }
            return; 
        }

        // Phase 2: Create Actual Order (For COD or Verified Stripe)
        setLoading(true);
        try {
            const orderData = {
                merchant_id: cartItems[0]?.merchant_id,
                idempotency_key: window.crypto.randomUUID ? window.crypto.randomUUID() : (Date.now().toString() + Math.random().toString()),
                address_id: addresses.find(a => a.address_line === address)?.id || null,
                delivery_address: orderType === 'pickup' ? 'Self Pickup from Store' : address,
                payment_method: paymentMethod,
                payment_intent_id: stripeIntentId, // Verification token from Phase 1
                order_type: orderType,
                coupon_code: coupon ? coupon.code : null,
                coupon_discount: couponDiscount,
                latitude: userLoc?.lat,
                longitude: userLoc?.lng,
                delivery_fee: currentDeliveryFee,
                packing_charge: currentPackagingCharge,
                platform_fee: currentPlatformFee,
                tax_amount: totalMerchantTaxes + foodTax,
                items: cartItems.map(item => ({
                    product_id: item.id,
                    product_variant_id: item.variant?.id || null, 
                    product_name: item.name,
                    variant_name: item.variant?.name || 'Standard',
                    image_url: item.image_url || item.image,
                    unit_price: item.variant ? item.variant.price : item.price,
                    mrp_price: item.variant ? item.variant.mrp_price : (item.mrp_price || item.price),
                    quantity: item.quantity,
                }))
            };

            const response = await orderService.placeOrder(orderData);
            const finalOrder = response.data.data?.order;
            
            clearCart();
            navigate(`/order/${finalOrder.id}`);
        } catch (error) {
            const status = error.response?.status;
            const msg = error.response?.data?.message || 'Failed to place order.';
            alert(`Order Error (Status: ${status}): ${msg}`);
            console.error('Phase 2 Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStripeSuccess = (intentId) => {
        setShowStripeModal(false);
        // Now call the same function with the secret ID
        handlePlaceOrder(intentId);
    };

    return (
        <div className="pb-52 bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen">
            {/* Header */}
            <div className="px-6 pt-12 pb-4 sticky top-0 z-40 bg-zinc-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Checkout</h2>
                    <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-1">
                        <ShieldCheck size={10} /> Secure Checkout
                    </p>
                </div>
                <div className="w-10 h-10"></div>
            </div>

            <div className="px-6 mt-6 space-y-8">
                {/* Order Type Selection */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Order Type</h3>
                    <div className="grid grid-cols-2 gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-[22px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`py-3 rounded-[18px] text-xs font-bold transition-all ${
                                orderType === 'delivery'
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md'
                                    : 'bg-transparent text-zinc-500'
                            }`}
                        >
                            Home Delivery
                        </button>
                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`py-3 rounded-[18px] text-xs font-bold transition-all ${
                                orderType === 'pickup'
                                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md'
                                    : 'bg-transparent text-zinc-500'
                            }`}
                        >
                            Self Pickup
                        </button>
                    </div>
                </section>

                {/* Address (Hide if pickup) */}
                {orderType === 'delivery' && (
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Delivery Address</h3>
                            <button 
                                onClick={() => setIsAddingAddress(!isAddingAddress)}
                                className="text-xs font-semibold text-emerald-500"
                            >
                                {isAddingAddress ? 'Cancel' : '+ Add New'}
                            </button>
                        </div>

                        {isAddingAddress ? (
                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                                <textarea
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="Enter your full new address..."
                                    className="w-full bg-transparent outline-none h-20 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 resize-none"
                                />
                                <button
                                    onClick={handleSaveNewAddress}
                                    disabled={!newAddress.trim()}
                                    className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-semibold"
                                >
                                    Save Address
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.length > 0 ? (
                                    addresses.map((addr) => (
                                        <div 
                                            key={addr.id}
                                            onClick={() => setAddress(addr.address_line)}
                                            className={`p-4 rounded-3xl border cursor-pointer flex gap-3 transition-all ${
                                                address === addr.address_line 
                                                ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800' 
                                                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${address === addr.address_line ? 'border-zinc-900 dark:border-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                                {address === addr.address_line && <div className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full"></div>}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-zinc-900 dark:text-white">{addr.address_line}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <textarea
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Enter your street address..."
                                            className="w-full bg-transparent outline-none h-20 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Payment */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'cod', label: 'Cash', icon: Banknote },
                            { id: 'stripe', label: 'Card', icon: CreditCard }
                        ].map(method => {
                            const Icon = method.icon;
                            const isActive = paymentMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`relative p-4 rounded-[20px] border flex flex-col items-center gap-2 transition-all active:scale-[0.98] ${
                                        isActive
                                            ? 'border-zinc-900 bg-white dark:border-white dark:bg-zinc-800'
                                            : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[11px] font-semibold ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                        {method.label}
                                    </span>
                                    {isActive && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-zinc-900 dark:bg-white rounded-full" />}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Coupon */}
                <section>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Promo Code</h3>
                    {coupon ? (
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border-2 border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                    <Ticket size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-500">CODE: {coupon.code}</p>
                                    <p className="text-[10px] text-emerald-600 font-medium">Applied Successfully</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleRemoveCoupon}
                                className="p-2 text-zinc-400 hover:text-red-500"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => setIsCouponModalOpen(true)}
                            className="bg-white dark:bg-zinc-900 p-4 rounded-[20px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                                    <Ticket size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Add Promo Code</p>
                                    <p className="text-[10px] text-zinc-500">Save on your order</p>
                                </div>
                            </div>
                            <ArrowRight size={18} className="text-zinc-300" />
                        </div>
                    )}
                    {couponApplied && !coupon && (
                        <p className={`mt-2 text-xs font-medium ml-2 ${couponApplied.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {couponApplied.message}
                        </p>
                    )}
                </section>

                {/* Summary */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 flex items-center gap-2"><ReceiptText size={16} /> Subtotal</span>
                        <span className="font-semibold text-zinc-900 dark:text-white">₹{(Number(subtotal) || 0).toFixed(2)}</span>
                    </div>

                    {couponDiscount > 0 && (
                        <div className="flex justify-between items-center text-emerald-500 text-sm">
                            <span className="flex items-center gap-2"><Ticket size={16} /> Discount</span>
                            <span className="font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="space-y-2 pt-2">
                        {orderType === 'delivery' && currentDeliveryFee > 0 && (
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-zinc-500">
                                    Delivery Fee 
                                    {chargesSnapshot.delivery_charge_type === 'distance' && distanceKm > 0 && (
                                        <span className="text-[10px] text-zinc-400 font-bold ml-1 uppercase">({distanceKm} KM)</span>
                                    )}
                                </span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-300">₹{currentDeliveryFee.toFixed(2)}</span>
                            </div>
                        )}
                        {currentPackagingCharge > 0 && (
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-zinc-500">Packaging Charge</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-300">₹{currentPackagingCharge.toFixed(2)}</span>
                            </div>
                        )}
                        {currentPlatformFee > 0 && (
                            <div className="flex justify-between items-center text-[13px]">
                                <span className="text-zinc-500">Platform Fee</span>
                                <span className="font-medium text-zinc-900 dark:text-zinc-300">₹{currentPlatformFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-[13px]">
                            <span className="text-zinc-500 flex items-center gap-2"><Wallet size={16} /> Taxes & GST</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-300">₹{(totalMerchantTaxes + foodTax).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4"></div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Total to pay</span>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Fix Bar */}
            <AnimatePresence>
                {!showStripeModal && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="fixed bottom-0 w-full p-6 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 z-50"
                    >
                        <button
                            onClick={() => handlePlaceOrder()}
                            disabled={loading || cartItems.length === 0}
                            className={`w-full h-[60px] rounded-2xl shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-transform ${
                                loading ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                            }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="font-semibold text-base">Confirm payment - ₹{total.toFixed(2)}</span>
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stripe Modal */}
            <AnimatePresence>
                {showStripeModal && clientSecret && (
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
                            className="bg-white dark:bg-[#0A0A0A] rounded-t-[32px] w-full max-w-lg p-6 pb-12 shadow-2xl relative overflow-y-auto max-h-[90vh]"
                        >
                            <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-6"></div>

                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Pay Securely</h2>
                                </div>
                                <button onClick={() => setShowStripeModal(false)} className="w-8 h-8 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900">
                                <Elements stripe={stripePromise}>
                                    {placedOrderId && (
                                        <StripePayment
                                            key={placedOrderId}
                                            clientSecret={clientSecret}
                                            orderId={placedOrderId}
                                            onSucceeded={handleStripeSuccess}
                                            onFailed={(msg) => {
                                                setShowStripeModal(false);
                                                alert('Payment failed: ' + msg);
                                            }}
                                        />
                                    )}
                                </Elements>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Coupon Modal */}
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
                                {/* Entry section */}
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
                                    {couponApplied?.type === 'error' && <p className="text-[11px] font-bold text-red-500 ml-2 uppercase tracking-tight">{couponApplied.message}</p>}
                                </div>

                                {/* List section */}
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
                                                const isApplicable = parseFloat(c.min_order_amount) <= Number(subtotal);
                                                const diff = parseFloat(c.min_order_amount) - Number(subtotal);

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
                                                            <ArrowRight size={20} strokeWidth={2.5} />
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

export default Checkout;


import MobileLoader from '../components/MobileLoader';
import Skeleton from '../components/Skeleton';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Star,
    Clock,
    Flame,
    Leaf,
    MessageSquare,
    Plus,
    Minus,
    ArrowRight,
    X,
    Heart,
    Share2,
    ShieldCheck,
    Utensils
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, cartItems, updateQuantity } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Dynamic Price Calculation
    const currentPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product?.price || 0);
    const isOutOfStock = product?.has_variants 
        ? (selectedVariant ? selectedVariant.available_stock <= 0 : true)
        : (product?.stock <= 0);

    const handleSubmitReview = async () => {
        try {
            await productService.addReview(id, {
                rating: userRating,
                comment: reviewComment
            });
            setShowReviewModal(false);
            const response = await productService.getById(id);
            setProduct(response.data.data);
            setReviewComment('');
        } catch (error) {
            console.error("Review error:", error);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await productService.getById(id);
                setProduct(response.data.data);

                const queryParams = new URLSearchParams(location.search);
                if (response.data.data?.has_variants && response.data.data.variants?.length > 0) {
                    setSelectedVariant(response.data.data.variants[0]);
                }

                if (queryParams.get('auto_add') === 'true' && response.data.data) {
                    const qty = parseInt(queryParams.get('qty')) || 1;
                    const variantId = queryParams.get('variant_id');
                    const variant = response.data.data.variants?.find(v => v.id == variantId) || response.data.data.variants?.[0];
                    addToCart(response.data.data, qty, variant);
                    navigate('/cart', { replace: true });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, location.search, addToCart, navigate]);

    if (!product && !loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-zinc-50 dark:bg-[#0A0A0A] p-6">
            <X size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">Item Not Found</h1>
            <button onClick={() => navigate('/')} className="text-sm font-medium underline text-zinc-900 dark:text-white">Return Home</button>
        </div>
    );

    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] pb-32 font-sans">
            {/* Header Actions (Always visible for safety) */}
            <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-[60]">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex gap-3">
                    <button className="w-10 h-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform">
                        <Heart size={18} />
                    </button>
                    <button className="w-10 h-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Hero Image Area */}
            <div className="relative h-[45vh] bg-zinc-100 dark:bg-zinc-900">
                {loading && !product ? (
                    <Skeleton height="100%" borderRadius="0px" />
                ) : (
                    <img src={product?.image_url} alt={product?.name} className="w-full h-full object-cover" />
                )}
            </div>

            {/* Content Area */}
            <div className="px-6 pt-6 bg-zinc-50 dark:bg-[#0A0A0A] relative -mt-6 rounded-t-3xl border-t border-white/10">
                {loading && !product ? (
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Skeleton width="40%" height="16px" />
                            <Skeleton width="90%" height="32px" />
                        </div>
                        <div className="flex gap-2">
                             <Skeleton width="60px" height="24px" />
                             <Skeleton width="60px" height="24px" />
                        </div>
                        <Skeleton height="120px" borderRadius="32px" />
                    </div>
                ) : (
                    <>
                        {/* Title & Price */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1 pr-4">
                                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight mb-2 uppercase italic tracking-tighter">{product.name}</h1>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-xs font-semibold text-zinc-900 dark:text-white">{parseFloat(product.avg_rating || 4.5).toFixed(1)}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black italic">{product.category?.name || 'Main Menu'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-zinc-900 dark:text-white italic tracking-tighter">₹{currentPrice.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Variants */}
                        {product.has_variants && product.variants?.length > 0 && (
                            <div className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
                                <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-4">Select Style</h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            disabled={v.available_stock <= 0}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                                selectedVariant?.id === v.id
                                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                                                    : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'
                                            }`}
                                        >
                                            {v.quantity}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Specs */}
                        <div className="grid grid-cols-4 gap-2 mb-8">
                            {[
                                { label: 'Time', val: `${product.preparation_time || 20} min`, icon: Clock },
                                { label: 'Calories', val: `${product.calories || 0} kcal`, icon: Flame },
                                { label: 'Spicy', val: `Lvl ${product.spicy_level || 0}`, icon: Flame },
                                { label: 'Type', val: product.is_veg ? 'Veg' : 'Meat', icon: Leaf }
                            ].map((spec, i) => {
                                const Icon = spec.icon;
                                return (
                                    <div key={i} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-1.5 min-w-0">
                                        <Icon size={14} className="text-brand-500" />
                                        <p className="text-[9px] font-black text-zinc-900 dark:text-white truncate uppercase tracking-tighter">{spec.val}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 italic">Signature Details</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed font-bold italic">
                                {product.description || "A delicious blend of premium ingredients prepared to your total satisfaction."}
                            </p>
                        </div>

                        {/* Reviews / Feedback */}
                        <div className="mb-12">
                            <div className="flex flex-col gap-6">
                                <header className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-black tracking-tighter mb-1 uppercase italic text-zinc-900 dark:text-white">Guest Experience</h2>
                                        <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] italic">Voices from our marketplace</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (!localStorage.getItem('access_token')) return navigate('/login');
                                            setShowReviewModal(true);
                                        }}
                                        className="bg-brand-500/10 text-brand-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic border border-brand-500/20"
                                    >
                                        Share Feedback
                                    </button>
                                </header>

                                <div className="space-y-4">
                                    {product.reviews?.length > 0 ? (
                                        product.reviews.map((rev, i) => (
                                            <div key={i} className="bg-white dark:bg-zinc-900/40 p-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 flex flex-col gap-3 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 text-xs font-black italic border border-brand-500/20">
                                                            {rev.user_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black tracking-tight uppercase italic text-zinc-900 dark:text-white">{rev.user_name}</p>
                                                            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest italic">Verified Guest</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, s) => (
                                                            <Star key={s} size={10} className={s < rev.rating ? 'text-brand-500 fill-brand-500' : 'text-zinc-200 dark:text-zinc-800'} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold italic leading-relaxed">"{rev.comment}"</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 bg-white dark:bg-zinc-900/20 rounded-[32px] text-center border border-zinc-100 dark:border-zinc-800 border-dashed">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">No feedback shared yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sticky Actions */}
            <AnimatePresence>
                {!showReviewModal && product && (
                    <motion.div
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        className="fixed bottom-0 w-full p-6 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-3xl border-t border-zinc-100 dark:border-zinc-800/50 z-50 flex gap-4"
                    >
                        {(() => {
                            const cartItemId = `${product.id}${selectedVariant ? '-' + selectedVariant.id : ''}`;
                            const cartItem = cartItems.find(item => item.cart_item_id === cartItemId);
                            const displayQty = cartItem ? cartItem.quantity : quantity;

                            return (
                                <>
                                    <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-900 rounded-2xl p-1.5 border border-zinc-200 dark:border-zinc-800 z-[60]">
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (cartItem) {
                                                    updateQuantity(cartItemId, cartItem.quantity - 1);
                                                } else {
                                                    setQuantity(prev => Math.max(1, prev - 1));
                                                }
                                            }} 
                                            className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer text-zinc-900 dark:text-white"
                                        >
                                            <Minus size={16} strokeWidth={3} />
                                        </button>
                                        <span className="w-10 text-center font-black text-sm italic text-zinc-900 dark:text-white">{displayQty}</span>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                if (cartItem) {
                                                    updateQuantity(cartItemId, cartItem.quantity + 1);
                                                } else {
                                                    setQuantity(prev => prev + 1);
                                                }
                                            }} 
                                            className="w-10 h-10 bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer"
                                        >
                                            <Plus size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <button
                                        disabled={isOutOfStock}
                                        onClick={() => {
                                            if (!cartItem) {
                                                addToCart(product, quantity, selectedVariant, product.merchant);
                                            } else {
                                                navigate('/cart');
                                            }
                                        }}
                                        className={`flex-1 rounded-2xl shadow-xl flex items-center justify-between px-6 active:scale-95 transition-all ${
                                            isOutOfStock ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 opacity-50' : 'bg-brand-500 text-zinc-950 font-black'
                                        }`}
                                    >
                                        <span className="text-[10px] uppercase tracking-widest italic">{isOutOfStock ? 'Sold out' : (cartItem ? 'Checkout Now' : 'Add to cart')}</span>
                                        <span className="text-lg italic tracking-tighter">₹{(currentPrice * displayQty).toFixed(0)}</span>
                                    </button>
                                </>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && product && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end"
                        onClick={() => setShowReviewModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-[#0A0A0A] w-full rounded-t-[40px] p-8 pb-12 shadow-2xl relative border-t border-white/5"
                        >
                            <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8"></div>
                            
                            <header className="mb-8">
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic mb-1">Share Experience</h2>
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] italic">Post public feedback</p>
                            </header>

                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 mb-8">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic mb-4 text-center">Rate your delight</p>
                                <div className="flex justify-center gap-3 mb-8">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setUserRating(star)} className="active:scale-90 transition-transform">
                                            <Star size={32} className={userRating >= star ? 'text-brand-500 fill-brand-500' : 'text-zinc-200 dark:text-zinc-800'} />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Your feedback matters..."
                                    className="w-full p-5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl outline-none min-h-[120px] text-sm italic font-bold text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                />
                            </div>

                            <button 
                                onClick={handleSubmitReview} 
                                disabled={userRating === 0 || !reviewComment.trim()}
                                className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest italic shadow-xl transition-all active:scale-95 ${userRating === 0 || !reviewComment.trim() ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-brand-500 text-zinc-950'}`}
                            >
                                Submit Review
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetail;

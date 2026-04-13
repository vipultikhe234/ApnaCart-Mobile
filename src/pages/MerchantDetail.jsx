import MobileLoader from '../components/MobileLoader';
import { ProductCardSkeleton } from '../components/Skeleton';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService, MerchantService } from '../services/api';
import {
    ChevronLeft,
    Star,
    Clock,
    Plus,
    Minus,
    User,
    Heart,
    Send,
    ShoppingBag,
    ChevronRight,
    MapPin,
    ShieldAlert,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useSidebar } from '../context/SidebarContext';

const MerchantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems, updateQuantity } = useCart();
    const { openSidebar } = useSidebar();

    const [merchant, setMerchant] = useState(null);
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]); // Master list of categories
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('FULL MENU');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hardcoded Main Categories
    const mainCategories = ['FULL MENU', 'VEG', 'NON-VEG'];

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            try {
                const [restRes, prodRes, catRes, reviewRes] = await Promise.all([
                    MerchantService.getById(id),
                    productService.getAll({ merchant_id: id }),
                    productService.getCategories({ merchant_id: id }),
                    MerchantService.getReviews(id)
                ]);
                
                if (restRes.data.data) {
                    setMerchant(restRes.data.data);
                }
                
                const fetchedProducts = prodRes.data.data || [];
                const fetchedCategories = catRes.data.data || [];

                setProducts(fetchedProducts);
                
                // Merge official categories with any categories found in the products
                const catNames = fetchedCategories.map(c => c.name);
                const productCats = fetchedProducts.map(p => p.category?.name || 'Menu');
                const combinedCategories = Array.from(new Set([...catNames, ...productCats]));
                setAllCategories(combinedCategories);

                setReviews(reviewRes.data.data || []);
            } catch (error) {
                console.error("Error fetching merchant detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmitReview = async () => {
        if (newRating === 0 || !newComment.trim()) return;
        setIsSubmitting(true);
        try {
            await MerchantService.addReview(id, {
                rating: newRating,
                review: newComment
            });
            const reviewRes = await MerchantService.getReviews(id);
            setReviews(reviewRes.data.data || []);
            setNewRating(0);
            setNewComment('');
        } catch (error) {
            console.error("Review failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    {/* Return Not Found only if loading is complete and no merchant data */}
    if (!loading && !merchant) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white px-8 text-center">
                <ShieldAlert size={48} className="text-zinc-800 mb-6" />
                <h2 className="text-xl font-black uppercase tracking-widest italic mb-2">Merchant Unavailable</h2>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-8">This store might be closed or doesn't exist.</p>
                <button onClick={() => navigate('/')} className="bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl italic active:scale-95 transition-all">Return to Plaza</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white selection:bg-brand-500/30 relative">
            
            {/* Hero Section */}
            <div className="h-72 relative bg-zinc-900/50">
                {loading && !merchant ? (
                    <div className="w-full h-full bg-zinc-800 animate-pulse" />
                ) : (
                    <img
                        src={merchant?.image || 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42339'}
                        alt={merchant?.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />

                <header className="absolute top-0 left-0 right-0 p-6 pt-14 flex items-center justify-between z-50">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-white premium-shadow"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </motion.button>
                    <div className="flex gap-2.5">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-white premium-shadow"
                        >
                            <Heart size={20} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/profile')}
                            className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-white premium-shadow"
                        >
                            <User size={20} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={openSidebar}
                            className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-white premium-shadow"
                        >
                            <div className="flex flex-col gap-1 items-end pr-0.5">
                                <div className="w-4 h-0.5 bg-white rounded-full" />
                                <div className="w-2.5 h-0.5 bg-white rounded-full" />
                                <div className="w-3.5 h-0.5 bg-brand-500 rounded-full" />
                            </div>
                        </motion.button>
                    </div>
                </header>

                <div className="absolute bottom-10 left-8 right-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-brand-500 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xl shadow-brand-500/30">
                            <Star size={11} className="fill-white" />
                            <span className="text-[11px] font-black italic">{merchant?.rating || '4.9'}</span>
                        </div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] italic">Premium Partner</span>
                    </div>
                    {loading && !merchant ? (
                         <div className="w-48 h-8 bg-zinc-800 rounded animate-pulse" />
                    ) : (
                         <h1 className="text-3xl font-black tracking-tighter leading-none mb-3 italic uppercase">{merchant?.name}</h1>
                    )}
                    <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-brand-500" />
                        {loading && !merchant ? (
                             <div className="w-24 h-4 bg-zinc-800 rounded animate-pulse" />
                        ) : (
                             <p className="text-[10px] text-white/50 font-black uppercase tracking-widest italic">{merchant?.city?.name || 'Local Marketplace'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Menu & Feedback Tabs */}
            <div className="sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-3xl z-40 border-b border-white/5 flex gap-10 px-8 py-5 overflow-x-auto no-scrollbar shadow-2xl">
                {mainCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] font-black whitespace-nowrap uppercase tracking-[0.3em] transition-all relative italic ${activeCategory === cat ? 'text-brand-500' : 'text-gray-600'}`}
                    >
                        {cat}
                        {activeCategory === cat && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                            />
                        )}
                    </button>
                ))}
                
                <button
                    onClick={() => setActiveCategory('FEEDBACK')}
                    className={`text-[10px] font-black whitespace-nowrap uppercase tracking-[0.3em] transition-all relative italic ${activeCategory === 'FEEDBACK' ? 'text-brand-500' : 'text-gray-600'}`}
                >
                    FEEDBACK
                    {activeCategory === 'FEEDBACK' && (
                        <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                        />
                    )}
                </button>
            </div>

            {/* Content View */}
            <motion.div
                key={activeCategory || 'loading'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
            >
                {activeCategory === 'FEEDBACK' ? (
                    <div className="p-4 pb-32">
                        <div className="flex flex-col gap-6">
                            <header>
                                <h2 className="text-xl font-black tracking-tighter mb-1 uppercase italic text-white">Community Feed</h2>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] italic text-zinc-500">Voices from our marketplace</p>
                            </header>

                            <div className="bg-white/[0.03] p-5 rounded-[28px] border border-white/10">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] italic">Rate your experience</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} onClick={() => setNewRating(star)} className="transition-all">
                                                    <Star size={24} className={newRating >= star ? 'text-brand-500 fill-brand-500' : 'text-white/[0.05]'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Share your experience..."
                                        className="bg-white/[0.03] border border-white/5 rounded-[20px] p-4 text-[11px] font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-brand-500/30 min-h-[90px] resize-none italic"
                                    />
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={isSubmitting || newRating === 0 || !newComment.trim()}
                                        className={`w-full py-4 rounded-[20px] font-black text-[9px] uppercase tracking-[0.3em] italic ${isSubmitting || newRating === 0 || !newComment.trim() ? 'bg-white/5 text-white/10' : 'bg-brand-500 text-white'}`}
                                    >
                                        {isSubmitting ? 'Uploading...' : 'Post Feedback'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="bg-white/[0.03] p-5 rounded-[24px] border border-white/5 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 text-xs font-black italic border border-brand-500/20">{review.user?.name?.[0] || 'U'}</div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight uppercase italic">{review.user?.name || 'Guest'}</p>
                                                    <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic">{review.created_at}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < review.rating ? 'text-brand-500 fill-brand-500' : 'text-white/5'} />)}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-white/60 font-bold italic leading-relaxed">"{review.review}"</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && <p className="text-center py-20 text-[10px] text-white/10 uppercase tracking-widest italic">No feedback yet</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 flex flex-col gap-12 pb-32">
                        {loading && products.length === 0 ? (
                            Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                        ) : activeCategory === 'FULL MENU' ? (
                            (() => {
                                const hasAnyProducts = allCategories.some(cat => products.some(p => (p.category?.name || 'Menu') === cat));
                                if (!hasAnyProducts) {
                                    return (
                                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
                                            <ShieldAlert size={32} className="text-zinc-600 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Product not present</p>
                                        </div>
                                    );
                                }
                                return allCategories.map(cat => {
                                    const catProducts = products.filter(p => (p.category?.name || 'Menu') === cat);
                                    if (catProducts.length === 0) return null;
                                    
                                    return (
                                        <div key={cat} className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-[1px] flex-1 bg-white/5"></div>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] italic text-brand-500 text-shadow-glow">{cat}</h4>
                                                <div className="h-[1px] flex-1 bg-white/5"></div>
                                            </div>
                                            <div className="space-y-12">
                                                {catProducts.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => navigate(`/product/${product.id}`)}
                                                        className="flex gap-8 group cursor-pointer"
                                                    >
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <div className="flex items-center gap-2 mb-2.5">
                                                                <div className={`w-2.5 h-2.5 rounded-sm border-2 ${product.is_veg ? 'border-emerald-500' : 'border-rose-500'} p-[1px]`}>
                                                                    <div className={`w-full h-full rounded-full ${product.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                </div>
                                                                <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest italic">Selection</span>
                                                            </div>
                                                            <h3 className="font-black text-lg tracking-tight uppercase italic mb-2">{product.name}</h3>
                                                            <p className="text-[11px] text-white/30 font-bold leading-relaxed line-clamp-2 italic mb-4">{product.description}</p>
                                                            <p className="text-xl font-black italic">
                                                                {product.has_variants 
                                                                    ? `₹${Math.min(...(product.variants?.map(v => parseFloat(v.price)) || [0])).toFixed(0)}+` 
                                                                    : `₹${parseFloat(product.price).toFixed(0)}`
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="relative w-28 h-28 flex-shrink-0">
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-[32px] border border-white/5" />
                                                            {(() => {
                                                                const productItems = cartItems.filter(item => item.id === product.id);
                                                                const totalQty = productItems.reduce((acc, item) => acc + item.quantity, 0);
                                                                if (totalQty > 0) {
                                                                    return (
                                                                        <motion.div 
                                                                            initial={{ scale: 0, rotate: -20 }}
                                                                            animate={{ scale: 1, rotate: 0 }}
                                                                            className="absolute -top-2 -right-2 w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-[10px] font-black italic shadow-[0_0_20px_rgba(249,115,22,0.4)] border-2 border-[#0A0A0A] z-10"
                                                                        >
                                                                            {totalQty}
                                                                        </motion.div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                                                                {(() => {
                                                                    const productItems = cartItems.filter(item => item.id === product.id);
                                                                    const totalQty = productItems.reduce((acc, item) => acc + item.quantity, 0);

                                                                    if (totalQty > 0 && !product.has_variants) {
                                                                        const inCart = productItems[0];
                                                                        return (
                                                                            <motion.div 
                                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                className="flex items-center gap-4 bg-white text-black px-4 py-2.5 rounded-2xl shadow-3xl border border-white/10"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <button 
                                                                                    onClick={() => updateQuantity(inCart.cart_item_id, inCart.quantity - 1)}
                                                                                    className="hover:text-brand-500 active:scale-75 transition-all"
                                                                                >
                                                                                    <Minus size={14} strokeWidth={4} />
                                                                                </button>
                                                                                <span className="text-[11px] font-black italic min-w-[12px] text-center">{inCart.quantity}</span>
                                                                                <button 
                                                                                    onClick={() => updateQuantity(inCart.cart_item_id, inCart.quantity + 1)}
                                                                                    className="hover:text-brand-500 active:scale-75 transition-all"
                                                                                >
                                                                                    <Plus size={14} strokeWidth={4} />
                                                                                </button>
                                                                            </motion.div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <motion.button 
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={(e) => { 
                                                                                e.stopPropagation(); 
                                                                                if (product.has_variants) {
                                                                                    setSelectedProduct(product);
                                                                                    setShowVariantModal(true);
                                                                                } else {
                                                                                    addToCart(product, 1, null, merchant); 
                                                                                }
                                                                            }}
                                                                            className="bg-white text-black font-black px-6 py-2.5 rounded-2xl shadow-3xl text-[9px] uppercase tracking-widest italic border border-white/10 flex items-center gap-1"
                                                                        >
                                                                            {product.has_variants ? (
                                                                                <>{totalQty > 0 ? 'CUSTOMIZE' : 'ADD'} <Plus size={14} strokeWidth={4} className="ml-1" /></>
                                                                            ) : (
                                                                                <><Plus size={14} strokeWidth={4} className="mr-0.5" /> ADD</>
                                                                            )}
                                                                        </motion.button>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()
                        ) : (
                            (() => {
                                const filtered = products.filter(p => {
                                    if (activeCategory === 'VEG') return p.is_veg;
                                    if (activeCategory === 'NON-VEG') return !p.is_veg;
                                    return true;
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
                                            <ShieldAlert size={32} className="text-zinc-600 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Product not present</p>
                                        </div>
                                    );
                                }

                                return filtered.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        className="flex gap-8 group cursor-pointer"
                                    >
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-2.5">
                                                <div className={`w-2.5 h-2.5 rounded-sm border-2 ${product.is_veg ? 'border-emerald-500' : 'border-rose-500'} p-[1px]`}>
                                                    <div className={`w-full h-full rounded-full ${product.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                </div>
                                                <span className="text-[8px] font-black text-brand-500 uppercase tracking-widest italic">Selection</span>
                                            </div>
                                            <h3 className="font-black text-lg tracking-tight uppercase italic mb-2">{product.name}</h3>
                                            <p className="text-[11px] text-white/30 font-bold leading-relaxed line-clamp-2 italic mb-4">{product.description}</p>
                                            <p className="text-xl font-black italic">
                                                {product.has_variants 
                                                    ? `₹${Math.min(...(product.variants?.map(v => parseFloat(v.price)) || [0])).toFixed(0)}+` 
                                                    : `₹${parseFloat(product.price).toFixed(0)}`
                                                }
                                            </p>
                                        </div>
                                        <div className="relative w-28 h-28 flex-shrink-0">
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-[32px] border border-white/5" />
                                            <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                                                {(() => {
                                                    const inCart = cartItems.find(item => item.id === product.id);
                                                    if (inCart && !product.has_variants) {
                                                        return (
                                                            <motion.div 
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="flex items-center gap-4 bg-white text-black px-4 py-2.5 rounded-2xl shadow-3xl border border-white/10"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button 
                                                                    onClick={() => updateQuantity(inCart.cart_item_id, inCart.quantity - 1)}
                                                                    className="hover:text-brand-500 active:scale-75 transition-all"
                                                                >
                                                                    <Minus size={14} strokeWidth={4} />
                                                                </button>
                                                                <span className="text-[11px] font-black italic min-w-[12px] text-center">{inCart.quantity}</span>
                                                                <button 
                                                                    onClick={() => updateQuantity(inCart.cart_item_id, inCart.quantity + 1)}
                                                                    className="hover:text-brand-500 active:scale-75 transition-all"
                                                                >
                                                                    <Plus size={14} strokeWidth={4} />
                                                                </button>
                                                            </motion.div>
                                                        );
                                                    }
                                                    return (
                                                        <motion.button 
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (product.has_variants) {
                                                                    setSelectedProduct(product);
                                                                    setShowVariantModal(true);
                                                                } else {
                                                                    addToCart(product, 1, null, merchant); 
                                                                }
                                                            }}
                                                            className="bg-white text-black font-black px-6 py-2.5 rounded-2xl shadow-3xl text-[9px] uppercase tracking-widest italic border border-white/10 flex items-center gap-1"
                                                        >
                                                            {product.has_variants ? (
                                                                <>ADD <Plus size={14} strokeWidth={4} className="ml-1" /></>
                                                            ) : (
                                                                <><Plus size={14} strokeWidth={4} className="mr-0.5" /> ADD</>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()
                        )}
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showVariantModal && selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowVariantModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full bg-zinc-900 border-t border-white/10 rounded-t-[40px] p-8 pb-12 max-h-[70vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-xl font-black italic tracking-tight uppercase mb-2">{selectedProduct.name}</h3>
                                    <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] italic">Select Option</p>
                                </div>
                                <button
                                    onClick={() => setShowVariantModal(false)}
                                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedProduct.variants?.map((v, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            addToCart(selectedProduct, 1, v, merchant);
                                            setShowVariantModal(false);
                                        }}
                                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/30 rounded-3xl transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[13px] font-black italic uppercase text-white/90 group-hover:text-brand-500">{v.quantity}</span>
                                            <span className="text-[10px] font-bold italic text-white/30 uppercase tracking-widest group-hover:text-brand-500/50">Unit / Scale</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-black italic">₹{parseFloat(v.price).toFixed(0)}</span>
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/20 group-hover:bg-brand-500 group-hover:text-black transition-all">
                                                <Plus size={16} strokeWidth={4} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MerchantDetail;

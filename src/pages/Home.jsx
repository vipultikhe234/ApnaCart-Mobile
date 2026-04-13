import MobileLoader from '../components/MobileLoader';
import { ProductCardSkeleton, MerchantCardSkeleton, CategorySkeleton } from '../components/Skeleton';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService, addressService, MerchantService, locationService, landingService } from '../services/api';
import {
    MapPin,
    Search,
    ChevronDown,
    Star,
    Clock,
    Plus,
    Minus,
    User,
    Utensils,
    ShoppingBag,
    X,
    Filter,
    Menu,
    ChevronRight,
    ArrowRight,
    SearchX,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useSidebar } from '../context/SidebarContext';

// Branding Fallback Image
const BRANDING_BANNER = "/branding_banner.png"; 

const Home = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [Merchants, setMerchants] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedCity, setSelectedCity] = useState(() => {
        try {
            const saved = localStorage.getItem('selectedCity');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }); 
    const [showCityModal, setShowCityModal] = useState(false);
    const [popularProducts, setPopularProducts] = useState([]);
    const [curatedProducts, setCuratedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    // Landing Banners State
    const [banners, setBanners] = useState([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const bannerScrollRef = useRef(null);

    useEffect(() => {
        if (!selectedCity && !loading) {
            setShowCityModal(true);
        }
    }, [selectedCity, loading]);

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [catRes, cityRes, bannerRes] = await Promise.all([
                    MerchantService.getMerchantCategories(),
                    locationService.getCities({ has_merchants: true }),
                    landingService.getOffers(selectedCity ? { city_id: selectedCity.id } : {})
                ]);
                setCategories(catRes.data.data || []);
                setAllCities(cityRes.data || []);
                
                const dynamicBanners = bannerRes.data || [];
                const brandingBanners = [
                    {
                        id: 'branding-1',
                        title: 'ApnaCart Highlights',
                        subtitle: 'Fresh & Fast Essentials',
                        image: '/banners/branding_1.jpg',
                        link: '/',
                        type: 'branding',
                        is_hardcoded: true
                    },
                    {
                        id: 'branding-2',
                        title: 'Premium Quality',
                        subtitle: 'Delivered Instantly',
                        image: '/banners/branding_2.jpg',
                        link: '/',
                        type: 'branding',
                        is_hardcoded: true
                    }
                ];
                setBanners([...dynamicBanners, ...brandingBanners]);
            } catch (e) { console.error("Base fetch error:", e); }
        };
        fetchBaseData();
    }, [selectedCity]);

    // Auto-scroll Banners every 2 seconds
    useEffect(() => {
        if (banners.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [banners]);

    // Scroll effect for banners
    useEffect(() => {
        if (bannerScrollRef.current) {
            const container = bannerScrollRef.current;
            const scrollAmount = currentBannerIndex * (container.clientWidth + 16); 
            container.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, [currentBannerIndex]);

    useEffect(() => {
        const fetchLocalData = async () => {
            if (Merchants.length === 0) setLoading(true);
            else setIsRefreshing(true);

            try {
                const params = { city_id: selectedCity?.id };
                const [prodRes, restRes, curatedRes] = await Promise.all([
                    productService.getAll(params),
                    MerchantService.getAll(params),
                    productService.getCurated(params)
                ]);

                setPopularProducts(prodRes.data.data || []);
                setMerchants(restRes.data.data || []);
                setCuratedProducts(curatedRes.data.data || []);
            } catch (error) {
                console.error("Local fetch error:", error);
            } finally {
                setLoading(false);
                setIsRefreshing(false);
            }
        };
        fetchLocalData();
    }, [selectedCity]); 

    const { addToCart, cartItems, updateQuantity } = useCart();
    const { openSidebar } = useSidebar();

    const filteredMerchants = selectedCity
        ? Merchants.filter(r => r.city_id === selectedCity.id)
        : Merchants;

    const filteredProducts = activeCategory === 'All'
        ? popularProducts
        : popularProducts.filter(p => p.category?.name === activeCategory);

    const fadeUp = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // Banner Image Resolver
    const getBannerImage = (banner) => {
        if (banner.image) return banner.image;
        
        // Premium Fallbacks
        if (banner.id?.toString().includes('branding-1')) return "/banners/branding_1.jpg";
        if (banner.id?.toString().includes('branding-2')) return "/banners/branding_2.jpg";

        // Category-based dynamic fallbacks
        const categoryName = banner.merchant?.merchant_category?.name?.toLowerCase() || '';

        if (categoryName.includes('pharmacy')) {
            return "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=800";
        }
        if (categoryName.includes('grocery') || categoryName.includes('fruit') || categoryName.includes('vegetable')) {
            return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";
        }
        if (categoryName.includes('electronic') || categoryName.includes('electric')) {
            return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800";
        }
        if (categoryName.includes('restaurant')) {
            return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800";
        }

        // Default Fallbacks by Type
        if (banner.link && banner.link.includes('/coupons')) {
            return "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800";
        }

        return "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800";
    };

    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] pb-32">
            {/* Ultra-Compact Premium Glass Header */}
            <div className="sticky top-0 z-[100] px-4 pt-4 pb-2 bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-3xl">
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900/80 rounded-[28px] p-2 pl-3 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl shadow-black/5 dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={openSidebar}
                            className="w-10 h-10 bg-zinc-950 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-zinc-950 active:scale-95 transition-transform"
                        >
                            <Menu size={18} strokeWidth={2.5} />
                        </motion.button>

                        <button
                            onClick={() => setShowCityModal(true)}
                            className="flex flex-col text-left group flex-1"
                        >
                            <div className="flex items-center gap-1.5 mb-0.5 min-h-[10px]">
                                {isRefreshing ? (
                                    <div className="w-2.5 h-2.5">
                                        <MobileLoader size={10} />
                                    </div>
                                ) : (
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                )}
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic leading-none">
                                    {isRefreshing ? 'Refreshing...' : 'Live Zone'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">
                                    {selectedCity?.name || 'Local Areas'}
                                </span>
                                <ChevronDown size={10} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </button>
                    </div>

                    <Link to="/profile" className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white border border-transparent dark:border-zinc-700/50 active:scale-95 transition-transform overflow-hidden">
                        {user?.name ? (
                            <span className="font-black text-xs italic">{user.name[0].toUpperCase()}</span>
                        ) : (
                            <User size={18} strokeWidth={2} />
                        )}
                    </Link>
                </div>
            </div>

            <div className="px-6 pt-2 pb-2">
                <h1 className="text-lg font-black text-zinc-800 dark:text-white uppercase tracking-tight italic flex items-center gap-2">
                    {greeting}, <span className="text-emerald-500">{user?.name ? user.name.split(' ')[0] : 'ApnaCart'}</span>
                </h1>
            </div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="px-6 mb-8">
                <div
                    onClick={() => navigate('/search')}
                    className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 active:scale-[0.98] transition-transform cursor-pointer"
                >
                    <Search size={20} className="text-zinc-400" />
                    <span className="text-zinc-400 font-medium text-sm">Search for dishes, Merchants...</span>
                </div>
            </motion.div>

            {/* Dynamic Real-Time Banners */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="px-6 mb-12"
            >
                <div 
                    ref={bannerScrollRef}
                    className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 scroll-smooth"
                >
                    {banners.length > 0 ? (
                        banners.map((banner, index) => (
                            <motion.div
                                key={banner.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(banner.link || '/')}
                                className={`min-w-[calc(100vw-48px)] h-[210px] rounded-3xl overflow-hidden relative snap-center group shadow-2xl shadow-emerald-500/5 dark:shadow-none border border-zinc-100 dark:border-zinc-800 transition-all duration-500`}
                            >
                                <img
                                    src={getBannerImage(banner)}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                />
                                
                                {banner.is_hardcoded ? (
                                    /* Clean Visual for Baked-in Branding Images */
                                    <div className="absolute inset-0 bg-black/5" />
                                ) : (
                                    /* Dynamic Offer Style */
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/40 to-transparent flex flex-col justify-end p-8">
                                        <div className="flex flex-col gap-1.5 mb-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">{banner.type === 'offer' ? 'Live Offer' : 'Exclusive Reward'}</span>
                                                {banner.merchant && (
                                                    <span className="text-[8px] font-black uppercase text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-sm">at {banner.merchant.name}</span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-black leading-none tracking-tighter text-white uppercase drop-shadow-2xl">{banner.title}</h2>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest line-clamp-1">{banner.subtitle}</p>
                                        </div>
                                        
                                        <button className="bg-emerald-500 text-white text-[10px] font-black px-8 py-3.5 rounded-2xl w-fit uppercase tracking-widest shadow-xl shadow-emerald-500/20 transform active:scale-95 transition-all">
                                            Claim {banner.type === 'offer' ? 'Offer' : 'Reward'}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        /* Default Branding Scroller (If DB is empty) */
                        <>
                            {[1, 2].map((num) => (
                                <motion.div
                                    key={`fallback-${num}`}
                                    whileTap={{ scale: 0.98 }}
                                    className="min-w-[calc(100vw-48px)] h-[210px] rounded-3xl overflow-hidden relative snap-center group shadow-2xl"
                                >
                                    <img
                                        src={`/banners/branding_${num}.jpg`}
                                        alt="Branding"
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>
                
                {/* Banner Indicators */}
                {banners.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                        {banners.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-300 ${currentBannerIndex === i ? 'w-6 bg-emerald-500' : 'w-2 bg-zinc-200 dark:bg-zinc-800'}`} 
                            />
                        ))}
                    </div>
                )}
            </motion.section>


            {/* Bento Grid Categories */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} className="px-6 mb-12">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter leading-none text-zinc-900 dark:text-white uppercase italic">Explore</h2>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 ml-0.5">By Category</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat, idx) => {
                        const isHero = idx === 0;
                        const colSpan = isHero ? 'span 2' : 'span 1';
                        const rowSpan = isHero ? 'span 2' : 'span 1';

                        const getDynamicCategoryImage = (name) => {
                            const q = name.toLowerCase();
                            const library = { grocery: '1542838132-92c53300491e', restaurant: '1517248135467-4c7edcad34c4', food: '1504674900247-0877df9cc836', fruit: '1619566636858-adf3ef46400b', vegetable: '1566385101042-1a0aa0c1268c', meat: '1607623814075-e51df1bdc82f', bakery: '1555507036-ab1f40388081', pharmacy: '1471864190281-a93a3070b6de' };
                            const foundKey = Object.keys(library).find(k => q.includes(k));
                            const photoId = foundKey ? library[foundKey] : '1504674900247-0877df9cc836';
                            return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=600&h=600`;
                        };

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => navigate(`/all-merchants?category_id=${cat.id}${selectedCity ? `&city_id=${selectedCity.id}` : ''}`)}
                                className="relative rounded-2xl overflow-hidden group cursor-pointer border border-zinc-100 dark:border-zinc-800 shadow-sm"
                                style={{ gridColumn: colSpan, gridRow: rowSpan, height: isHero ? '152px' : '72px' }}
                            >
                                <img
                                    src={cat.image || getDynamicCategoryImage(cat.name)}
                                    alt={cat.name}
                                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3.5">
                                    <span className={`font-black text-white tracking-tight uppercase leading-none ${isHero ? 'text-lg' : 'text-[10px]'}`}>
                                        {cat.name}
                                    </span>
                                    {isHero && <p className="text-[8px] text-white/50 font-bold mt-1.5 uppercase tracking-widest leading-none">Fresh & Fast</p>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            {/* Merchants Section */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
                <div className="px-6 flex justify-between items-baseline mb-5">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Top Merchants</h2>
                    <Link
                        to={selectedCity ? `/all-merchants?city_id=${selectedCity.id}` : "/all-merchants"}
                        className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform group"
                    >
                        Explore All <ChevronDown size={12} className="-rotate-90 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 px-6 mb-8">
                    {loading && filteredMerchants.length === 0 ? (
                        Array(3).fill(0).map((_, i) => <MerchantCardSkeleton key={i} />)
                    ) : filteredMerchants.length === 0 ? (
                        <div className="col-span-3 py-10 flex flex-col items-center justify-center opacity-40 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 border-dashed">
                            <Utensils size={40} className="mb-3 text-zinc-300" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No merchants in this area yet</p>
                        </div>
                    ) : (
                        filteredMerchants.slice(0, 3).map(rest => (
                            <Link
                                key={rest.id}
                                to={`/Merchant/${rest.id}`}
                                className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm group"
                            >
                                <div className="aspect-square relative">
                                    <img src={rest.image || 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42339'} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {!rest.is_open && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-white text-[8px] font-black uppercase tracking-[0.1em] border border-white/40 px-1.5 py-1 rounded-md">Closed</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2.5">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <h3 className="font-bold text-zinc-900 dark:text-white tracking-tight text-[10px] uppercase truncate flex-1">{rest.name}</h3>
                                        <div className="flex items-center gap-0.5 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.5 rounded-md border border-zinc-100 dark:border-zinc-700">
                                            <Star size={7} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-[9px] font-bold text-zinc-900 dark:text-white">{rest.rating || '0.0'}</span>
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest truncate">{rest.address}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Curated Discovery */}
            <div className="px-6 mb-10">
                <div className="flex justify-between items-baseline mb-5">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">Top Discoveries</h2>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-2 py-1 rounded-md">Priority Picks</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                    <AnimatePresence mode="popLayout">
                        {loading && curatedProducts.length === 0 ? (
                            Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                        ) : (
                            curatedProducts.slice(0, 10).map((p, idx) => (
                                <motion.div key={`curated-${p.id}`} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}>
                                    <div className="block bg-white dark:bg-zinc-900/60 rounded-[36px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm relative overflow-visible group">
                                        <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-[32px] overflow-hidden relative m-1.5 mb-0">
                                            <img 
                                                src={p.image_url} 
                                                alt={p.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                            <div className="absolute top-3 inset-x-3 flex justify-between items-start">
                                                {p.discount_percentage > 0 && (
                                                    <div className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-red-500/20">
                                                        -{p.discount_percentage}%
                                                    </div>
                                                )}
                                                <div className="bg-white/90 dark:bg-zinc-900/90 px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-md shadow-sm">
                                                    <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[9px] font-black text-zinc-900 dark:text-white">{p.avg_rating}</span>
                                                </div>
                                            </div>

                                            {/* Floating Action Button / Selector */}
                                            <div className="absolute inset-x-0 -bottom-3 flex justify-center z-10">
                                                {(() => {
                                                    const productItems = cartItems.filter(item => item.id == p.id);
                                                    const totalQty = productItems.reduce((acc, item) => acc + item.quantity, 0);
                                                    
                                                    if (totalQty > 0) {
                                                        const isSimple = !p.has_variants;
                                                        const firstItem = productItems[0];

                                                        return (
                                                            <motion.div 
                                                                initial={{ scale: 0.8 }} 
                                                                animate={{ scale: 1 }} 
                                                                className="flex items-center bg-white dark:bg-zinc-950 rounded-2xl p-1 shadow-2xl border border-zinc-200 dark:border-zinc-800"
                                                            >
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isSimple || productItems.length === 1) {
                                                                            updateQuantity(firstItem.cart_item_id, firstItem.quantity - 1);
                                                                        } else {
                                                                            setSelectedProduct(p);
                                                                            setShowVariantModal(true);
                                                                        }
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white flex items-center justify-center active:scale-90 transition-all"
                                                                >
                                                                    <Minus size={14} strokeWidth={3} />
                                                                </button>
                                                                <div className="flex flex-col items-center px-4 min-w-[36px]">
                                                                    <span className="text-xs font-black text-zinc-900 dark:text-white italic leading-none">{totalQty}</span>
                                                                    {!isSimple && <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter mt-0.5">Custom</span>}
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (isSimple) {
                                                                            updateQuantity(firstItem.cart_item_id, firstItem.quantity + 1);
                                                                        } else {
                                                                            setSelectedProduct(p);
                                                                            setShowVariantModal(true);
                                                                        }
                                                                    }}
                                                                    className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center active:scale-90 transition-all font-bold"
                                                                >
                                                                    <Plus size={14} strokeWidth={3} />
                                                                </button>
                                                            </motion.div>
                                                        );
                                                    }

                                                    return (
                                                        <motion.button 
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (p.has_variants) {
                                                                    setSelectedProduct(p);
                                                                    setShowVariantModal(true);
                                                                } else {
                                                                    addToCart(p); 
                                                                }
                                                            }} 
                                                            className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white font-black px-6 py-2.5 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider italic flex items-center gap-2"
                                                        >
                                                            ADD <Plus size={14} strokeWidth={4} className="text-emerald-500" />
                                                        </motion.button>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="px-5 pt-6 pb-5">
                                            <h4 className="text-[13px] font-black text-zinc-900 dark:text-white tracking-tight uppercase italic truncate mb-1">{p.name}</h4>
                                            <p className="text-[10px] text-zinc-400 font-bold truncate mb-3 italic opacity-60">{p.description || "Fresh & Premium Quality"}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-lg font-black text-zinc-950 dark:text-white italic tracking-tighter">₹{p.has_variants ? p.starting_price : (p.discount_price || p.price)}</span>
                                                {p.discount_percentage > 0 && <span className="text-[10px] text-zinc-400 line-through font-bold">₹{p.price}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Variant Selection Modal */}
            <AnimatePresence>
                {showVariantModal && selectedProduct && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowVariantModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-zinc-900 w-full rounded-t-[48px] p-8 pb-12 shadow-2xl relative z-[10000] max-h-[70vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-xl font-black italic tracking-tight uppercase mb-2 text-zinc-900 dark:text-white">{selectedProduct.name}</h3>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Select Option</p>
                                </div>
                                <button
                                    onClick={() => setShowVariantModal(false)}
                                    className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedProduct.variants?.map((v, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            addToCart(selectedProduct, 1, v);
                                            setShowVariantModal(false);
                                        }}
                                        className="w-full flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-500/10 border border-zinc-100 dark:border-zinc-700 hover:border-emerald-500/30 rounded-3xl transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-[13px] font-black italic uppercase text-zinc-900 dark:text-white group-hover:text-emerald-500">{v.quantity}</span>
                                            <span className="text-[10px] font-bold italic text-zinc-400 uppercase tracking-widest group-hover:text-emerald-500/50">Unit / Scale</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-black italic text-zinc-900 dark:text-white">₹{parseFloat(v.price).toFixed(0)}</span>
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                <Plus size={16} strokeWidth={4} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* City Modal */}
            <AnimatePresence>
                {showCityModal && (
                    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCityModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
                        <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[48px] sm:rounded-[48px] overflow-hidden shadow-2xl relative z-10 p-8 pb-12">
                            <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic mb-8">Select Area</h3>
                            <div className="space-y-3">
                                {allCities.map((city) => (
                                    <button
                                        key={city.id}
                                        onClick={() => { setSelectedCity(city); localStorage.setItem('selectedCity', JSON.stringify(city)); setShowCityModal(false); }}
                                        className={`w-full p-6 bg-zinc-50 dark:bg-zinc-800 rounded-[32px] text-left font-black text-xs flex justify-between items-center ${selectedCity?.id === city.id ? 'border-2 border-emerald-500' : 'border-2 border-transparent'}`}
                                    >
                                        <span className="uppercase">{city.name}</span>
                                        {selectedCity?.id === city.id && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService, MerchantService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search as SearchIcon,
    ChevronLeft,
    X,
    Star,
    Clock,
    ArrowRight,
    TrendingUp
} from 'lucide-react';

const Search = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const [filteredMerchants, setFilteredMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity] = useState(() => {
        try {
            const saved = localStorage.getItem('selectedCity');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // 1. Fetch valid merchant IDs for this city
                const merchantRes = await MerchantService.getAll(selectedCity ? { city_id: selectedCity.id } : {});
                const merchantsInCity = merchantRes.data.data || [];
                setMerchants(merchantsInCity);
                const validMerchantIds = new Set(merchantsInCity.map(m => m.id));

                // 2. Fetch products
                const response = await productService.getAll(selectedCity ? { city_id: selectedCity.id } : {});
                const allData = response.data.data || [];
                
                // 3. Filter products by the valid merchant IDs
                const cityFilteredData = selectedCity 
                    ? allData.filter(p => validMerchantIds.has(p.merchant_id))
                    : allData;

                setProducts(cityFilteredData);

                const urlParams = new URLSearchParams(window.location.search);
                const q = urlParams.get('q');
                if (q) {
                    setQuery(q);
                } else {
                    setFilteredProducts(cityFilteredData);
                    setFilteredMerchants(merchantsInCity);
                }
            } catch (error) {
                console.error("Search fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [selectedCity]);

    useEffect(() => {
        const lowerQuery = query.toLowerCase();
        if (!lowerQuery) {
            setFilteredProducts(products);
            setFilteredMerchants(merchants);
            return;
        }

        // 1. First, find Products that match directly
        const productsMatchingDirectly = products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery) ||
            p.category?.name?.toLowerCase().includes(lowerQuery)
        );

        // 2. Find Merchants that match directly
        const merchantsMatchingDirectly = merchants.filter(m =>
            m.name.toLowerCase().includes(lowerQuery) ||
            m.address?.toLowerCase().includes(lowerQuery)
        );

        // 3. Bidirectional logic:
        // A. Get IDs of merchants who have matching products
        const merchantIdsFromProducts = new Set(productsMatchingDirectly.map(p => p.merchant_id));
        
        // B. Get IDs of products whose merchants match directly
        const merchantIdsFromDirectMatch = new Set(merchantsMatchingDirectly.map(m => m.id));

        // 4. Final Merchants: Direct Match OR they sell a matching product
        const finalMerchants = merchants.filter(m => 
            merchantsMatchingDirectly.some(dm => dm.id === m.id) || 
            merchantIdsFromProducts.has(m.id)
        );

        // 5. Final Products: Direct Match OR their merchant matched directly
        const finalProducts = products.filter(p => 
            productsMatchingDirectly.some(dp => dp.id === p.id) || 
            merchantIdsFromDirectMatch.has(p.merchant_id)
        );

        setFilteredMerchants(finalMerchants);
        setFilteredProducts(finalProducts);
    }, [query, products, merchants]);

    return (
        <div className="bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen pb-32 font-sans overflow-x-hidden">
            {/* Ultra-Compact Premium Glass Header */}
            <div className="sticky top-0 z-[100] px-4 pt-4 pb-2 bg-zinc-50/60 dark:bg-[#0A0A0A]/60 backdrop-blur-3xl">
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/80 rounded-[28px] p-2 pl-3 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl shadow-black/5 dark:shadow-none">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-zinc-950 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-zinc-950 active:scale-95 transition-transform shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                            <SearchIcon size={16} />
                        </div>
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search dishes, merchants..."
                            className="w-full bg-transparent py-2.5 pl-10 pr-10 text-xs font-black text-zinc-900 dark:text-white outline-none placeholder:text-zinc-500 uppercase tracking-widest italic"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
            {!query && (
                <div className="px-6 mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-zinc-400" />
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trending</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Pizza', 'Burger', 'Healthy', 'Salad', 'Coffee', 'Dessert'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setQuery(tag)}
                                className="px-4 py-2 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-95 transition-transform"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Merchant Horizontal Slider */}
            {filteredMerchants.length > 0 && (
                <div className="mb-10">
                    <div className="px-6 flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic leading-none">Local Partners</h2>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{filteredMerchants.length} matches near you</p>
                        </div>
                        <Link 
                            to={selectedCity ? `/all-merchants?city_id=${selectedCity.id}` : "/all-merchants"}
                            className="bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-xl active:scale-95 transition-transform"
                        >
                            <ArrowRight size={14} className="text-zinc-600 dark:text-zinc-300" />
                        </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-6 snap-x snap-mandatory">
                        {filteredMerchants.map(m => (
                            <motion.div
                                key={m.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(`/Merchant/${m.id}`)}
                                className="min-w-[105px] max-w-[110px] bg-white dark:bg-zinc-900 rounded-[2rem] p-2 border border-zinc-100 dark:border-zinc-800 shadow-sm snap-center"
                            >
                                <div className="aspect-square rounded-[1.6rem] overflow-hidden mb-2.5 border border-zinc-100 dark:border-zinc-800">
                                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="px-0.5 text-center">
                                    <h4 className="text-[10px] font-black text-zinc-900 dark:text-white uppercase italic truncate mb-1">{m.name}</h4>
                                    <div className="flex items-center justify-center gap-0.5 opacity-60">
                                        <Star size={7} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">{m.rating || '4.5'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <div className="px-6">
                <div className="flex justify-between items-baseline mb-6">
                    <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">
                        {query ? 'Product Results' : 'Recommended for you'}
                    </h2>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {filteredProducts.length} items
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex gap-4 p-4 bg-white dark:bg-zinc-900 rounded-3xl animate-pulse items-center">
                                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl shrink-0"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                    <div className="h-2 w-1/3 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.length === 0 && filteredMerchants.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm"
                                >
                                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <X size={32} className="text-zinc-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 uppercase italic">No Match Found</h3>
                                    <p className="text-xs text-zinc-500 mb-8 max-w-[200px] mx-auto uppercase font-bold tracking-widest">We couldn't find items or merchants matching your query.</p>
                                    <button onClick={() => setQuery('')} className="text-xs font-black text-zinc-900 dark:text-white underline uppercase tracking-[0.2em] italic">Clear Search</button>
                                </motion.div>
                            ) : (
                                filteredProducts.map((prod) => (
                                    <motion.div
                                        key={prod.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="group"
                                    >
                                        <Link
                                            to={`/product/${prod.id}`}
                                            className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all"
                                        >
                                            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                                                {prod.image_url ? (
                                                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-300"><Star size={24} /></div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex flex-col gap-0.5 mb-2">
                                                    <h4 className="font-black text-zinc-900 dark:text-white text-[13px] tracking-tight uppercase italic truncate">{prod.name}</h4>
                                                    <div className="flex items-center gap-1.5 opacity-60">
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{prod.merchant?.name || 'Local Merchant'}</span>
                                                        <span className="text-[8px] text-zinc-400">•</span>
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{prod.category?.name}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="text-lg font-black text-zinc-950 dark:text-white italic tracking-tighter">₹{parseFloat(prod.price).toFixed(0)}</span>
                                                    <div className="w-9 h-9 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                                                        <ArrowRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Search;

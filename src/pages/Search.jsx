import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const response = await productService.getAll();
                setProducts(response.data.data);

                const params = new URLSearchParams(window.location.search);
                const q = params.get('q');
                if (q) {
                    setQuery(q);
                    const initialResults = response.data.data.filter(p =>
                        p.name.toLowerCase().includes(q.toLowerCase()) ||
                        p.description?.toLowerCase().includes(q.toLowerCase()) ||
                        p.category?.name?.toLowerCase().includes(q.toLowerCase())
                    );
                    setFilteredProducts(initialResults);
                } else {
                    setFilteredProducts(response.data.data);
                }
            } catch (error) {
                console.error("Search fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    useEffect(() => {
        const results = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredProducts(results);
    }, [query, products]);

    return (
        <div className="bg-zinc-50 dark:bg-[#0A0A0A] min-h-screen pt-12 px-6 pb-32 font-sans">
            {/* Minimal Search Header */}
            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-zinc-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl z-50 pt-2 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shrink-0 shadow-sm active:scale-95 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex-1 relative group bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">
                        <SearchIcon size={18} />
                    </div>
                    <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search menu..."
                        className="w-full bg-transparent py-3 pl-11 pr-12 text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Trending area */}
            {!query && (
                <div className="mb-10">
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

            <div className="flex justify-between items-baseline mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {query ? 'Search Results' : 'Recommended'}
                </h2>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
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
                        {filteredProducts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                            >
                                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X size={24} className="text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">No Results Found</h3>
                                <p className="text-sm text-zinc-500 mb-6">We couldn't find items matching your search.</p>
                                <button onClick={() => setQuery('')} className="text-sm font-medium text-zinc-900 dark:text-white underline">Clear Search</button>
                            </motion.div>
                        ) : (
                            filteredProducts.map((prod) => (
                                <motion.div
                                    key={prod.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group"
                                >
                                    <Link
                                        to={`/product/${prod.id}`}
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-transform"
                                    >
                                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                                            {prod.image_url ? (
                                                <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300"><Star size={24} /></div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-semibold text-zinc-900 dark:text-white text-sm truncate mb-0.5">{prod.name}</h4>
                                            <p className="text-[10px] text-zinc-400 line-clamp-1 mb-2">{prod.description || prod.category?.name}</p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">₹{parseFloat(prod.price).toFixed(0)}</span>
                                                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                    <ArrowRight size={14} />
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
    );
};

export default Search;

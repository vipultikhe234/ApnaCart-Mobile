import MobileLoader from '../components/MobileLoader';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MerchantService, locationService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Search,
    Star,
    Clock,
    MapPin,
    Filter,
    Activity,
    ArrowRight,
    X,
    ChevronDown
} from 'lucide-react';

const AllMerchants = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State from URL or Defaults
    const [selectedCityId, setSelectedCityId] = useState(() => {
        const urlId = searchParams.get('city_id');
        if (urlId) return urlId;

        try {
            const saved = localStorage.getItem('selectedCity');
            return saved ? JSON.parse(saved).id : '';
        } catch (e) {
            return '';
        }
    });
    const [selectedCatId, setSelectedCatId] = useState(searchParams.get('category_id') || '');

    const [merchants, setMerchants] = useState([]);
    const [cities, setCities] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [cityRes, catRes] = await Promise.all([
                    locationService.getCities({ has_merchants: true }),
                    MerchantService.getMerchantCategories()
                ]);
                setCities(cityRes.data.data || cityRes.data || []);
                setCategories(catRes.data.data || catRes.data || []);
            } catch (e) {
                console.error("Failed to fetch initial data", e);
            }
        };
        fetchBaseData();
    }, []);

    useEffect(() => {
        const fetchMerchants = async () => {
            setLoading(true);
            try {
                const params = {};
                if (selectedCityId) params.city_id = selectedCityId;
                if (selectedCatId) params.merchant_category_id = selectedCatId;

                const res = await MerchantService.getAll(params);
                setMerchants(res.data.data || []);
            } catch (e) {
                console.error("Failed to fetch merchants", e);
                setMerchants([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMerchants();
    }, [selectedCityId, selectedCatId]);

    const handleCityChange = (id) => {
        setSelectedCityId(id);
        const newParams = new URLSearchParams(searchParams);
        if (id) newParams.set('city_id', id); else newParams.delete('city_id');
        setSearchParams(newParams);
    };

    const handleCatChange = (id) => {
        setSelectedCatId(id);
        const newParams = new URLSearchParams(searchParams);
        if (id) newParams.set('category_id', id); else newParams.delete('category_id');
        setSearchParams(newParams);
    };

    const filtered = merchants.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Category Strip is now always visible for easier navigation
    const showCategoryStrip = true;

    const [cityMenuOpen, setCityMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#060606] pb-24">
            {/* Ultra-Compact Premium Glass Header */}
            <div className="sticky top-0 z-[100] px-4 pt-4 pb-2 bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-3xl">
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900/80 rounded-[28px] p-2 pl-2.5 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl shadow-black/5 dark:shadow-none">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 bg-zinc-950 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-zinc-950 active:scale-95 transition-transform shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 text-center relative px-2">
                        <button
                            onClick={() => setCityMenuOpen(!cityMenuOpen)}
                            className="inline-flex items-center gap-2 group"
                        >
                            <span className="text-[12px] font-black uppercase tracking-[0.1em] text-zinc-900 dark:text-white italic">
                                {selectedCityId ? cities.find(c => c.id == selectedCityId)?.name : 'All Regions'}
                            </span>
                            <ChevronDown size={12} className={`text-emerald-500 transition-transform duration-300 ${cityMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.2em] leading-none mt-0.5 italic">Partners</p>

                        <AnimatePresence>
                            {cityMenuOpen && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setCityMenuOpen(false)}
                                        className="fixed inset-0 bg-black/60 z-[-1]"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, x: '-50%' }}
                                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                                        exit={{ opacity: 0, y: -10, x: '-50%' }}
                                        className="absolute top-full left-1/2 mt-3 bg-white dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-2 w-[200px] shadow-2xl z-[1001]"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => { handleCityChange(''); setCityMenuOpen(false); }}
                                                className={`w-full text-center px-4 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${!selectedCityId ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                            >
                                                ALL REGIONS
                                            </button>
                                            {cities.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { handleCityChange(c.id); setCityMenuOpen(false); }}
                                                    className={`w-full text-center px-4 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${selectedCityId == c.id ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-10 h-10 flex items-center justify-center text-zinc-400">
                        {(selectedCityId || selectedCatId) ? (
                            <button
                                onClick={() => { handleCityChange(''); handleCatChange(''); }}
                                className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-white border border-transparent dark:border-zinc-700/50 active:rotate-90 transition-all font-bold"
                            >
                                <X size={18} />
                            </button>
                        ) : (
                             <Activity size={18} strokeWidth={2.5} />
                        )}
                    </div>
                </div>

                <div className="relative group mb-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search our network..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-11 bg-zinc-900/80 border border-zinc-800 rounded-[20px] pl-10 pr-10 text-xs font-medium text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-600"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <AnimatePresence>
                    {showCategoryStrip && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-1"
                        >
                            <div className="flex gap-3 mb-3 overflow-x-auto no-scrollbar py-1">
                                <button
                                    onClick={() => handleCatChange('')}
                                    className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-lg ${!selectedCatId
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                >
                                    ALL
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCatChange(cat.id)}
                                        className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-lg ${selectedCatId == cat.id
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 mt-6">

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-zinc-900 rounded-[32px] animate-pulse border border-zinc-800"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filtered.map((merchant, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    key={merchant.id}
                                    onClick={() => navigate(`/Merchant/${merchant.id}`)}
                                    className="group relative bg-[#0F0F0F] rounded-[40px] overflow-hidden border border-zinc-900/50 shadow-xl shadow-black/20 active:scale-[0.98] transition-all"
                                >
                                    <div className="p-5 flex gap-5">
                                        <div className="relative w-[110px] h-[110px] rounded-[30px] overflow-hidden shrink-0 border border-zinc-800 shadow-inner">
                                            <img
                                                src={merchant.image || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=400&auto=format&fit=crop'}
                                                alt={merchant.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {!merchant.is_open && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="text-[9px] font-black uppercase text-white tracking-[0.2em] border border-white/20 px-3 py-1.5 rounded-xl">Closed</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-black text-white truncate pr-2 text-base tracking-tighter uppercase italic">{merchant.name}</h3>
                                                    <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-2xl border border-emerald-500/20">
                                                        <Star size={10} className="fill-emerald-500 text-emerald-500" />
                                                        <span className="text-[11px] font-black text-emerald-500">{merchant.rating || '4.5'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-zinc-500 mb-4">
                                                    <MapPin size={12} className="text-zinc-600" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{merchant.address || 'Local Outlet'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                    <Clock size={14} className="text-emerald-500" />
                                                    <span>{merchant.opening_time?.slice(0, 5)} - {merchant.closing_time?.slice(0, 5)}</span>
                                                </div>
                                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${merchant.is_open ? 'text-emerald-500 bg-emerald-500/5' : 'text-zinc-600 bg-zinc-900'}`}>
                                                    {merchant.is_open ? 'Open' : 'Off'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute top-1/2 right-6 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-900 shadow-2xl">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-800 shadow-2xl">
                            <Filter size={32} className="text-zinc-700" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tighter">Zero results Found</h3>
                        <p className="text-xs text-zinc-500 mb-8 max-w-[200px] mx-auto balance uppercase font-bold tracking-widest">No partners match your criteria in {selectedCityId ? cities.find(c => c.id == selectedCityId)?.name : 'this region'}.</p>
                        <button
                            onClick={() => { handleCityChange(''); handleCatChange(''); }}
                            className="bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.3em] px-10 py-5 rounded-3xl hover:bg-emerald-400 active:scale-95 transition-all shadow-2xl shadow-emerald-500/20"
                        >
                            Reset Network
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllMerchants;


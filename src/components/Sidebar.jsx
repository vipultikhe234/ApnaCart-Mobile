import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Tag, Gift, ChevronRight, HelpCircle, Settings,
    Bell, CreditCard, MapPin, LayoutGrid, Store, User,
    LogOut, Package, Star, Sparkles, Ticket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { productService, MerchantService, landingService } from '../services/api';

const LiveOffersModule = ({ navigate, onClose, selectedCity }) => {
    const [liveOffers, setLiveOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'coupon', 'offer'

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const res = await landingService.getOffers(selectedCity ? { city_id: selectedCity.id } : {});
                setLiveOffers(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setOffersLoading(false);
            }
        };
        fetchOffers();
    }, [selectedCity]);

    const filteredOffers = filter === 'all' 
        ? liveOffers 
        : liveOffers.filter(o => o.type === filter);

    return (
        <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-4 mb-2">
                <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white italic">Active Deals</h3>
                
                {/* Filter Toggles */}
                <div className="flex gap-2">
                    {['all', 'coupon', 'offer'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                filter === type 
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-100 dark:border-zinc-800 hover:border-emerald-500/30'
                            }`}
                        >
                            {type === 'all' ? 'All' : type}
                        </button>
                    ))}
                </div>
            </div>

            {offersLoading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}
                </div>
            ) : filteredOffers.length > 0 ? (
                <div className="flex flex-col gap-3 pb-10">
                    <AnimatePresence mode="popLayout">
                        {filteredOffers.map((offer) => (
                            <motion.button
                                key={offer.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    navigate(offer.link || '/');
                                    onClose();
                                }}
                                className="relative min-h-[100px] p-5 rounded-[24px] overflow-hidden group text-left border border-zinc-100 dark:border-zinc-800 shadow-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 opacity-90 transition-opacity group-hover:opacity-80" />
                                {offer.image && <img src={offer.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" />}
                                <div className="relative z-10">
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                            {offer.merchant?.name || 'Partner Shop'}
                                        </span>
                                        <div className={`p-1 rounded-md bg-white/5 border border-white/10`}>
                                            {offer.type === 'coupon' ? <Ticket size={10} className="text-white" /> : <Tag size={10} className="text-white" />}
                                        </div>
                                    </div>
                                    <h4 className="text-base font-black text-white leading-tight uppercase mb-0.5">{offer.title}</h4>
                                    <p className="text-[8px] font-bold text-teal-400/80 uppercase tracking-widest line-clamp-1">{offer.subtitle}</p>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="p-10 text-center opacity-30 mt-10">
                    <Tag size={40} className="mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No {filter !== 'all' ? filter + 's' : 'deals'} available</p>
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ isOpen, onClose }) => {
    const [activeModule, setActiveModule] = useState('main');
    const [categories, setCategories] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const navigate = useNavigate();
    const [selectedCity, setSelectedCity] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Refresh city and user state from localStorage when opening
            try {
                const savedCity = localStorage.getItem('selectedCity');
                setSelectedCity(savedCity ? JSON.parse(savedCity) : null);
                
                const savedUser = localStorage.getItem('user');
                setUser(savedUser ? JSON.parse(savedUser) : null);
            } catch (e) { console.error("Sidebar state sync error:", e); }

            setActiveModule('main'); 
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [catRes, restRes] = await Promise.all([
                        MerchantService.getMerchantCategories(),
                        MerchantService.getAll(selectedCity ? { city_id: selectedCity.id } : {})
                    ]);
                    setCategories(catRes.data.data?.slice(0, 8) || []);
                    setMerchants(restRes.data.data?.slice(0, 5) || []);
                } catch (error) {
                    console.error("Sidebar data fetch error:", error);
                }
            };
            fetchData();
        }
    }, [isOpen, selectedCity]);

    const modules = [
        { id: 'categories', label: 'Categories', icon: <LayoutGrid size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Fresh & Fast' },
        { id: 'merchants', label: 'Top Merchants', icon: <Store size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10', description: 'Premium Picks' },
        { id: 'offers', label: 'Live Offers', icon: <Tag size={18} />, color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Flat discounts' },
        { id: 'rewards', label: 'ApnaRewards', icon: <Sparkles size={18} />, color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Coming Soon' },
    ];

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        onClose();
    };

    const renderModuleContent = () => {
        switch (activeModule) {
            case 'categories':
                return (
                    <div className="flex flex-col gap-4 p-5">
                        <button onClick={() => setActiveModule('main')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                            <ChevronRight size={12} className="rotate-180" /> Back to Menu
                        </button>
                        <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 italic">Explore</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {categories.map((cat, idx) => (
                                <motion.button
                                    key={cat.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => {
                                        navigate(`/merchant-category/${cat.id}`);
                                        onClose();
                                    }}
                                    className="flex flex-col items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                                >
                                    <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{cat.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                );
            case 'merchants':
                return (
                    <div className="flex flex-col gap-4 p-5">
                        <button onClick={() => setActiveModule('main')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                            <ChevronRight size={12} className="rotate-180" /> Back to Menu
                        </button>
                        <h3 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 italic">Top Picks</h3>
                        <div className="flex flex-col gap-3">
                            {merchants.map((m, idx) => (
                                <motion.button
                                    key={m.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => {
                                        navigate(`/Merchant/${m.id}`);
                                        onClose();
                                    }}
                                    className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                                >
                                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">{m.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Star size={8} className="fill-yellow-500 text-yellow-500" />
                                            <span className="text-[8px] font-bold text-zinc-400">4.5 • {m.city?.name}</span>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                );
            case 'offers':
                return (
                    <>
                        <div className="px-5 pt-5">
                            <button onClick={() => setActiveModule('main')} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                <ChevronRight size={12} className="rotate-180" /> Back to Menu
                            </button>
                        </div>
                        <LiveOffersModule navigate={navigate} onClose={onClose} selectedCity={selectedCity} />
                    </>
                );
            default:
                return (
                    <div className="flex flex-col gap-2.5 p-5">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 ml-1">Menu</h3>
                        {modules.map((mod, idx) => (
                            <motion.button
                                key={mod.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveModule(mod.id)}
                                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-10 h-10 ${mod.bg} ${mod.color} rounded-xl flex items-center justify-center`}>
                                        {mod.icon}
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">{mod.label}</span>
                                        <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{mod.description}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                            </motion.button>
                        ))}

                        <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                            {[
                                { icon: <Package size={14} />, label: 'My Orders', path: '/orders' },
                                { icon: <MapPin size={14} />, label: 'Addresses' },
                                { icon: <Bell size={14} />, label: 'Settings' },
                                { icon: <LogOut size={14} />, label: 'Logout', onClick: logout, color: 'text-red-500' },
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (item.onClick) item.onClick();
                                        else if (item.path) { navigate(item.path); onClose(); }
                                    }}
                                    className={`flex items-center gap-3 w-full p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest ${item.color || ''}`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />

                    {/* Sidebar Container */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white dark:bg-[#0A0A0A] z-[101] shadow-2xl flex flex-col border-r border-zinc-100 dark:border-zinc-800"
                    >
                        {/* Header */}
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <span className="text-white font-black text-xl italic leading-none">A</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white italic leading-tight">apnaCart</h2>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">Premium Experience</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeModule}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {renderModuleContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer User Profile */}
                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800">
                            <button 
                                onClick={() => { navigate('/profile'); onClose(); }}
                                className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800 active:scale-95 transition-transform"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 font-bold uppercase overflow-hidden">
                                        {user?.name?.[0] || 'G'}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-zinc-900 dark:text-white leading-tight">{user?.name || 'Guest'}</p>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Gold Member</p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-zinc-400" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, Clock, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MerchantService } from '../services/api';
import { useSidebar } from '../context/SidebarContext';
import MobileLoader from '../components/MobileLoader';

const MerchantList = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { openSidebar } = useSidebar();
    const [merchants, setMerchants] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get selected city from localStorage
                let cityId = null;
                try {
                    const savedCity = localStorage.getItem('selectedCity');
                    if (savedCity) cityId = JSON.parse(savedCity).id;
                } catch (e) {}

                const [mRes, cRes] = await Promise.all([
                    MerchantService.getAll({ 
                        merchant_category_id: categoryId,
                        city_id: cityId 
                    }),
                    MerchantService.getMerchantCategories()
                ]);
                setMerchants(mRes.data.data || []);
                const currentCat = cRes.data.data?.find(c => c.id === parseInt(categoryId));
                setCategory(currentCat);
            } catch (error) {
                console.error("Error fetching merchant list:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId]);

    if (merchants.length === 0 && loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex items-center justify-center">
                <MobileLoader />
            </div>
        );
    }

    return (
        <div className="relative flex flex-col min-h-screen pb-32 bg-zinc-50 dark:bg-[#0A0A0A]">
            {/* Background Refresh (Non-Blocking) */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-2xl z-50 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)} 
                        className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-900 dark:text-white shadow-sm active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </motion.button>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none uppercase italic">{category?.name || 'Results'}</h1>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1.5 opacity-60">Merchant Ecosystem</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/search')}
                        className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-900 dark:text-white shadow-sm"
                    >
                        <Search size={18} />
                    </motion.button>
                </div>
            </header>

            <div className="p-6 space-y-6">
                <AnimatePresence>
                    {merchants.length > 0 ? (
                        merchants.map((merchant, index) => (
                            <motion.div 
                                key={merchant.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(`/Merchant/${merchant.id}`)}
                                className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] shadow-sm border border-zinc-100 dark:border-zinc-800 flex gap-5 group cursor-pointer active:shadow-none transition-all"
                            >
                                <div className="w-24 h-24 rounded-[24px] overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-700 border border-zinc-50 dark:border-zinc-800">
                                    <img 
                                        src={merchant.image} 
                                        alt={merchant.name} 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer" 
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h3 className="font-black text-base text-zinc-900 dark:text-white leading-tight tracking-tight uppercase italic">{merchant.name}</h3>
                                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-widest">{merchant.city?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-2 py-0.5 rounded-lg">
                                            <Star size={10} className="fill-white" />
                                            <span className="text-[10px] font-black">4.5</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-black">25 MIN</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-2.5 line-clamp-1 font-bold uppercase tracking-widest italic opacity-80">{merchant.description || 'Verified Premium Partner'}</p>
                                    <div className="flex items-center gap-2 mt-3 text-[9px] text-zinc-400 font-bold uppercase tracking-tight">
                                        <MapPin size={10} className="text-emerald-500/40" />
                                        <span className="line-clamp-1 opacity-60 italic">{merchant.address}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 grayscale opacity-50">
                                <Search size={24} className="text-zinc-400" />
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">No merchants found in this category</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MerchantList;

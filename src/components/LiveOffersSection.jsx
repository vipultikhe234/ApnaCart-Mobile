import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Clock } from 'lucide-react';
import axios from 'axios';

const LiveOffersSection = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/live-offers`);
                setOffers(response.data || []);
            } catch (error) {
                console.error("Error fetching live offers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    const handleOfferClick = async (offer) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/live-offers/${offer.id}/click`);
            
            if (offer.target.type === 'product') {
                navigate(`/product/${offer.target.id}`);
            } else if (offer.target.type === 'category') {
                navigate(`/search?category=${offer.target.id}`);
            } else {
                navigate(`/Merchant/${offer.target.id}`);
            }
        } catch (error) {
            console.error("Click logging error:", error);
            // Still navigate even if logging fails
            navigate(offer.target.type === 'product' ? `/product/${offer.target.id}` : `/Merchant/${offer.target.id}`);
        }
    };

    if (loading) return (
        <div className="px-6 mb-10 h-44 animate-pulse bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem]" />
    );

    if (offers.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="px-6 flex justify-between items-baseline mb-5">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Live Offers</h2>
                    <div className="flex items-center gap-1 bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">
                        <Zap size={8} className="text-white fill-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Live Now</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-4">
                {offers.map((offer, idx) => (
                    <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleOfferClick(offer)}
                        className="relative shrink-0 w-[300px] h-48 rounded-[2.8rem] overflow-hidden group cursor-pointer shadow-xl shadow-zinc-200/50 dark:shadow-none bg-zinc-900 dark:bg-zinc-800"
                    >
                        {/* Background Banner */}
                        {offer.banner ? (
                            <img src={offer.banner} alt={offer.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-60" />
                        )}

                        {/* Glass Overlay Content */}
                        <div className="absolute inset-0 p-7 flex flex-col justify-between z-10">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        {offer.merchant.name}
                                    </span>
                                    {offer.is_hot && (
                                        <div className="flex items-center gap-1 bg-rose-500 px-2 py-1 rounded-full shadow-lg">
                                            <Sparkles size={8} className="text-white fill-white" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Hot Deal</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black text-white leading-none mb-2 drop-shadow-md">
                                    {offer.discount.label}
                                </h3>
                                <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest line-clamp-1 mb-1">
                                    {offer.title}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Clock size={10} className="text-white" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{offer.validity}</span>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-lg">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Decorative Circle */}
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default LiveOffersSection;


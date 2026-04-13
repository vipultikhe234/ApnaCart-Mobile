import MobileLoader from '../components/MobileLoader';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    PackageOpen,
    FileText,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    Timer,
    ShoppingBag
} from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await orderService.getUserOrders();
                setOrders(response.data.data);
            } catch (error) {
                console.error("Orders error:", error);
                if (error.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [navigate]);

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    text: 'text-emerald-500',
                    border: 'border-emerald-100 dark:border-emerald-500/20',
                    icon: CheckCircle2,
                };
            case 'cancelled':
                return {
                    bg: 'bg-red-50 dark:bg-red-500/10',
                    text: 'text-red-500',
                    border: 'border-red-100 dark:border-red-500/20',
                    icon: XCircle,
                };
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-500/10',
                    text: 'text-blue-500',
                    border: 'border-blue-100 dark:border-blue-500/20',
                    icon: Timer,
                };
        }
    };

    if (orders.length === 0 && loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex items-center justify-center">
                <MobileLoader />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] pt-12 pb-32 px-6">
            {/* New Fast Mobile Loader Overlay */}
            {loading && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-transparent pointer-events-none">
                    <MobileLoader />
                </div>
            )}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Orders</h1>
                    <p className="text-xs text-zinc-500 mt-1">Past and current deliveries</p>
                </div>
                <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm">
                    <FileText size={18} />
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center px-6"
                        >
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                <PackageOpen size={24} className="text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No Orders Yet</h3>
                            <p className="text-sm text-zinc-500 mb-8 max-w-[200px]">You haven't placed any orders yet. Discover our menu!</p>

                            <Link to="/" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                                Browse Menu
                            </Link>
                        </motion.div>
                    ) : (
                        orders.map((order, index) => {
                            const style = getStatusStyle(order.status);
                            const StatusIcon = style.icon;

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link to={`/order/${order.id}`} className="block">
                                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all">
                                            
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">#{order.order_number || String(order.id).padStart(4, '0')}</h3>
                                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                                        <Clock size={12} />
                                                        <p className="text-[10px] font-medium uppercase tracking-wider">
                                                            {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`${style.bg} ${style.text} ${style.border} border px-3 py-1.5 rounded-lg flex items-center gap-1.5`}>
                                                    <StatusIcon size={12} />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{order.status}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {order.items?.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-700 flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold text-zinc-500">{item.quantity}x</span>
                                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[80px]">{item.product?.name}</span>
                                                    </div>
                                                ))}
                                                {order.items?.length > 3 && (
                                                    <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-zinc-200 dark:border-zinc-700">
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                                <div>
                                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-0.5">Total Amount</span>
                                                    <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">₹{parseFloat(order.total_price).toFixed(0)}</span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {orders.length > 0 && (
                <div className="mt-8 bg-zinc-900 dark:bg-white rounded-3xl p-6 text-white dark:text-zinc-900 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wider opacity-90">Account Summary</h4>
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Total Spent</p>
                                    <p className="text-lg font-bold">₹{orders.reduce((acc, o) => acc + parseFloat(o.total_price), 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] opacity-70 uppercase tracking-wider mb-0.5">Orders</p>
                                    <p className="text-lg font-bold">{orders.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white/10 dark:bg-black/5 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <ShoppingBag size={20} className="text-white dark:text-zinc-900" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;

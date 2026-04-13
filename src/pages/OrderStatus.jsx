import MobileLoader from '../components/MobileLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ClipboardList, ChefHat, Bike, Gift, HelpCircle, MapPin, SearchX, Box, CheckCircle2, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create a custom marker icon for the rider
const riderIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3195/3195884.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

// Helper component to auto-center the map when rider moves
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 15);
        }
    }, [lat, lng, map]);
    return null;
};

const OrderStatus = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const deliverySteps = [
        { label: 'Placed', status: 'placed', icon: ClipboardList },
        { label: 'Accepted', status: 'accepted', icon: CheckCircle2 },
        { label: 'Preparing', status: 'preparing', icon: ChefHat },
        { label: 'Ready', status: 'ready', icon: Box },
        { label: 'On the way', status: 'out_for_delivery', icon: Bike },
        { label: 'Delivered', status: 'delivered', icon: Gift },
    ];

    const pickupSteps = [
        { label: 'Placed', status: 'placed', icon: ClipboardList },
        { label: 'Accepted', status: 'accepted', icon: CheckCircle2 },
        { label: 'Preparing', status: 'preparing', icon: ChefHat },
        { label: 'Ready to Pick', status: 'ready', icon: Box },
        { label: 'Picked Up', status: 'picked_up', icon: Gift },
    ];

    const steps = useMemo(() => {
        return order?.order_type === 'pickup' ? pickupSteps : deliverySteps;
    }, [order?.order_type]);

    const currentStepIndex = useMemo(() => {
        if (!order) return 0;
        const index = steps.findIndex(s => s.status === order.status);
        return index === -1 ? (order.status === 'delivered' || order.status === 'picked_up' ? steps.length - 1 : 0) : index;
    }, [order, steps]);

    const progressPercent = useMemo(() => {
        if (!steps.length) return 0;
        return (currentStepIndex / (steps.length - 1)) * 100;
    }, [currentStepIndex, steps]);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 3;
        let timeoutId;

        const fetchOrder = async () => {
            try {
                const res = await api.get(`/orders/${id}`);
                setOrder(res.data.data);
                setLoading(false);
            } catch (err) {
                attempts++;
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                if (attempts < maxAttempts) {
                    timeoutId = setTimeout(fetchOrder, 1000);
                } else {
                    setLoading(false);
                }
            }
        };

        fetchOrder();
        
        // Polling every 15 seconds for status updates
        const intervalId = setInterval(fetchOrder, 15000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [id, navigate]);

    if (!order && loading) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] flex items-center justify-center">
                <MobileLoader />
            </div>
        );
    }
    
    return (
        <div className="relative min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] font-sans">
            
            {!loading && !order && (
                <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                    <SearchX size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 font-black italic uppercase italic">Order Not Found</h1>
                    <button onClick={() => navigate('/orders')} className="text-sm font-black italic uppercase underline text-zinc-900 dark:text-white">View My Orders</button>
                </div>
            )}
            
            {order && (
                <div className="pb-20">
                    {/* Header */}
                    <div className="sticky top-0 bg-zinc-50/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 pt-12 pb-4 flex items-center gap-4 z-40">
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm active:scale-95"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-lg font-black italic text-zinc-900 dark:text-white uppercase tracking-tighter">Track Order</h1>
                            <p className="text-[10px] font-black italic text-zinc-500 uppercase tracking-widest mt-0.5">#{order.order_number || String(order.id).padStart(4, '0')}</p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border italic ${
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' :
                                order.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100 dark:bg-red-500/10 dark:border-red-500/20' :
                                'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20'
                            }`}>
                            {order.status}
                        </div>
                    </div>

                    <div className="px-6 mt-6 space-y-6">
                        {/* Map Tracking (Show if Out for Delivery) */}
                        {order.status === 'out_for_delivery' && (
                            <div className="h-[250px] w-full rounded-[32px] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative">
                                <MapContainer 
                                    center={[order.rider?.current_latitude || 28.6139, order.rider?.current_longitude || 77.2090]} 
                                    zoom={15} 
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        attribution="&copy; ApnaCart Logistics"
                                    />
                                    {order.rider?.current_latitude && (
                                        <Marker position={[order.rider.current_latitude, order.rider.current_longitude]} icon={riderIcon}>
                                            <Popup>
                                                <div className="text-xs font-bold font-black italic uppercase">Rider is approaching!</div>
                                            </Popup>
                                        </Marker>
                                    )}
                                    <RecenterMap lat={order.rider?.current_latitude} lng={order.rider?.current_longitude} />
                                </MapContainer>
                                <div className="absolute top-4 left-4 z-[500] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                     <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-white italic tracking-widest">Live Tracking</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Status Hub */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                            <div className="relative">
                                {/* Track Line */}
                                <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                                {progressPercent > 0 && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${progressPercent}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className="absolute left-[20px] top-6 w-[2px] bg-zinc-950 dark:bg-white rounded-full origin-top"
                                    />
                                )}

                                <div className="space-y-8 relative z-10">
                                    {steps.map((step, idx) => {
                                        const isComplete = idx <= currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const StepIcon = step.icon;

                                        return (
                                            <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${!isComplete ? 'opacity-20' : 'opacity-100'}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                                                        isComplete && !isCurrent ? 'bg-zinc-950 dark:bg-white border-zinc-950 dark:border-white text-white dark:text-zinc-950' :
                                                        isCurrent ? 'bg-white dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white scale-110 shadow-xl' :
                                                        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                                                    }`}>
                                                    <StepIcon size={16} strokeWidth={isCurrent ? 3 : 2} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-black text-sm uppercase italic tracking-tighter ${
                                                            isComplete ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'
                                                        }`}>{step.label}</h4>
                                                    <p className={`text-[9px] uppercase tracking-[0.2em] mt-0.5 italic ${
                                                            isCurrent ? 'text-zinc-900 dark:text-white font-black' : 'text-zinc-400 font-bold'
                                                        }`}>
                                                        {isComplete && !isCurrent ? 'Verified' : isCurrent ? 'Active Now' : 'Pending'}
                                                    </p>
                                                </div>
                                                {isCurrent && (
                                                     <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-white rounded-full animate-ping" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Store / Pickup / Address */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-white shrink-0 border border-zinc-100 dark:border-zinc-700">
                                {order.order_type === 'pickup' ? <Store size={20} /> : <MapPin size={20} />}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">
                                    {order.order_type === 'pickup' ? 'Collection Point' : 'Destination'}
                                </p>
                                <p className="font-black text-zinc-900 dark:text-white text-xs leading-relaxed uppercase italic">
                                    {order.order_type === 'pickup' 
                                        ? (order.merchant?.address || 'Self Pickup At Store') 
                                        : (order.address?.address_line || order.address?.landmark || 'Your Location')}
                                </p>
                            </div>
                        </div>

                        {/* Order Inventory Hub */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Box size={16} className="text-zinc-950 dark:text-white" />
                                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">Basket Summary</h3>
                            </div>

                            <div className="space-y-5 mb-8">
                                {order.items?.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-700">
                                            <img 
                                                src={item.product?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                                                alt="item" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm text-zinc-900 dark:text-white uppercase italic truncate tracking-tight">
                                                {item.product_name || item.product?.name || 'Choice Meal'}
                                                {(item.variant_name || item.variant?.quantity || item.variant?.name) && (item.variant_name !== 'Standard' && item.variant?.quantity !== 'Standard') ? ` ${item.variant_name || item.variant?.quantity || item.variant?.name}` : ''}
                                            </p>
                                            <div className="flex justify-between items-center mt-1.5">
                                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] italic">x{item.quantity}</p>
                                                <p className="font-black text-sm text-zinc-900 dark:text-white italic">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t-2 border-dashed border-zinc-100 dark:border-zinc-800 space-y-3">
                                <div className="flex justify-between text-[11px] font-bold uppercase italic text-zinc-400 tracking-wider">
                                    <span>Subtotal</span>
                                    <span>₹{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.delivery_fee) > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold uppercase italic text-zinc-400 tracking-wider">
                                        <span>Delivery Fee</span>
                                        <span>₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
                                    </div>
                                )}
                                {parseFloat(order.packaging_fee) > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold uppercase italic text-zinc-400 tracking-wider">
                                        <span>Packaging Fee</span>
                                        <span>₹{parseFloat(order.packaging_fee).toFixed(2)}</span>
                                    </div>
                                )}
                                {parseFloat(order.platform_fee) > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold uppercase italic text-zinc-400 tracking-wider">
                                        <span>Platform Fee</span>
                                        <span>₹{parseFloat(order.platform_fee).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[11px] font-bold uppercase italic text-zinc-400 tracking-wider">
                                    <span>Taxes & GST</span>
                                    <span>₹{parseFloat(order.tax_amount || 0).toFixed(2)}</span>
                                </div>
                                {(parseFloat(order.coupon_discount) > 0 || parseFloat(order.discount) > 0) && (
                                    <div className="flex justify-between text-[11px] font-black uppercase italic text-emerald-500 tracking-[0.1em] py-2 px-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <div className="flex items-center gap-2">
                                            <Gift size={12} strokeWidth={3} />
                                            <span>Voucher Applied</span>
                                        </div>
                                        <span>-₹{parseFloat(order.coupon_discount || order.discount || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-zinc-50 dark:bg-zinc-800 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Paid via {order.payment_method?.toUpperCase()}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">Total Amount</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter italic">₹{parseFloat(order.total_price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderStatus;

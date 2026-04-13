import React, { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Copy, CheckCircle2, ShieldAlert, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const ELEMENT_STYLE = {
    style: {
        base: {
            fontSize: '15px',
            color: '#111827',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: '600',
            iconColor: '#f97316',
            '::placeholder': { color: '#9ca3af', fontWeight: '500' },
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' },
    },
};

const StripePayment = ({ clientSecret, orderId, onSucceeded, onFailed }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const testCard = '4242 4242 4242 4242';

    const copyTestCard = () => {
        navigator.clipboard?.writeText('4242424242424242');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardNumberElement),
            },
        });

        if (result.error) {
            setError(result.error.message);
            setProcessing(false);
            onFailed?.(result.error.message);
            return;
        }

        if (result.paymentIntent?.status === 'succeeded') {
            setProcessing(false);
            // On success, return the intent ID to the parent to complete order
            onSucceeded?.(result.paymentIntent.id);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Test Card Banner */}
            <div className="bg-orange-50/50 border border-orange-100 rounded-[24px] p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex items-center gap-2 mb-3">
                    <ShieldAlert size={14} className="text-orange-500" />
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">Test Mode</p>
                </div>

                <div className="relative z-10 flex justify-between items-center bg-white p-3 pr-2 rounded-2xl border border-orange-100/50 shadow-sm mb-3">
                    <span className="font-bold text-gray-700 text-sm tracking-widest pl-2">{testCard}</span>
                    <button
                        type="button"
                        onClick={copyTestCard}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${copied ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                            }`}
                    >
                        {copied ? (
                            <><CheckCircle2 size={12} /> Copied</>
                        ) : (
                            <><Copy size={12} /> Copy</>
                        )}
                    </button>
                </div>

                <div className="relative z-10 flex justify-between px-2">
                    <span className="text-[10px] font-bold text-gray-400">Exp: <span className="text-gray-900">Any future</span></span>
                    <span className="text-[10px] font-bold text-gray-400">CVC: <span className="text-gray-900">Any 3</span></span>
                    <span className="text-[10px] font-bold text-gray-400">ZIP: <span className="text-gray-900">Any 5</span></span>
                </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
                {/* Card Number */}
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                        Card Number
                    </label>
                    <div className="p-4 pt-5 bg-gray-50 rounded-[24px] border border-gray-100 focus-within:bg-white focus-within:border-orange-500/30 focus-within:shadow-[0_4px_20px_rgba(249,115,22,0.08)] transition-all">
                        <CardNumberElement options={{ ...ELEMENT_STYLE, showIcon: true }} />
                    </div>
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                            Valid Thru
                        </label>
                        <div className="p-4 pt-5 bg-gray-50 rounded-[24px] border border-gray-100 focus-within:bg-white focus-within:border-orange-500/30 focus-within:shadow-sm transition-all">
                            <CardExpiryElement options={ELEMENT_STYLE} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                            Security Code
                        </label>
                        <div className="p-4 pt-5 bg-gray-50 rounded-[24px] border border-gray-100 focus-within:bg-white focus-within:border-orange-500/30 focus-within:shadow-sm transition-all">
                            <CardCvcElement options={ELEMENT_STYLE} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 overflow-hidden"
                    >
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="leading-relaxed">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-2">
                <button
                    type="submit"
                    disabled={processing || !stripe}
                    className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${processing || !stripe
                        ? 'bg-gray-100 text-gray-400 shadow-none'
                        : 'bg-gray-900 text-white hover:bg-orange-600'
                        }`}
                >
                    {processing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Lock size={16} />
                            <span>Confirm & Pay </span>
                        </>
                    )}
                </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 pb-4 text-gray-300">
                <Lock size={10} />
                <p className="text-[9px] font-bold uppercase tracking-widest">
                    Secured by Stripe
                </p>
            </div>
        </form>
    );
};

export default StripePayment;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, ArrowRight, Loader2, Info, ChevronLeft } from 'lucide-react';

export default function Deposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState({ id: 'bkash', name: 'bKash', number: '...', color: 'bg-[#D12053]' });
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
    return () => unsub();
  }, []);

  const methods = [
    { id: 'bkash', name: 'bKash', number: settings?.bkash || '01XXXXXXXXX', color: 'bg-[#D12053]' },
    { id: 'nagad', name: 'Nagad', number: settings?.nagad || '01XXXXXXXXX', color: 'bg-[#F7941D]' },
    { id: 'rocket', name: 'Rocket', number: settings?.rocket || '01XXXXXXXXX', color: 'bg-[#8B318F]' },
  ];

  useEffect(() => {
    if (methods.length > 0 && selectedMethod.number === '...') {
      setSelectedMethod(methods[0]);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !txId) return;

    if (settings && Number(amount) < settings.minDeposit) {
       toast.error(`MINIMUM DEPOSIT: ৳${settings.minDeposit}`);
       return;
    }

    setIsSubmitting(true);
    try {
      const depositId = 'DEP_' + Math.random().toString(36).substring(7).toUpperCase();
      await setDoc(doc(db, 'transactions', depositId), {
        userId: user.uid,
        type: 'deposit',
        amount: parseFloat(amount),
        method: selectedMethod.name,
        transactionId: txId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast.success('DEPOSIT SEQUENCE INITIALIZED. AWAITING CLEARANCE.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('TRANSMISSION FAILURE');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-p p-6 pb-24 lg:pb-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex items-center gap-4 mb-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-surface border border-border-ui flex items-center justify-center hover:bg-accent/10 transition group">
            <ChevronLeft size={20} className="text-text-s group-hover:text-accent" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Credit Acquisition</h1>
        </header>

        {step === 1 ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="bg-surface border border-border-ui rounded-3xl p-6 mb-6">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-6 block">Protocol Selection</label>
                <div className="grid grid-cols-1 gap-4">
                  {methods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedMethod.id === method.id 
                          ? 'bg-accent/5 border-accent shadow-[0_0_15px_rgba(0,242,255,0.05)]' 
                          : 'bg-black/20 border-border-ui opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white ${method.color} shadow-lg`}>
                          {method.name[0]}
                        </div>
                        <span className="font-black uppercase tracking-widest text-sm">{method.name} Network</span>
                      </div>
                      {selectedMethod.id === method.id && <div className="w-6 h-6 rounded-full bg-accent text-bg flex items-center justify-center"><ArrowRight size={14} /></div>}
                    </button>
                  ))}
                </div>
             </div>

             <div className="bg-surface border border-border-ui rounded-3xl p-6">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-6 block">Credit Magnitude (BDT)</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-black text-2xl">৳</div>
                   <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border-ui rounded-xl pl-10 pr-4 py-5 text-3xl font-black focus:ring-1 focus:ring-accent outline-none tracking-tighter text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
                <button
                  onClick={() => amount && setStep(2)}
                  className="w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-4 rounded-xl mt-8 active:scale-[0.98] transition shadow-[0_0_20px_rgba(0,242,255,0.1)] uppercase tracking-widest text-xs"
                >
                  Continue Authentication
                </button>
             </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex gap-4">
              <Info className="text-accent shrink-0" size={24} />
              <p className="text-[13px] text-text-p uppercase tracking-wide font-bold leading-relaxed">
                Transmit <span className="text-white font-black">৳{amount}</span> to the <span className="text-accent underline underline-offset-4">{selectedMethod.name} Personal</span> terminal below. Secure the Transaction ID for verification.
              </p>
            </div>

            <div className="bg-surface border border-accent/40 rounded-3xl p-10 text-center space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent/20"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-s">Terminal Address</p>
              <h2 className="text-4xl font-mono font-black text-white tracking-widest group-hover:text-accent transition-colors">{selectedMethod.number}</h2>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedMethod.number);
                  toast.success('Address Synchronized');
                }}
                className="text-[10px] bg-black/40 border border-border-ui px-6 py-3 rounded-xl font-black uppercase tracking-widest hover:border-accent transition-all text-text-s hover:text-accent"
              >
                Copy Terminal ID
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface border border-border-ui rounded-3xl p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-4 block ml-1">Transmission Hash (TXID)</label>
                <input
                  type="text"
                  required
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  className="w-full bg-black/40 border border-border-ui rounded-xl p-4 font-mono font-black text-white uppercase tracking-widest focus:ring-1 focus:ring-accent outline-none transition-all placeholder:opacity-20"
                  placeholder="TXN_77AB82..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-4 rounded-xl active:scale-[0.98] transition shadow-[0_0_20px_rgba(0,242,255,0.1)] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {isSubmitting ? <Loader2 className="animate-spin text-bg" /> : 'Confirm Transmission'}
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-text-s text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition"
              >
                Return to Protocol Selection
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}

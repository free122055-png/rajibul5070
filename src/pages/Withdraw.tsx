import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Loader2, Info, ChevronLeft, Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function Withdraw() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [account, setAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(500);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setMinWithdraw(snap.data().minWithdraw || 500);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !amount || !method || !account) return;

    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < minWithdraw) {
      toast.error(`MINIMUM LIQUIDATION: ৳${minWithdraw}`);
      return;
    }

    if (profile.balance < withdrawAmount) {
      toast.error('INSUFFICIENT OPERATIONAL CREDIT');
      return;
    }

    setIsSubmitting(true);
    try {
      const withdrawId = 'WD_' + Math.random().toString(36).substring(7).toUpperCase();
      
      await setDoc(doc(db, 'transactions', withdrawId), {
        userId: user.uid,
        type: 'withdraw',
        amount: withdrawAmount,
        method: method,
        transactionId: account,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast.success('LIQUIDATION REQUEST LOGGED. AWAITING CLEARANCE.');
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
          <h1 className="text-2xl font-black uppercase tracking-tight">System Liquidation</h1>
        </header>

        <div className="p-8 bg-surface rounded-3xl border border-accent/40 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4">Liquid Assets Available</p>
            <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">{formatCurrency(profile?.balance || 0)}</h2>
          </div>
          <Wallet className="absolute -bottom-8 -right-8 w-48 h-48 text-accent opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface border border-border-ui rounded-3xl p-6 space-y-6">
             <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-4 block ml-1">Egress Protocol</label>
              <div className="relative">
                <select
                  required
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-black/40 border border-border-ui rounded-xl p-4 font-black uppercase tracking-widest text-xs focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer text-text-p"
                >
                  <option value="" disabled className="bg-bg">Select Terminal</option>
                  <option value="bKash" className="bg-bg">bKash (Personal)</option>
                  <option value="Nagad" className="bg-bg">Nagad (Personal)</option>
                  <option value="Rocket" className="bg-bg">Rocket (Personal)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-s">
                   <ChevronLeft size={16} className="-rotate-90" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-4 block ml-1">Target Account Terminal</label>
              <input
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-black/40 border border-border-ui rounded-xl p-4 font-mono font-black text-white uppercase tracking-widest focus:ring-1 focus:ring-accent outline-none transition-all placeholder:opacity-20"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s mb-4 block ml-1">Liquidation Magnitude (Min ৳{minWithdraw})</label>
              <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent font-black text-2xl">৳</div>
                 <input
                  type="number"
                  required
                  min={minWithdraw}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border-ui rounded-xl pl-10 pr-4 py-5 text-3xl font-black focus:ring-1 focus:ring-accent outline-none tracking-tighter text-white transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex gap-4">
              <Info className="text-accent shrink-0" size={24} />
              <p className="text-[11px] text-text-s font-black uppercase tracking-widest leading-relaxed">Liquidation sequences are verified within 24 operational hours. Protocol fees may be calculated at time of egress.</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-4 rounded-xl active:scale-[0.98] transition shadow-[0_0_20px_rgba(0,242,255,0.1)] flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-bg" /> : (
              <>
                Initialize Liquidation <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

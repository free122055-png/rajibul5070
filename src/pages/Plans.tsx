import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { InvestmentPlan } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { Package, Check, ArrowRight, Loader2, Sparkles, LayoutDashboard, Users, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Plans() {
  const { profile, user } = useAuth();
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'plans'), (snapshot) => {
      const plansList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentPlan));
      
      // If no plans exist (first time), let's suggest some defaults for the admin to create or auto-seed
      if (plansList.length === 0) {
        setPlans([
          { id: '1', name: 'Starter Plan', price: 500, dailyIncome: 25, duration: 30, totalReturn: 750 },
          { id: '2', name: 'Premium Plan', price: 1000, dailyIncome: 55, duration: 30, totalReturn: 1650 },
          { id: '3', name: 'Elite Plan', price: 5000, dailyIncome: 300, duration: 30, totalReturn: 9000 },
        ]);
      } else {
        setPlans(plansList);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleBuyPlan = async (plan: InvestmentPlan) => {
    if (!profile || !user) return;
    
    if (profile.balance < plan.price) {
      toast.error('Insufficient balance. Please deposit first.');
      return;
    }

    setBuyingPlanId(plan.id);
    try {
      const investmentId = Math.random().toString(36).substring(7);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);

      // 1. Deduct balance
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(-plan.price)
      });

      // 2. Create investment
      await setDoc(doc(db, 'investments', investmentId), {
        userId: user.uid,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        dailyIncome: plan.dailyIncome,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        lastClaimDate: startDate.toISOString(),
        status: 'active'
      });

      // 3. Create transaction log
      await setDoc(doc(db, 'transactions', 'INV_' + investmentId), {
        userId: user.uid,
        type: 'investment',
        amount: plan.price,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      toast.success(`${plan.name} purchased successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to purchase plan');
    } finally {
      setBuyingPlanId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <Loader2 className="animate-spin text-accent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg pb-24 text-text-p font-sans">
      {/* Header */}
      <div className="p-10 md:p-16 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-accent/20"
        >
          <Sparkles size={14} />
          High Returns Enabled
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 uppercase">Investment <span className="text-accent">Plans</span></h1>
        <p className="text-text-s text-base md:text-lg leading-relaxed max-w-2xl mx-auto uppercase tracking-wide font-medium">Select an operational protocol to initialize daily yield sequences.</p>
        
        <div className="mt-10 flex items-center justify-center gap-6 py-4 px-8 bg-surface border border-border-ui rounded-2xl w-fit mx-auto shadow-2xl">
          <p className="text-text-s text-xs font-bold uppercase tracking-widest">Available Credit:</p>
          <p className="text-2xl font-black text-white tracking-tight">{formatCurrency(profile?.balance || 0)}</p>
          <Link to="/deposit" className="text-[10px] bg-accent text-bg px-4 py-2 rounded-lg font-black uppercase tracking-widest hover:bg-[#00d8e6] transition-colors shadow-[0_0_15px_rgba(0,242,255,0.2)]">TOP UP</Link>
        </div>
      </div>

      {/* Plans List */}
      <div className="max-w-4xl mx-auto px-6 space-y-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-border-ui rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-accent/40 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-accent/10 transition-colors"></div>
            
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center text-bg font-black text-2xl shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              {plan.name[0].toUpperCase()}
            </div>

            <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="text-white font-black text-lg uppercase tracking-wider">{plan.name} Protocol</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-text-s font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1"><Check size={14} className="text-accent" /> Yield: {formatCurrency(plan.dailyIncome)}/day</span>
                <span className="flex items-center gap-1"><Check size={14} className="text-accent" /> Term: {plan.duration} Days</span>
                <span className="flex items-center gap-1"><Check size={14} className="text-accent" /> Total ROI: {formatCurrency(plan.totalReturn)}</span>
              </div>
            </div>

            <div className="text-center md:text-right min-w-[140px] space-y-2">
              <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(plan.price)}</p>
              <button
                onClick={() => handleBuyPlan(plan)}
                disabled={buyingPlanId === plan.id}
                className="w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,242,255,0.1)] active:scale-95 disabled:opacity-50"
              >
                {buyingPlanId === plan.id ? <Loader2 className="animate-spin text-bg mx-auto" size={18} /> : 'INITIALIZE'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

       {/* Mobile Nav Bar */}
       <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border-ui flex items-center justify-around z-50 px-6">
        <Link to="/dashboard" className="text-text-s flex flex-col items-center gap-1"><LayoutDashboard size={20} /><span className="text-[9px] uppercase font-bold">Home</span></Link>
        <Link to="/plans" className="text-accent flex flex-col items-center gap-1 font-black tracking-widest"><Package size={20} /><span className="text-[9px] uppercase">Plans</span></Link>
        <Link to="/referral" className="text-text-s flex flex-col items-center gap-1"><Users size={20} /><span className="text-[9px] uppercase font-bold">Team</span></Link>
        <Link to="/profile" className="text-text-s flex flex-col items-center gap-1"><User size={20} /><span className="text-[9px] uppercase font-bold">Safe</span></Link>
      </div>
    </div>
  );
}

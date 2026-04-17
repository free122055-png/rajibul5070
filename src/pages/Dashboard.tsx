import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { Transaction, Investment } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  LayoutDashboard,
  Package,
  CreditCard,
  Send,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch transactions
    const qTx = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      setRecentTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    // Fetch investments
    const qInv = query(
      collection(db, 'investments'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setActiveInvestments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment)));
    });

    return () => {
      unsubTx();
      unsubInv();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleClaimIncome = async (investment: Investment) => {
    if (!user || !profile) return;

    const lastClaim = new Date(investment.lastClaimDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      const remainingHours = Math.ceil(24 - diffHours);
      toast.error(`NEXT HARVEST IN ${remainingHours}h`);
      return;
    }

    try {
      // 1. Update investment last claim
      await updateDoc(doc(db, 'investments', investment.id), {
        lastClaimDate: now.toISOString()
      });

      // 2. Add income to balance
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(investment.dailyIncome)
      });

      // 3. Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: investment.dailyIncome,
        type: 'income',
        status: 'completed',
        method: 'Protocol Yield',
        createdAt: now.toISOString()
      });

      toast.success('YIELD HARVESTED');
    } catch (error) {
      toast.error('HARVEST FAILURE');
    }
  };

  const stats = [
    { label: 'Total Balance', value: formatCurrency(profile?.balance || 0), icon: Wallet, color: 'text-accent', bg: 'bg-accent/10', trend: '+2.4% today' },
    { label: 'Active Plan Assets', value: activeInvestments.length, icon: Package, color: 'text-accent', bg: 'bg-accent/10', trend: 'Running Ops' },
    { label: 'Projected Daily', value: formatCurrency(activeInvestments.reduce((acc, inv) => acc + inv.dailyIncome, 0)), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: 'ROI Optimized' },
    { label: 'Referral Credits', value: formatCurrency(0), icon: Users, color: 'text-accent', bg: 'bg-accent/10', trend: '12 Total' },
  ];

  return (
    <div className="flex min-h-screen bg-bg text-text-p font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-surface border-r border-border-ui py-8">
        <div className="px-6 mb-12">
          <h1 className="text-xl font-black tracking-[0.2em] text-accent uppercase">Nexus<span className="text-white">Invest</span></h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-6 py-4 text-accent bg-gradient-to-r from-accent/5 to-transparent border-l-[3px] border-accent font-bold text-sm">
            <LayoutDashboard size={18} />
            DASHBOARD
          </Link>
          <Link to="/plans" className="flex items-center gap-3 px-6 py-4 text-text-s hover:text-accent transition-all text-sm uppercase tracking-wider hover:bg-white/[0.02]">
            <Package size={18} />
            PLANS
          </Link>
          <Link to="/deposit" className="flex items-center gap-3 px-6 py-4 text-text-s hover:text-accent transition-all text-sm uppercase tracking-wider hover:bg-white/[0.02]">
            <CreditCard size={18} />
            DEPOSIT
          </Link>
          <Link to="/withdraw" className="flex items-center gap-3 px-6 py-4 text-text-s hover:text-accent transition-all text-sm uppercase tracking-wider hover:bg-white/[0.02]">
            <Send size={18} />
            WITHDRAW
          </Link>
          <Link to="/referral" className="flex items-center gap-3 px-6 py-4 text-text-s hover:text-accent transition-all text-sm uppercase tracking-wider hover:bg-white/[0.02]">
            <Users size={18} />
            NETWORK
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-6 py-4 text-text-s hover:text-accent transition-all text-sm uppercase tracking-wider hover:bg-white/[0.02]">
            <User size={18} />
            PROFILE
          </Link>
        </nav>

        <div className="px-6 mt-auto space-y-6">
           <div className="px-3 py-1 bg-security/10 border border-security/30 rounded text-[10px] font-bold text-security uppercase tracking-widest text-center">
              2FA SECURED
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-security/5 text-text-s hover:text-security transition-all text-xs font-bold">
              <LogOut size={16} />
              DISCONNECT
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-bg p-8">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">System Overview</h2>
            <p className="text-sm text-text-s">Terminal access granted for {profile?.displayName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-3 md:block hidden">
               <p className="text-sm font-bold text-white">{profile?.displayName}</p>
               <p className="text-[10px] text-text-s uppercase tracking-widest">ID: {profile?.referralCode}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface border border-accent flex items-center justify-center font-bold text-accent shadow-[0_0_15px_rgba(0,242,255,0.2)]">
              {profile?.displayName?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-card-glow p-6 bg-surface border border-border-ui rounded-xl shadow-xl hover:border-accent/40 transition-colors"
              >
                <p className="stat-label text-text-s text-[11px] uppercase tracking-wider font-bold">{stat.label}</p>
                <h3 className="stat-val text-white text-2xl font-bold my-2 flex items-baseline gap-2">
                   {stat.value}
                </h3>
                <p className="text-[11px] text-[#00ff88] font-bold uppercase tracking-widest">{stat.trend || '+2.4% today'}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* My Active Protocols */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface border border-border-ui rounded-2xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30"></div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="card-title text-base font-bold flex items-center gap-2">
                    <TrendingUp size={18} className="text-accent" />
                    ACTIVE PROTOCOLS
                  </h3>
                  <Link to="/plans" className="text-[10px] bg-accent/10 text-accent px-3 py-1 rounded border border-accent/20 font-black uppercase tracking-[0.2em] hover:bg-accent hover:text-bg transition-all">Init New Sequence</Link>
                </div>

                <div className="space-y-3">
                  {activeInvestments.length > 0 ? activeInvestments.map((inv) => {
                    const lastClaim = new Date(inv.lastClaimDate);
                    const diff = (new Date().getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
                    const canClaim = diff >= 24;

                    return (
                      <div key={inv.id} className="p-5 bg-black/20 border border-border-ui/50 rounded-xl flex items-center justify-between group hover:border-accent/30 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-accent/5 border border-accent/10 flex items-center justify-center text-accent">
                              <Package size={20} />
                           </div>
                           <div>
                              <p className="font-black text-white uppercase tracking-wider text-sm">{inv.planName}</p>
                              <p className="text-[10px] text-text-s uppercase font-bold tracking-widest mt-1">Earn: <span className="text-accent">{formatCurrency(inv.dailyIncome)}</span> / day</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right hidden md:block">
                              <p className="text-[10px] text-text-s uppercase font-bold tracking-widest leading-none">Status</p>
                              <p className="text-xs font-black text-[#00ff88] uppercase mt-1">Operational</p>
                           </div>
                           <button 
                            onClick={() => handleClaimIncome(inv)}
                            className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                              canClaim 
                                ? 'bg-accent text-bg shadow-[0_0_15px_rgba(0,242,255,0.2)] hover:scale-105' 
                                : 'bg-white/5 text-text-s border border-border-ui cursor-not-allowed opacity-50'
                            }`}
                           >
                              {canClaim ? 'Harvest Yield' : 'Extracting...'}
                           </button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-12 text-center text-text-s bg-black/10 rounded-xl border border-dashed border-border-ui/30">
                       <p className="uppercase font-black text-[10px] tracking-[0.3em] opacity-40">Zero Active Sequences Detected</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-surface border border-border-ui rounded-2xl p-6 flex flex-col shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="card-title text-base font-bold flex items-center gap-2">
                    RECENT TRANSACTIONS
                  </h3>
                  <Link to="/history" className="text-xs text-accent uppercase font-bold tracking-widest hover:underline">View History</Link>
                </div>

                <div className="transaction-list space-y-1">
                  {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
                    <div key={tx.id} className="tx-item flex items-center justify-between p-4 border-b border-border-ui/50 last:border-0 hover:bg-white/[0.02] transition-all rounded-lg">
                      <div className="tx-info space-y-1">
                         <p className="text-[13px] font-bold uppercase tracking-wide text-text-p">{tx.type} Sequence</p>
                         <p className="text-[11px] text-text-s uppercase tracking-wider">{tx.method || 'Internal'} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`tx-amount font-bold text-sm ${
                          tx.type === 'deposit' || tx.type === 'income' ? 'text-[#00ff88]' : 'text-security'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <p className={`text-[10px] font-black tracking-widest uppercase ${
                          tx.status === 'completed' || tx.status === 'approved' ? 'text-accent' :
                          tx.status === 'pending' ? 'text-orange-500' : 'text-security'
                        }`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center text-text-s bg-black/20 rounded-xl border border-dashed border-border-ui/50">
                      NO ACTIVE DATA LOGS
                    </div>
                  )}
                </div>
                <Link to="/history" className="mt-6 w-full py-3 bg-transparent border border-border-ui hover:bg-white/[0.03] text-center text-text-p rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                   Generate Full Statement
                </Link>
              </div>
            </div>

            {/* Referral / Network Panel */}
            <div className="bg-surface border border-border-ui rounded-2xl p-6 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="card-title text-base font-bold">NETWORK STATUS</h3>
                <Users size={18} className="text-accent" />
              </div>
              
              <div className="referral-box bg-gradient-to-br from-[#0d1117] to-[#1a1f28] border border-accent/40 rounded-xl p-6 flex flex-col items-center text-center shadow-[inset_0_0_20px_rgba(0,242,255,0.05)]">
                 <p className="stat-label text-white text-[11px] font-black tracking-[0.2em] mb-2 uppercase">Your Network Link</p>
                 <p className="text-[11px] text-text-s mb-6">Earn <span className="text-accent font-bold">10% COMMISSION</span> on all new verified deposits.</p>
                 
                 <div className="w-full bg-black/50 border border-border-ui border-dashed rounded-lg p-3 group relative cursor-pointer hover:border-accent transition-all">
                    <code className="text-accent font-mono text-sm tracking-widest font-bold">{profile?.referralCode || 'N/A'}</code>
                    <div 
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.referralCode || '');
                        toast.success('Protocol address copied');
                      }}
                       className="absolute inset-0 flex items-center justify-center bg-accent text-bg opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs"
                    >
                       COPY PROTOCOL
                    </div>
                 </div>
              </div>

               <div className="mt-10 space-y-4">
                  <Link to="/deposit" className="w-full block text-center py-4 bg-accent hover:bg-[#00d8e6] text-bg rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.15)] transition-all">
                     Load System Funds
                  </Link>
                  <Link to="/withdraw" className="w-full block text-center py-4 bg-transparent border border-border-ui hover:bg-white/[0.03] text-text-p rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                     Initiate Payout
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border-ui flex items-center justify-around z-50 px-6">
        <Link to="/dashboard" className="text-accent flex flex-col items-center gap-1 transition-all"><LayoutDashboard size={20} /><span className="text-[9px] font-black tracking-widest uppercase">Home</span></Link>
        <Link to="/plans" className="text-text-s flex flex-col items-center gap-1"><Package size={20} /><span className="text-[9px] uppercase font-bold">Plans</span></Link>
        <Link to="/referral" className="text-text-s flex flex-col items-center gap-1"><Users size={20} /><span className="text-[9px] uppercase font-bold">Team</span></Link>
        <Link to="/profile" className="text-text-s flex flex-col items-center gap-1"><User size={20} /><span className="text-[9px] uppercase font-bold">Safe</span></Link>
      </div>
    </div>
  );
}

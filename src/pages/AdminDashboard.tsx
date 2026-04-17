import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment, getDoc, where, setDoc } from 'firebase/firestore';
import { Transaction, UserProfile, InvestmentPlan } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  Check, 
  X, 
  Search,
  LayoutDashboard,
  Package,
  Activity,
  Plus,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'withdraws' | 'users' | 'plans' | 'settings'>('overview');
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [pendingWithdraws, setPendingWithdraws] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [siteSettings, setSiteSettings] = useState({
    bkash: '',
    nagad: '',
    rocket: '',
    minWithdraw: 100,
    minDeposit: 500
  });

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, dailyIncome: 0, duration: 30 });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedAdminUser, setSelectedAdminUser] = useState<UserProfile | null>(null);
  const [userBalanceUpdate, setUserBalanceUpdate] = useState<number>(0);

  // Real-time listeners
  useEffect(() => {
    // Users count
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsers(snap.size);
      setAllUsers(snap.docs.map(doc => doc.data() as UserProfile));
    });

    // Pending Deposits
    const qDep = query(collection(db, 'transactions'), where('type', '==', 'deposit'), where('status', '==', 'pending'));
    const unsubDep = onSnapshot(qDep, (snap) => setPendingDeposits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))));

    // Pending Withdraws
    const qWd = query(collection(db, 'transactions'), where('type', '==', 'withdraw'), where('status', '==', 'pending'));
    const unsubWd = onSnapshot(qWd, (snap) => setPendingWithdraws(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction))));

    // Plans
    const unsubPlans = onSnapshot(collection(db, 'plans'), (snap) => setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentPlan))));

    // Site Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        setSiteSettings(snap.data() as any);
      }
    });

    return () => {
      unsubUsers();
      unsubDep();
      unsubWd();
      unsubPlans();
      unsubSettings();
    };
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'settings', 'general'), siteSettings);
      toast.success('SYSTEM SETTINGS UPDATED');
    } catch (error) {
      toast.error('UPDATE FAILURE');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planId = 'PLAN_' + Math.random().toString(36).substring(7).toUpperCase();
      await setDoc(doc(db, 'plans', planId), {
        ...newPlan,
        totalReturn: newPlan.dailyIncome * newPlan.duration
      });
      toast.success('PROTOCOL INITIALIZED');
      setIsPlanModalOpen(false);
      setNewPlan({ name: '', price: 0, dailyIncome: 0, duration: 30 });
    } catch (error) {
      toast.error('PROTOCOL FAILURE');
    }
  };

  const handleUpdateUserBalance = async () => {
    if (!selectedAdminUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedAdminUser.uid), {
        balance: increment(userBalanceUpdate)
      });
      toast.success('UNIT CREDIT UPDATED');
      setIsUserModalOpen(false);
      setUserBalanceUpdate(0);
    } catch (error) {
      toast.error('CREDIT FAILURE');
    }
  };

  const handleApproveDeposit = async (tx: Transaction) => {
    try {
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', tx.userId), { balance: increment(tx.amount) });
      toast.success('DEPOSIT AUTHORIZED');
    } catch (error) {
      toast.error('AUTH FAILURE');
    }
  };

  const handleRejectTransaction = async (txId: string) => {
    try {
      await updateDoc(doc(db, 'transactions', txId), { status: 'rejected' });
      toast.error('TRANSACTION REJECTED');
    } catch (error) {
      toast.error('REJECTION FAILURE');
    }
  };

  const handleApproveWithdraw = async (tx: Transaction) => {
     try {
      const userDoc = await getDoc(doc(db, 'users', tx.userId));
      const userData = userDoc.data() as UserProfile;

      if (userData.balance < tx.amount) {
        toast.error('INSUFFICIENT UNIT CREDIT');
        return;
      }

      await updateDoc(doc(db, 'users', tx.userId), { balance: increment(-tx.amount) });
      await updateDoc(doc(db, 'transactions', tx.id), { status: 'approved' });
      toast.success('LIQUIDATION AUTHORIZED');
    } catch (error) {
      toast.error('AUTH FAILURE');
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-surface border border-border-ui rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-20 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-text-s text-[10px] font-black uppercase tracking-[0.3em] mb-4">Total Units</p>
          <h3 className="text-5xl font-black text-white italic">{totalUsers}</h3>
          <Users className="absolute -bottom-4 -right-4 w-24 h-24 text-accent opacity-5 rotate-12" />
        </div>
        <div className="p-8 bg-surface border border-border-ui rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
          <p className="text-text-s text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pending Inbound</p>
          <h3 className="text-5xl font-black text-accent italic">{pendingDeposits.length}</h3>
          <ArrowUpRight className="absolute -bottom-4 -right-4 w-24 h-24 text-accent opacity-5 rotate-12" />
        </div>
        <div className="p-8 bg-surface border border-border-ui rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-security"></div>
          <p className="text-text-s text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pending Egress</p>
          <h3 className="text-5xl font-black text-security italic">{pendingWithdraws.length}</h3>
          <ShieldAlert className="absolute -bottom-4 -right-4 w-24 h-24 text-security opacity-5 rotate-12" />
        </div>
      </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3 px-2 text-accent"><Activity size={18} /> Recent Inbound Protocols</h4>
            <div className="space-y-3">
              {pendingDeposits.slice(0, 3).map(tx => (
                <div key={tx.id} className="p-5 bg-surface border border-border-ui rounded-xl flex items-center justify-between group hover:border-accent/40 transition-colors">
                  <div>
                    <p className="font-black text-white text-lg tracking-tight">{formatCurrency(tx.amount)}</p>
                    <p className="text-[10px] text-text-s font-bold uppercase tracking-widest mt-1 opacity-60">{tx.method} // {tx.transactionId}</p>
                  </div>
                  <button onClick={() => setActiveTab('deposits')} className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/40 border border-border-ui px-4 py-2 rounded-lg hover:border-accent hover:text-accent transition-all">MANAGE</button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-3 px-2 text-security"><ShieldAlert size={18} /> Recent Egress Requests</h4>
            <div className="space-y-3">
              {pendingWithdraws.slice(0, 3).map(tx => (
                <div key={tx.id} className="p-5 bg-surface border border-border-ui rounded-xl flex items-center justify-between group hover:border-security/40 transition-colors">
                  <div>
                    <p className="font-black text-white text-lg tracking-tight">{formatCurrency(tx.amount)}</p>
                    <p className="text-[10px] text-text-s font-bold uppercase tracking-widest mt-1 opacity-60">{tx.method} // {tx.transactionId}</p>
                  </div>
                  <button onClick={() => setActiveTab('withdraws')} className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/40 border border-border-ui px-4 py-2 rounded-lg hover:border-security hover:text-security transition-all">MANAGE</button>
                </div>
              ))}
            </div>
          </div>
       </div>
    </div>
  );

  const renderDeposits = () => (
    <div className="space-y-8">
      <h3 className="text-xl font-black uppercase tracking-[0.3em] px-2">Inbound Clearance</h3>
      <div className="space-y-4">
        {pendingDeposits.length > 0 ? pendingDeposits.map(tx => (
          <div key={tx.id} className="p-8 bg-surface border border-border-ui rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-30"></div>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter text-white italic">{formatCurrency(tx.amount)}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Terminal: <span className="text-accent">{tx.method}</span></p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Hash: <span className="text-white font-mono opacity-80">{tx.transactionId}</span></p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Logged: <span className="text-white">{new Date(tx.createdAt).toLocaleString()}</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleApproveDeposit(tx)} className="flex-1 md:flex-none px-8 py-4 bg-accent hover:bg-[#00d8e6] text-bg font-black rounded-xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.1)] flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                <Check size={18} /> Authorize
              </button>
              <button onClick={() => handleRejectTransaction(tx.id)} className="flex-1 md:flex-none px-8 py-4 bg-black/40 hover:bg-security/10 hover:text-security text-text-s font-black rounded-xl border border-border-ui hover:border-security transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                <X size={18} /> Discard
              </button>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center bg-surface rounded-[2rem] border border-dashed border-border-ui">
             <p className="text-text-s font-black uppercase tracking-[0.4em] opacity-40">Zero Inbound Rows Pending</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWithdraws = () => (
    <div className="space-y-8">
      <h3 className="text-xl font-black uppercase tracking-[0.3em] px-2">Egress Verification</h3>
      <div className="space-y-4">
        {pendingWithdraws.length > 0 ? pendingWithdraws.map(tx => (
          <div key={tx.id} className="p-8 bg-surface border border-border-ui rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-security opacity-30"></div>
            <div className="space-y-2">
              <p className="text-4xl font-black tracking-tighter text-white italic">{formatCurrency(tx.amount)}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Terminal: <span className="text-security">{tx.method}</span></p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Target: <span className="text-white font-mono opacity-80">{tx.transactionId}</span></p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-s">Logged: <span className="text-white">{new Date(tx.createdAt).toLocaleString()}</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => handleApproveWithdraw(tx)} className="flex-1 md:flex-none px-8 py-4 bg-security hover:bg-[#ff4d70] text-bg font-black rounded-xl transition-all shadow-[0_0_20px_rgba(255,45,85,0.1)] flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                <Check size={18} /> Appr & Liquidate
              </button>
              <button onClick={() => handleRejectTransaction(tx.id)} className="flex-1 md:flex-none px-8 py-4 bg-black/40 hover:bg-white/5 text-text-s font-black rounded-xl border border-border-ui transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                <X size={18} /> Discard
              </button>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center bg-surface rounded-[2rem] border border-dashed border-border-ui">
             <p className="text-text-s font-black uppercase tracking-[0.4em] opacity-40">Zero Egress Rows Pending</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-text-p font-sans">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 bg-surface border-r border-border-ui shadow-2xl relative z-20">
        <div className="p-10 pb-16">
           <h1 className="text-2xl font-black tracking-[0.1em] uppercase text-accent italic">Nexus<span className="text-white">Admin</span></h1>
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-text-s mt-2 opacity-60">System Core 01</p>
        </div>

        <nav className="flex-1 px-6 space-y-4">
           {[
             { id: 'overview', label: 'Monitor', icon: LayoutDashboard },
             { id: 'deposits', label: 'Inbound', icon: CreditCard, count: pendingDeposits.length },
             { id: 'withdraws', label: 'Egress', icon: ArrowUpRight, count: pendingWithdraws.length },
             { id: 'users', label: 'Units', icon: Users },
             { id: 'plans', label: 'Protocols', icon: Package },
             { id: 'settings', label: 'Systems', icon: Settings },
           ].map(item => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all group ${
                 activeTab === item.id 
                  ? 'bg-accent text-bg shadow-[0_0_20px_rgba(0,242,255,0.2)] font-black' 
                  : 'text-text-s hover:bg-accent/5 hover:text-accent border border-transparent hover:border-accent/20'
               }`}
             >
               <div className="flex items-center gap-4">
                 <item.icon size={20} />
                 <span className="text-[11px] uppercase tracking-widest leading-none">{item.label}</span>
               </div>
               {item.count ? <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${activeTab === item.id ? 'bg-bg text-accent' : 'bg-accent text-bg'}`}>{item.count}</span> : null}
             </button>
           ))}
        </nav>

        <div className="p-10 mt-auto border-t border-border-ui/30">
           <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center font-black text-bg shadow-[0_0_15px_rgba(0,242,255,0.1)] group-hover:scale-105 transition-transform uppercase">S</div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">Super Admin</p>
                <p className="text-[9px] text-[#00ff88] font-black uppercase tracking-[0.2em] mt-1">Status: Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 min-h-screen overflow-y-auto p-12 lg:p-16 space-y-16 pb-40 scroll-smooth">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-10 pb-10 border-b border-border-ui/30">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight uppercase italic text-white">{activeTab} Interface</h2>
            <p className="text-xs font-bold text-text-s uppercase tracking-[0.2em] opacity-60">System-wide monitoring enabled // Operational Status: Normal</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-s group-focus-within:text-accent transition-colors" size={18} />
               <input className="bg-surface border border-border-ui rounded-xl pl-11 pr-4 py-4 min-w-[350px] outline-none focus:ring-1 focus:ring-accent transition-all font-black uppercase text-[10px] tracking-widest placeholder:opacity-20 text-white" placeholder="QUERY SYSTEM DATA..." />
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'deposits' && renderDeposits()}
            {activeTab === 'withdraws' && renderWithdraws()}
            {activeTab === 'users' && (
              <div className="space-y-8">
                 <h3 className="text-xl font-black uppercase tracking-[0.3em] px-2 text-white italic">Operational Units ({allUsers.length})</h3>
                 <div className="bg-surface border border-border-ui rounded-[2rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                      <thead className="bg-black/40 border-b border-border-ui">
                        <tr>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] text-text-s">Designation</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] text-text-s">Credit Balance</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] text-text-s">Clearance</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.4em] text-text-s">Access</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-ui/30">
                        {allUsers.map(u => (
                          <tr key={u.uid} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-black text-xs uppercase shadow-[0_0_10px_rgba(0,242,255,0.05)]">{u.displayName?.[0] || 'U'}</div>
                                 <div>
                                   <p className="font-black text-white uppercase tracking-wider text-sm">{u.displayName}</p>
                                   <p className="text-[10px] text-text-s uppercase font-bold tracking-widest opacity-60 mt-1">{u.email}</p>
                                 </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 font-mono text-white font-black text-base italic">{formatCurrency(u.balance)}</td>
                            <td className="px-8 py-6">
                               <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg ${u.role === 'admin' ? 'bg-security/10 text-security border border-security/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>{u.role} NODE</span>
                            </td>
                            <td className="px-8 py-6">
                              <button 
                                onClick={() => {
                                  setSelectedAdminUser(u);
                                  setIsUserModalOpen(true);
                                }}
                                className="text-[9px] font-black uppercase tracking-widest text-text-s hover:text-accent transition-all"
                              >
                                MANAGE UNIT
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            )}
            {activeTab === 'plans' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                 <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white italic">Protocol Definitions</h3>
                 <button 
                  onClick={() => setIsPlanModalOpen(true)}
                  className="flex items-center gap-3 px-8 py-3 bg-accent hover:bg-[#00d8e6] text-bg font-black rounded-xl text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.15)] transition-all active:scale-95"
                 >
                   <Plus size={18} /> Add Protocol
                 </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {plans.map(p => (
                    <div key={p.id} className="p-8 bg-surface border border-border-ui rounded-[2rem] group hover:border-accent transition-all relative overflow-hidden shadow-2xl">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent/10 transition-colors"></div>
                       <div className="flex items-start justify-between mb-8">
                          <h4 className="font-black text-white uppercase tracking-wider text-lg">{p.name}</h4>
                          <span className="text-accent bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">{p.duration}D TERM</span>
                       </div>
                       <div className="space-y-4 mb-10">
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-text-s">
                             <span>Egress Min</span>
                             <span className="text-white italic">{formatCurrency(p.price)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-text-s">
                             <span>Daily Yield</span>
                             <span className="text-[#00ff88] italic">{formatCurrency(p.dailyIncome)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-text-s">
                             <span>Total Projection</span>
                             <span className="text-[#00ff88] italic font-black">{formatCurrency(p.totalReturn)}</span>
                          </div>
                       </div>
                       <button className="w-full py-4 bg-black/40 hover:bg-accent text-text-s hover:text-bg font-black rounded-xl border border-border-ui hover:border-accent transition-all uppercase tracking-widest text-[10px]">Modify Protocol</button>
                    </div>
                  ))}
                  {plans.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 py-24 text-center bg-surface rounded-[2rem] border border-dashed border-border-ui">
                       <p className="text-text-s font-black uppercase tracking-[0.4em] opacity-40">Zero Protocol Definitions Detected</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <h3 className="text-xl font-black uppercase tracking-[0.3em] px-2 text-white italic">System Configuration</h3>
                 <div className="p-10 bg-surface border border-border-ui rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-accent/30"></div>
                    <form onSubmit={handleUpdateSettings} className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-text-s pl-1">bKash Terminal</label>
                             <input 
                                value={siteSettings.bkash}
                                onChange={e => setSiteSettings({...siteSettings, bkash: e.target.value})}
                                className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-accent transition-colors" 
                                placeholder="017XXXXXXXX"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-text-s pl-1">Nagad Terminal</label>
                             <input 
                                value={siteSettings.nagad}
                                onChange={e => setSiteSettings({...siteSettings, nagad: e.target.value})}
                                className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-accent transition-colors" 
                                placeholder="018XXXXXXXX"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-text-s pl-1">Rocket Terminal</label>
                             <input 
                                value={siteSettings.rocket}
                                onChange={e => setSiteSettings({...siteSettings, rocket: e.target.value})}
                                className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-accent transition-colors" 
                                placeholder="019XXXXXXXX"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-text-s pl-1">Min Liquidation (৳)</label>
                             <input 
                                type="number"
                                value={siteSettings.minWithdraw}
                                onChange={e => setSiteSettings({...siteSettings, minWithdraw: Number(e.target.value)})}
                                className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-mono text-sm outline-none focus:border-accent transition-colors" 
                             />
                          </div>
                       </div>
                       <button type="submit" className="w-full py-4 bg-accent hover:bg-[#00d8e6] text-bg font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,242,255,0.1)] transition-all">Overwrite System Config</button>
                    </form>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav for Admin */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border-ui flex items-center justify-around z-50 px-6">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'text-accent' : 'text-text-s'}><LayoutDashboard size={22} /></button>
        <button onClick={() => setActiveTab('deposits')} className={activeTab === 'deposits' ? 'text-accent' : 'text-text-s'}><CreditCard size={22} /></button>
        <button onClick={() => setActiveTab('withdraws')} className={activeTab === 'withdraws' ? 'text-accent' : 'text-text-s'}><ArrowUpRight size={22} /></button>
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'text-accent' : 'text-text-s'}><Users size={22} /></button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-accent' : 'text-text-s'}><Settings size={22} /></button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsPlanModalOpen(false)}
               className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-surface border border-border-ui rounded-[2.5rem] p-10 w-full max-w-lg relative z-10 shadow-3xl"
            >
               <h3 className="text-2xl font-black uppercase italic text-white mb-8">Deploy Protocol</h3>
               <form onSubmit={handleCreatePlan} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-s block pl-1">Protocol Name</label>
                    <input 
                      required value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-s block pl-1">Egress Entry (৳)</label>
                      <input 
                        type="number" required value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: Number(e.target.value)})}
                        className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-accent transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-s block pl-1">Daily Yield (৳)</label>
                      <input 
                        type="number" required value={newPlan.dailyIncome} onChange={e => setNewPlan({...newPlan, dailyIncome: Number(e.target.value)})}
                        className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-s block pl-1">Term Duration (Days)</label>
                    <input 
                      type="number" required value={newPlan.duration} onChange={e => setNewPlan({...newPlan, duration: Number(e.target.value)})}
                      className="w-full bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <button type="submit" className="w-full py-5 bg-accent text-bg font-black rounded-xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/10 mt-4">INITIATE DEPLOYMENT</button>
               </form>
            </motion.div>
          </div>
        )}

        {isUserModalOpen && selectedAdminUser && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsUserModalOpen(false)}
               className="absolute inset-0 bg-bg/80 backdrop-blur-md"
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-surface border border-border-ui rounded-[2.5rem] p-10 w-full max-w-lg relative z-10 shadow-3xl"
            >
               <h3 className="text-2xl font-black uppercase italic text-white mb-2">Modify Unit</h3>
               <p className="text-xs text-text-s uppercase tracking-widest mb-8">{selectedAdminUser.displayName} // {selectedAdminUser.email}</p>
               
               <div className="space-y-8">
                  <div className="p-6 bg-black/40 rounded-2xl border border-border-ui text-center">
                     <p className="text-[10px] uppercase tracking-widest font-black text-text-s mb-2">Current Unit Credits</p>
                     <p className="text-3xl font-black text-white italic">{formatCurrency(selectedAdminUser.balance)}</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-s block pl-1 text-center">Credit Modification Value (৳)</label>
                    <div className="flex items-center gap-4">
                       <button onClick={() => setUserBalanceUpdate(prev => prev - 500)} className="w-12 h-12 rounded-xl bg-security/10 text-security border border-security/20 flex items-center justify-center font-black">-</button>
                       <input 
                        type="number" value={userBalanceUpdate} onChange={e => setUserBalanceUpdate(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-border-ui rounded-xl px-5 py-4 text-white font-black text-center text-xl outline-none focus:border-accent transition-colors"
                      />
                      <button onClick={() => setUserBalanceUpdate(prev => prev + 500)} className="w-12 h-12 rounded-xl bg-accent/10 text-accent border border-accent/20 flex items-center justify-center font-black">+</button>
                    </div>
                    <p className="text-[9px] text-text-s uppercase tracking-widest text-center opacity-40">Positive for add, negative for deduct</p>
                  </div>

                  <button 
                    onClick={handleUpdateUserBalance}
                    className="w-full py-5 bg-white text-bg font-black rounded-xl uppercase tracking-[0.2em] text-xs shadow-xl mt-4 hover:scale-[1.02] transition-transform"
                  >
                    CONFIRM UNIT MODIFICATION
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

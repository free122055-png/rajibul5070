import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  Loader2, 
  Camera, 
  Key,
  Smartphone,
  CheckCircle2,
  Package,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phone: phone
      });
      toast.success('PROFILE DATA SYNCHRONIZED');
    } catch (error) {
      toast.error('TRANSMISSION FAILURE');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg text-text-p p-6 pb-32 lg:pb-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-surface border border-border-ui flex items-center justify-center hover:bg-accent/10 transition group">
            <ChevronLeft size={20} className="text-text-s group-hover:text-accent" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Security Vault</h1>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Info */}
          <aside className="lg:w-1/3 space-y-8">
            <div className="relative group w-32 h-32 mx-auto lg:mx-0">
               <div className="w-32 h-32 rounded-2xl bg-accent flex items-center justify-center text-4xl font-black text-bg shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                  {profile?.displayName?.[0].toUpperCase()}
               </div>
               <button className="absolute bottom-1 -right-1 p-3 bg-surface border border-border-ui text-accent rounded-xl shadow-xl hover:scale-110 transition cursor-pointer">
                  <Camera size={18} />
               </button>
            </div>
            
            <div className="text-center lg:text-left">
               <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{profile?.displayName}</h2>
               <p className="text-text-s font-bold uppercase tracking-widest text-[11px] mt-1">{profile?.email}</p>
               <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[#00ff88]/20">
                  <ShieldCheck size={12} /> VERIFIED UNIT
               </div>
            </div>

            <nav className="hidden lg:block space-y-3">
               <button className="w-full text-left px-5 py-4 rounded-xl bg-accent text-bg font-black text-xs uppercase tracking-widest transition-all">Identity Parameters</button>
               <button className="w-full text-left px-5 py-4 rounded-xl bg-surface text-text-s border border-border-ui font-black text-xs uppercase tracking-widest hover:text-accent hover:border-accent transition-all">Secure Protocols</button>
               <button className="w-full text-left px-5 py-4 rounded-xl bg-surface text-[#ff2d55] border border-border-ui font-black text-xs uppercase tracking-widest hover:bg-[#ff2d55]/10 transition-all" onClick={handleLogout}>Terminate Session</button>
            </nav>
          </aside>

          {/* Settings Form */}
          <div className="flex-1 space-y-8">
             <section className="bg-surface border border-border-ui rounded-[2rem] p-8 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-accent">Unit Definitions</h3>
                
                <form onSubmit={handleUpdate} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s ml-1">Assigned Name</label>
                        <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-s opacity-40" size={18} />
                           <input disabled className="w-full bg-black/20 border border-border-ui/30 rounded-xl pl-11 pr-4 py-4 text-text-s cursor-not-allowed font-black uppercase tracking-widest text-[11px]" value={profile?.displayName} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s ml-1">Communication Channel</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-s opacity-40" size={18} />
                           <input disabled className="w-full bg-black/20 border border-border-ui/30 rounded-xl pl-11 pr-4 py-4 text-text-s cursor-not-allowed font-black uppercase tracking-widest text-xs" value={profile?.email} />
                        </div>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-s ml-1">Mobile Terminal ID</label>
                        <div className="relative group">
                           <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-s group-focus-within:text-accent transition-colors" size={18} />
                           <input 
                              type="tel" 
                              value={phone} 
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full bg-black/40 border border-border-ui rounded-xl pl-11 pr-4 py-5 focus:ring-1 focus:ring-accent outline-none transition-all font-mono font-black text-white tracking-widest" 
                              placeholder="+8801XXXXXXXXX" 
                           />
                        </div>
                      </div>
                   </div>

                   <button 
                      type="submit" 
                      disabled={isUpdating}
                      className="px-10 py-4 bg-accent hover:bg-[#00d8e6] text-bg font-black rounded-xl transition shadow-[0_0_20px_rgba(0,242,255,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest text-xs"
                   >
                     {isUpdating ? <Loader2 className="animate-spin text-bg" size={18} /> : 'Sync Parameters'}
                   </button>
                </form>
             </section>

             <section className="bg-surface border border-border-ui rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-accent/5 text-accent rounded-xl flex items-center justify-center border border-accent/20">
                         <Smartphone size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-white uppercase tracking-widest text-sm">Dual-Factor Lockdown</h3>
                        <p className="text-[10px] text-text-s mt-1 font-bold uppercase tracking-widest opacity-60">Initialize extra-layer encryption shielding</p>
                      </div>
                   </div>
                   <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile?.twoFactorEnabled} readOnly />
                      <div className="w-12 h-6 bg-border-ui/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-bg after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-text-s after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-bg shadow-inner"></div>
                   </div>
                </div>
                
                <div className="pt-8 border-t border-border-ui/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button className="flex items-center justify-center gap-3 p-5 bg-black/20 hover:bg-accent/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-border-ui hover:border-accent transition-all text-text-s hover:text-accent">
                      <Key size={16} /> Encryption Keys
                   </button>
                   <button className="flex items-center justify-center gap-3 p-5 bg-black/20 hover:bg-accent/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-border-ui hover:border-accent transition-all text-text-s hover:text-accent">
                      <CheckCircle2 size={16} /> Valid Sessions
                   </button>
                </div>
             </section>
          </div>
        </div>
      </div>

       {/* Mobile Nav Bar */}
       <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border-ui flex items-center justify-around z-50 px-6">
        <Link to="/dashboard" className="text-text-s flex flex-col items-center gap-1"><LayoutDashboard size={20} /><span className="text-[9px] uppercase font-bold">Home</span></Link>
        <Link to="/plans" className="text-text-s flex flex-col items-center gap-1"><Package size={20} /><span className="text-[9px] uppercase font-bold">Plans</span></Link>
        <Link to="/referral" className="text-text-s flex flex-col items-center gap-1"><Users size={20} /><span className="text-[9px] uppercase font-bold">Team</span></Link>
        <Link to="/profile" className="text-accent flex flex-col items-center gap-1 font-black tracking-widest"><UserIcon size={20} /><span className="text-[9px] uppercase">Safe</span></Link>
      </div>
    </div>
  );
}

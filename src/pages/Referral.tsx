import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, UserPlus, Gift, Copy, CheckCircle2, ChevronLeft, LayoutDashboard, Package, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ReferralPage() {
  const { profile } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.referralCode) return;

    const q = query(
      collection(db, 'users'),
      where('referredBy', '==', profile.referralCode)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

  const referralLink = `${window.location.origin}/register?ref=${profile?.referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Protocol address copied');
  };

  const steps = [
    { title: 'Share Link', desc: 'Distribute network URI', icon: Copy },
    { title: 'Unit Join', desc: 'Secure new operative registration', icon: UserPlus },
    { title: 'Yield Bonus', desc: 'Earn 10% on verified credits', icon: Gift },
  ];

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-accent animate-pulse font-black uppercase tracking-[0.3em]">Loading Protocol...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-p p-6 pb-24 lg:pb-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-surface border border-border-ui flex items-center justify-center hover:bg-accent/10 transition group">
            <ChevronLeft size={20} className="text-text-s group-hover:text-accent" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Referral Network</h1>
        </header>

        {/* Hero Card */}
        <div className="relative p-8 md:p-12 bg-surface rounded-[2rem] border border-accent/40 overflow-hidden group shadow-2xl shadow-accent/5">
           <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-none text-white uppercase italic">Nexus Multiplier.</h2>
            <p className="text-text-s text-base mb-8 uppercase tracking-wide font-medium">Initialize network growth protocols and secure continuous yield commissions.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 bg-black/40 rounded-xl p-4 border border-border-ui flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent mb-1">Network Access URI</p>
                    <p className="text-xs font-mono text-text-p truncate opacity-70">{referralLink}</p>
                  </div>
                  <button onClick={() => copyToClipboard(referralLink)} className="p-3 bg-surface hover:bg-accent/10 rounded-xl border border-border-ui transition group">
                    <Copy size={18} className="text-text-s group-hover:text-accent" />
                  </button>
               </div>
               <div className="bg-black/40 rounded-xl p-4 border border-border-ui flex items-center justify-between min-w-[140px]">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent mb-1">Unit ID</p>
                    <p className="font-mono font-black text-white uppercase tracking-widest">{profile?.referralCode}</p>
                  </div>
                  <button onClick={() => copyToClipboard(profile?.referralCode || '')} className="p-3 bg-surface hover:bg-accent/10 rounded-xl border border-border-ui transition group">
                    <Copy size={18} className="text-text-s group-hover:text-accent" />
                  </button>
               </div>
            </div>
          </div>
          
          <Users className="absolute -bottom-12 -right-12 w-80 h-80 text-accent/5 group-hover:text-accent/10 transition-all duration-1000 rotate-12" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-surface border border-border-ui rounded-2xl text-center group hover:border-accent/30 transition-colors"
            >
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-4 border border-accent/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                <step.icon size={24} />
              </div>
              <h4 className="font-black mb-1 uppercase tracking-widest text-sm">{step.title}</h4>
              <p className="text-[11px] text-text-s uppercase font-bold tracking-wider">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Team List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black flex items-center gap-3 uppercase tracking-widest">
              <Users className="text-accent" />
              Operational Team ({team.length})
            </h3>
          </div>

          <div className="bg-surface border border-border-ui rounded-3xl overflow-hidden shadow-2xl">
            {team.length > 0 ? (
              <div className="divide-y divide-border-ui/30">
                {team.map((member) => (
                  <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center font-black text-accent border border-accent/30 uppercase shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                        {member.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-white uppercase tracking-wider text-sm">{member.displayName}</p>
                        <p className="text-[10px] text-text-s uppercase font-bold tracking-widest mt-1">LOGGED: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00ff88] flex items-center gap-2 justify-end">
                          <CheckCircle2 size={12} />
                          VERIFIED UNIT
                       </p>
                       <p className="text-[9px] text-text-s mt-1 font-bold uppercase tracking-widest">STATE: ACTIVE</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-24 text-center space-y-4">
                <Users size={64} className="mx-auto text-border-ui opacity-20 shadow-xl" />
                <div>
                  <h4 className="font-black text-text-s uppercase tracking-widest">No Unit detected</h4>
                  <p className="text-xs text-text-s opacity-50 uppercase tracking-wider mt-2">Initialize network growth to populate data rows.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Mobile Nav Bar */}
       <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-t border-border-ui flex items-center justify-around z-50 px-6">
        <Link to="/dashboard" className="text-text-s flex flex-col items-center gap-1 transition-all"><LayoutDashboard size={20} /><span className="text-[9px] uppercase font-bold">Home</span></Link>
        <Link to="/plans" className="text-text-s flex flex-col items-center gap-1"><Package size={20} /><span className="text-[9px] uppercase font-bold">Plans</span></Link>
        <Link to="/referral" className="text-accent flex flex-col items-center gap-1 font-black tracking-widest"><Users size={20} /><span className="text-[9px] uppercase">Team</span></Link>
        <Link to="/profile" className="text-text-s flex flex-col items-center gap-1"><User size={20} /><span className="text-[9px] uppercase font-bold">Safe</span></Link>
      </div>
    </div>
  );
}

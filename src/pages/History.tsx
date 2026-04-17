import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { ChevronLeft, Receipt, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="min-h-screen bg-bg text-text-p p-6 pb-24 lg:pb-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-surface border border-border-ui flex items-center justify-center hover:bg-accent/10 transition group">
            <ChevronLeft size={20} className="text-text-s group-hover:text-accent" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Transaction Logs</h1>
        </header>

        <div className="bg-surface border border-border-ui rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent/20"></div>
          
          {loading ? (
             <div className="p-20 text-center">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-s">Syncing with blockchain...</p>
             </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-border-ui/30">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border ${
                      tx.type === 'deposit' || tx.type === 'income' || tx.type === 'bonus'
                        ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                        : 'bg-[#ff2d55]/10 text-[#ff2d55] border-[#ff2d55]/20'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'income' || tx.type === 'bonus' 
                        ? <ArrowDownLeft size={22} /> 
                        : <ArrowUpRight size={22} />
                      }
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-wider text-sm">{tx.type} Protocol</p>
                      <p className="text-[10px] text-text-s uppercase font-bold tracking-widest mt-1 opacity-60">
                         {tx.method || 'System Internal'} • {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className={`text-lg font-black italic tracking-tighter ${
                      tx.type === 'deposit' || tx.type === 'income' || tx.type === 'bonus' ? 'text-[#00ff88]' : 'text-[#ff2d55]'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'income' || tx.type === 'bonus' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                       {tx.status === 'completed' || tx.status === 'approved' ? (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-1">
                             <CheckCircle2 size={12} /> verified
                          </span>
                       ) : tx.status === 'pending' ? (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-1">
                             <Clock size={12} /> pending
                          </span>
                       ) : (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-security flex items-center gap-1">
                             <XCircle size={12} /> rejected
                          </span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-24 text-center space-y-4">
              <Receipt size={64} className="mx-auto text-border-ui opacity-20" />
              <div>
                <h4 className="font-black text-text-s uppercase tracking-widest">No Sequences Detected</h4>
                <p className="text-xs text-text-s opacity-50 uppercase tracking-wider mt-2">Initialize operations to generate data logs.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

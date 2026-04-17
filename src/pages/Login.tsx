import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('System access granted');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Access denied');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-border-ui rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20"></div>
        <div className="absolute top-0 left-0 w-1/3 h-1 bg-accent"></div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-widest text-accent mb-2 uppercase">Nexus<span className="text-white">Invest</span></h1>
          <p className="text-text-s text-[10px] uppercase tracking-[0.3em] font-black">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Identity Gateway</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-s group-focus-within:text-accent transition-colors" />
              </div>
              <input
                {...register('email')}
                type="email"
                className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
                placeholder="EMAIL@DOMAIN.COM"
              />
            </div>
            {errors.email && <p className="text-security text-[11px] mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Access Protocol</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-s group-focus-within:text-accent transition-colors" />
              </div>
              <input
                {...register('password')}
                type="password"
                className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
                placeholder="********"
              />
            </div>
            {errors.password && <p className="text-security text-[11px] mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-bg" /> : (
              <>
                Initialize Access <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[12px]">
          <span className="text-text-s">New operative? </span>
          <Link to="/register" className="text-accent hover:underline font-black uppercase tracking-wider">Register Unit</Link>
        </div>
      </motion.div>
    </div>
  );
}

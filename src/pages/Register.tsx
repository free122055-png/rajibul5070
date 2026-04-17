import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Loader2, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: refCode || '',
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      // 1. Create Auth User
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);

      // 2. Generate own referral code
      const myRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 3. Create Profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: data.email,
        displayName: data.fullName,
        phone: data.phone,
        balance: 0,
        referralCode: myRefCode,
        referredBy: data.referralCode || null,
        role: 'user',
        createdAt: new Date().toISOString(),
        kycStatus: 'not_submitted',
        twoFactorEnabled: false,
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-surface border border-border-ui rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] hide-scrollbar relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20"></div>
        <div className="absolute top-0 left-0 w-1/4 h-1 bg-accent transition-all duration-1000"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-widest text-accent mb-2 uppercase">Nexus<span className="text-white">Invest</span></h1>
          <p className="text-text-s text-[10px] uppercase tracking-[0.3em] font-black">Register New Operational Unit</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Legal Designation</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-s group-focus-within:text-accent" />
              </div>
              <input
                {...register('fullName')}
                className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
                placeholder="FULL NAME"
              />
            </div>
            {errors.fullName && <p className="text-security text-[11px] mt-1 ml-1">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Terminal Contact</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-text-s group-focus-within:text-accent" />
              </div>
              <input
                {...register('phone')}
                className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
                placeholder="+8801..."
              />
            </div>
            {errors.phone && <p className="text-security text-[11px] mt-1 ml-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Digital Identity</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-s group-focus-within:text-accent" />
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
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Access Pass</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-s group-focus-within:text-accent" />
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

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Verify Pass</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-s group-focus-within:text-accent" />
              </div>
              <input
                {...register('confirmPassword')}
                type="password"
                className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
                placeholder="********"
              />
            </div>
            {errors.confirmPassword && <p className="text-security text-[11px] mt-1 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-text-s ml-1">Referral Origin (Optional)</label>
            <input
              {...register('referralCode')}
              className="block w-full px-4 py-3 bg-black/40 border border-border-ui rounded-xl focus:ring-1 focus:ring-accent/50 focus:border-accent outline-none transition-all placeholder:text-gray-700 text-sm text-text-p"
              placeholder="NETWORK_CODE"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="md:col-span-2 w-full bg-accent hover:bg-[#00d8e6] text-bg font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,242,255,0.15)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase text-xs tracking-widest"
          >
            {isSubmitting ? <Loader2 className="animate-spin text-bg" /> : (
              <>
                Register Operative <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[12px]">
          <span className="text-text-s">Already registered? </span>
          <Link to="/login" className="text-accent hover:underline font-black uppercase tracking-wider">Access System</Link>
        </div>
      </motion.div>
    </div>
  );
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  balance: number;
  referralCode: string;
  referredBy?: string;
  role: UserRole;
  createdAt: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  twoFactorEnabled: boolean;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  price: number;
  dailyIncome: number;
  duration: number; // in days
  totalReturn: number;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  dailyIncome: number;
  startDate: string;
  endDate: string;
  lastClaimDate: string;
  status: 'active' | 'completed';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'income' | 'bonus' | 'investment';
  amount: number;
  method?: string;
  transactionId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName: string;
  commission: number;
  createdAt: string;
}

export type UserRole = 'admin' | 'teacher' | 'student' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
  avatar?: string;
  bio?: string;
  points?: number;
  referralCode?: string;
  referralCreditNaira?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: { name: string; avatar?: string };
  thumbnail?: string;
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
}

export interface Service {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
}

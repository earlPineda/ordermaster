import React, { useState } from 'react';
import {
  Coffee,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Plus,
  ArrowRight,
  MapPin,
  Bike,
  UtensilsCrossed,
  Clock,
  Navigation
} from 'lucide-react';
import { CustomerProfile } from '../types';
import { CreateAccountModal } from './CreateAccountModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { googleSignIn } from '../services/googleAuth';
import { MATCHA_AVENUE_LOGO } from '../assets/logo';

interface LoginPortalProps {
  onCustomerLogin: (profile: CustomerProfile) => void;
  onAdminLogin: (adminName: string) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onCustomerLogin,
  onAdminLogin
}) => {
  const [portalMode, setPortalMode] = useState<'customer' | 'admin'>('customer');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isForgotPassOpen, setIsForgotPassOpen] = useState(false);

  // Submit Login Form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your email address or mobile number.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          password: password.trim(),
          role: portalMode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.role === 'admin') {
          onAdminLogin(data.user?.name || 'Store Manager');
        } else {
          onCustomerLogin(data.user);
        }
      } else {
        setErrorMsg(data.message || 'The credentials you entered are incorrect.');
      }
    } catch {
      // Direct Admin shortcut check
      if (
        (emailOrPhone.toLowerCase() === 'admin' || emailOrPhone.includes('admin')) &&
        (password === 'avenuecafe2025' || password === 'admin')
      ) {
        onAdminLogin('Store Manager');
      } else {
        setErrorMsg('Invalid login credentials. If you do not have an account, click "Create new account" below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Continue with Facebook Social Login
  const handleFacebookSocialLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'facebook',
          name: 'Facebook User',
          email: `fb_user_${Date.now()}@facebook.com`,
          socialId: `fb_${Date.now()}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onCustomerLogin(data.user);
      }
    } catch {
      setIsCreateAccountOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Continue with Google Social Login
  const handleGoogleSocialLogin = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        const googleUser: CustomerProfile = {
          id: result.user.uid,
          name: result.user.displayName || 'Customer',
          email: result.user.email || 'customer@gmail.com',
          phone: result.user.phoneNumber || '+63 900 000 0000',
          address: 'Metro Manila, Philippines',
          avatar: result.user.photoURL || undefined,
          memberTier: 'Gold VIP'
        };
        onCustomerLogin(googleUser);
      }
    } catch (err: any) {
      console.warn('Google sign in closed or unavailable:', err);
      setIsCreateAccountOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900">
      
      {/* Main Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Branding + Slogan + Value Highlights */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Branding */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs overflow-hidden border border-emerald-500">
                  <img src={MATCHA_AVENUE_LOGO} alt="Matcha Avenue Cafe" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900">
                  Matcha Avenue <span className="text-emerald-700">Cafe</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed">
                Connect to ceremonial Uji matcha, artisan handcrafted coffee, fresh bakery, and gourmet kitchen meals delivered in minutes.
              </p>
            </div>

            {/* Avenue Café Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto lg:mx-0 text-left">
              
              <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-900 tracking-wide">Artisan Brews</h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                    Single-origin espresso, cold brews, and handcrafted specialty lattes.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-900 tracking-wide">French Bakery</h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                    Butter croissants, fresh paninis, and pastries baked daily in-house.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-900 tracking-wide">Pinpoint GPS</h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                    Pin your exact doorstep, building, and unit for courier delivery.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-lg bg-stone-100 text-stone-700 shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-stone-900 tracking-wide">Live Order Tracker</h2>
                  <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                    Real-time status from kitchen barista preparation to delivery.
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Login Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            <div className="w-full bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-lg shadow-stone-200/50">
              
              {/* Role Indicator Pill */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${portalMode === 'customer' ? 'bg-amber-600' : 'bg-stone-700'}`} />
                  <span className="text-xs font-semibold text-stone-700">
                    {portalMode === 'customer' ? 'Customer Ordering Login' : 'Store Admin Login'}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode(portalMode === 'customer' ? 'admin' : 'customer');
                    setErrorMsg('');
                  }}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold hover:underline cursor-pointer"
                >
                  {portalMode === 'customer' ? 'Switch to Admin ➔' : 'Switch to Customer ➔'}
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Email / Mobile / Username */}
                <div>
                  <input
                    type="text"
                    placeholder={portalMode === 'customer' ? 'Mobile number or email address' : 'Admin username or email'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 px-3.5 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    autoComplete="username"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 pl-3.5 pr-10 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Log In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Logging In...' : 'Log In'}</span>
                </button>

                {/* Forgotten Password Link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassOpen(true)}
                    className="text-xs text-amber-700 hover:underline font-semibold cursor-pointer"
                  >
                    Forgotten password?
                  </button>
                </div>

                {/* Divider Line */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-stone-200" />
                  <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-semibold uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-stone-200" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFacebookSocialLogin}
                    className="py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleSocialLogin}
                    className="py-2 px-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                </div>

                {/* Create new account Button */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateAccountOpen(true)}
                    className="py-2.5 px-5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create new account</span>
                  </button>
                </div>

              </form>

            </div>

            {/* Subtext */}
            <div className="mt-4 text-center text-xs text-stone-500">
              <span className="font-semibold text-stone-700">Create an Account</span> to order artisan coffees, save delivery locations, and earn rewards.
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-stone-200 text-xs text-stone-500 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-600">
          <span className="text-stone-900 font-semibold">English (US)</span>
          <span className="hover:underline cursor-pointer">Filipino</span>
          <span className="hover:underline cursor-pointer">Español</span>
          <span className="hover:underline cursor-pointer">日本語</span>
          <span className="hover:underline cursor-pointer">Français</span>
        </div>

        <div className="border-t border-stone-100 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-400">
          <button type="button" onClick={() => setIsCreateAccountOpen(true)} className="hover:underline cursor-pointer">Sign Up</button>
          <button type="button" onClick={() => setPortalMode('customer')} className="hover:underline cursor-pointer">Log In</button>
          <button type="button" onClick={() => setPortalMode('admin')} className="hover:underline cursor-pointer">Store Admin</button>
          <span className="hover:underline cursor-pointer">Avenue Café Menu</span>
          <span className="hover:underline cursor-pointer">Live Tracker</span>
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="ml-auto text-stone-400">Avenue Café © 2026</span>
        </div>
      </footer>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={(newProfile) => {
          onCustomerLogin(newProfile);
        }}
      />

      <ForgotPasswordModal
        isOpen={isForgotPassOpen}
        onClose={() => setIsForgotPassOpen(false)}
        onSuccess={(id) => {
          setEmailOrPhone(id);
        }}
      />

    </div>
  );
};

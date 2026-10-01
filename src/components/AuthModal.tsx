import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Coffee,
  Lock,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CustomerProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'customer' | 'admin';
  currentRole: UserRole;
  customerProfile: CustomerProfile | null;
  onCustomerLoginSuccess: (profile: CustomerProfile) => void;
  onAdminLoginSuccess: (adminName: string) => void;
  onGoogleSignIn?: () => Promise<void>;
  isGoogleSigningIn?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'customer',
  currentRole,
  customerProfile,
  onCustomerLoginSuccess,
  onAdminLoginSuccess,
  onGoogleSignIn,
  isGoogleSigningIn = false
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>(initialRole);

  // Customer Form State
  const [custName, setCustName] = useState(customerProfile?.name || '');
  const [custEmail, setCustEmail] = useState(customerProfile?.email || '');
  const [custPhone, setCustPhone] = useState(customerProfile?.phone || '');
  const [custAddress, setCustAddress] = useState(customerProfile?.address || '');
  const [custLandmark, setCustLandmark] = useState(customerProfile?.landmark || '');

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Customer Sign-In
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!custName.trim()) {
      setErrorMsg('Please provide your customer name.');
      return;
    }
    if (!custPhone.trim()) {
      setErrorMsg('Please provide your contact phone number.');
      return;
    }

    const profile: CustomerProfile = {
      id: customerProfile?.id || `cust-${Date.now()}`,
      name: custName.trim(),
      email: custEmail.trim() || `${custName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: custPhone.trim(),
      address: custAddress.trim() || 'Metro Manila, Philippines',
      landmark: custLandmark.trim(),
      coordinates: { lat: 14.3857, lng: 120.8992, label: custAddress ? custAddress.slice(0, 25) : 'Metro Manila' },
      memberTier: customerProfile?.memberTier || 'Standard'
    };

    setIsLoading(true);
    setTimeout(() => {
      onCustomerLoginSuccess(profile);
      setIsLoading(false);
      onClose();
    }, 300);
  };

  // Handle Admin Sign-In
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      if (
        adminUsername.trim() === 'admin' &&
        (adminPassword === 'avenuecafe2025' || adminPassword === 'admin123' || adminPassword === 'admin')
      ) {
        onAdminLoginSuccess('Store Manager');
        setIsLoading(false);
        onClose();
      } else {
        setErrorMsg('Invalid admin credentials. Please check your username and password.');
        setIsLoading(false);
      }
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl my-8 relative text-stone-900">
        
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Access Portal
              </span>
              <h2 className="text-lg font-bold text-stone-900 mt-0.5">Sign In to Avenue Café</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-5 pb-2">
          <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer');
                setErrorMsg('');
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Customer View</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMsg('');
              }}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-5 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: CUSTOMER VIEW LOGIN */}
        {activeTab === 'customer' && (
          <div className="p-5 pt-2 space-y-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xs font-bold text-stone-900">Customer Profile Information</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Access your personalized café ordering menu, saved delivery address, and live order tracking.
              </p>
            </div>

            {/* Manual Customer Login / Register Form */}
            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Customer Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Phone (PH) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 09170000000"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-stone-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com (Optional)"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Landmark / Building</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Near Market Square"
                      value={custLandmark}
                      onChange={(e) => setCustLandmark(e.target.value)}
                      className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Default Delivery Address</label>
                <textarea
                  rows={2}
                  placeholder="Street Address, Barangay, City..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 p-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <span>Entering Menu View...</span>
                ) : (
                  <>
                    <span>Continue to Menu View</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ADMIN DASHBOARD LOGIN */}
        {activeTab === 'admin' && (
          <div className="p-5 pt-2 space-y-4">
            <div className="text-center sm:text-left">
              <h3 className="text-xs font-bold text-stone-900">Admin Management Sign In</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Authorized store management for Avenue Café kitchen orders and dashboard analytics.
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Admin Username</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Admin Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password (default: admin123)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-2 mt-3 cursor-pointer"
              >
                {isLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Access Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

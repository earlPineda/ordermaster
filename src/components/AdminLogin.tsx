import React, { useState } from 'react';
import { Lock, User, KeyRound, Coffee, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (adminName: string, token: string) => void;
  onBackToCustomer: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToCustomer
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Server-verified login: customer credentials are rejected here with 401/403.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: username.trim(), password, role: 'admin' })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success && data.role === 'admin' && data.token) {
        onLoginSuccess(data.user?.name || 'Store Manager', data.token);
      } else {
        setError('Invalid username or password.');
      }
    } catch {
      setError('Cannot reach server. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl space-y-6 relative overflow-hidden text-stone-900">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">Admin Dashboard Portal</h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Authorized store management portal for Matcha Avenue Cafe inventory, kitchen orders, and sales reports.
          </p>
        </div>

        {/* Restricted notice — no credentials shown here on purpose */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Restricted Area
            </span>
            <p className="text-xs text-stone-600">Authorized personnel only. Unauthorized access is prohibited.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 block">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 block">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Back Button */}
        <div className="pt-2 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={onBackToCustomer}
            className="text-xs text-stone-500 hover:text-amber-800 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Menu View</span>
          </button>
        </div>

      </div>
    </div>
  );
};

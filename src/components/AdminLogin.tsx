import React, { useState } from 'react';
import { Lock, User, KeyRound, Coffee, ArrowLeft, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (adminName: string) => void;
  onBackToCustomer: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToCustomer
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (username.trim() === 'admin' && (password === 'admin123' || password === 'matcha2026' || password === 'avenuecafe2026' || password === 'admin')) {
        onLoginSuccess('Matcha Avenue Cafe Manager');
      } else {
        setError('Invalid username or password. Default: admin / admin123');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
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

        {/* Demo Credentials Card */}
        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Default Credentials
            </span>
            <p className="text-xs text-stone-700 font-mono">User: <strong className="text-stone-900">admin</strong> | Pass: <strong className="text-stone-900">admin123</strong></p>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            Auto-fill
          </button>
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

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, User, Mail, Phone, Lock, MapPin, Eye, EyeOff } from 'lucide-react';
import { CustomerProfile } from '../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: CustomerProfile) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthMonth, setBirthMonth] = useState('Jun');
  const [birthDay, setBirthDay] = useState('15');
  const [birthYear, setBirthYear] = useState('1998');
  const [gender, setGender] = useState('Female');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [unitFloor, setUnitFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 80 }, (_, i) => (2024 - i).toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("What's your name? Please enter both your first name and surname.");
      return;
    }

    if (!emailOrPhone.trim()) {
      setErrorMsg("You'll need this when you log in and if you ever need to reset your password.");
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg("Enter a combination of at least 4 letters, numbers, and punctuation marks.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailOrPhone: emailOrPhone.trim(),
          password: password.trim(),
          birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
          gender,
          address: deliveryAddress.trim() || 'Metro Manila, Philippines',
          unitFloor: unitFloor.trim(),
          landmark: landmark.trim(),
          coordinates: { lat: 14.3857, lng: 120.8992, label: deliveryAddress || 'Metro Manila' }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      // Fallback local registration
      const newProf: CustomerProfile = {
        id: `user-${Date.now()}`,
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: emailOrPhone.includes('@') ? emailOrPhone.trim() : `${firstName.toLowerCase()}@example.com`,
        phone: !emailOrPhone.includes('@') ? emailOrPhone.trim() : '+63 917 000 0000',
        address: deliveryAddress.trim() || 'Metro Manila, Philippines',
        unitFloor: unitFloor.trim(),
        landmark: landmark.trim(),
        coordinates: { lat: 14.3857, lng: 120.8992, label: deliveryAddress || 'Metro Manila' },
        memberTier: 'Standard'
      };
      onSuccess(newProf);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn text-stone-900">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Sign Up</h2>
            <p className="text-xs text-stone-500 mt-0.5">Quick and easy registration.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Names Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Surname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Mobile / Email */}
          <div>
            <input
              type="text"
              placeholder="Mobile number or email address"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 text-xs sm:text-sm text-stone-900 placeholder-stone-400 pl-3 pr-10 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Birthday Selector */}
          <div>
            <span className="text-[11px] text-stone-600 block mb-1 font-semibold">Date of birth</span>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="bg-stone-50 text-xs text-stone-900 px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="bg-stone-50 text-xs text-stone-900 px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="bg-stone-50 text-xs text-stone-900 px-2 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender Selector */}
          <div>
            <span className="text-[11px] text-stone-600 block mb-1 font-semibold">Gender</span>
            <div className="grid grid-cols-3 gap-2 text-xs text-stone-700">
              {['Female', 'Male', 'Custom'].map((g) => (
                <label
                  key={g}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    gender === g
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span>{g}</span>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                    className="text-amber-600 focus:ring-amber-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Address & Unit */}
          <div className="pt-1 border-t border-stone-200 space-y-2">
            <span className="text-[11px] text-stone-600 block font-semibold">
              Delivery Address (for Fresh Coffee & Food Orders)
            </span>
            <input
              type="text"
              placeholder="Street name, Barangay, City (e.g. Crimson Street, Navarro, General Trias)"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Unit / Floor / Bldg"
                value={unitFloor}
                onChange={(e) => setUnitFloor(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
              <input
                type="text"
                placeholder="Nearby Landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-stone-50 text-xs text-stone-900 placeholder-stone-400 px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Terms Note */}
          <p className="text-[10px] text-stone-400 leading-relaxed pt-1">
            By clicking Sign Up, you agree to Avenue Café terms and conditions.
          </p>

          {/* Sign Up Button */}
          <div className="text-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

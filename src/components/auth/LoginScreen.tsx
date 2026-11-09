/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Shield, Lock, Mail, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, users } = useERP();
  const [email, setEmail] = useState('radwanahmedeg2028@gmail.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('يرجى كتابة البريد الإلكتروني وكلمة السر');
      return;
    }
    const res = login(email, password);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleQuickLogin = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
    login(uEmail, uPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-emerald-600">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            الرضوان للحسابات
          </h1>
          <p className="text-sm text-slate-400">
            نظام متكامل لإدارة الحسابات العامة والمخازن والتقارير المالية (ERP)
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-700">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              تسجيل الدخول للنظام
            </h2>
            <span className="text-xs text-slate-400">الإصدار المحلي 1.0</span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني للمستخدم
              </label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة السر
              </label>
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              دخول إلى النظام
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Select demo users */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <p className="text-xs text-slate-400 mb-2.5 font-medium">
              المستخدمون المعرّفون في النظام (دخول سريع تجريبي):
            </p>
            <div className="space-y-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email, u.password || 'admin')}
                  className="w-full text-right p-2.5 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/50 text-xs flex items-center justify-between text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <div>
                    <span className="font-semibold block">{u.name}</span>
                    <span className="text-slate-500 text-[11px] font-mono" dir="ltr">{u.email}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    {u.role === 'admin' ? 'مدير نظام' : 'محاسب'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>نظام مشفر ومحمي بصلاحيات مستخدمين تفصيلية وفق معايير الحوكمة المالية</span>
        </div>
      </div>
    </div>
  );
};

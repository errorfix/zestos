'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState<string>('admin@zest.lingayas.edu.in');
  const [password, setPassword] = useState<string>('Zest@2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            rememberMe,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Authentication failed. Please verify credentials.');
        }

        // Redirect to intended protected page
        router.push(nextUrl);
        router.refresh();
      } catch (err) {
        setErrorMessage((err as Error).message || 'Invalid email or password.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#1a73e8]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#4285f4] text-white shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10">
            <Lock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>ZEST 2K26 • Committee Terminal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Restricted Access Portal
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Lingaya&apos;s Vidyapeeth Fest Operations & Gate Security
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center gap-3 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Committee Email ID
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zest.lingayas.edu.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-[#1a73e8] focus:ring-0 focus:ring-offset-0"
                />
                <span>Keep terminal authenticated (7 days)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Enter Committee Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Credential Helper Callout */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Authorized Master Credentials</span>
              </div>
              <p>Email: <code className="text-blue-300 font-mono">admin@zest.lingayas.edu.in</code></p>
              <p>Pass: <code className="text-blue-300 font-mono">Zest@2026</code></p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Public Event Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">Loading portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}

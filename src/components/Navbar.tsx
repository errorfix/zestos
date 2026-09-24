'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Sparkles, Shield, LogOut } from 'lucide-react';

export default function Navbar() {
  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if current user is logged in as committee admin
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAdminAuth(true);
          setUserRole(data.user?.roleId || null);
        }
      })
      .catch(() => {});
  }, []);

  const committeeHref =
    userRole === 'INFORMALZ_COMMITTEE'
      ? '/informalz'
      : userRole === 'STAGE_COMMITTEE'
      ? '/stage'
      : userRole === 'SUPER_ADMIN'
      ? '/super-admin'
      : '/admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform group-hover:scale-105">
            Z
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-slate-900 tracking-tight">ZEST 2K26</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                FestOS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Lingaya&apos;s Vidyapeeth</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#events-catalog"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Events</span>
          </Link>

          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Register</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Unified Committee Portal Link */}
          <Link
            href={committeeHref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title="Restricted to Committee Members & Gatekeepers"
          >
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            <span>Committee Portal</span>
          </Link>

          {isAdminAuth && (
            <Link
              href="/api/auth/logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

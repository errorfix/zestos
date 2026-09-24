'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import OperatorIdentityModal, { OperatorDeskBadge } from '@/components/OperatorIdentityModal';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() || '';

  // Check if current route is any committee / administrative desk
  const isCommitteeRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/stage') ||
    pathname.startsWith('/committee') ||
    pathname.startsWith('/onspot') ||
    pathname.startsWith('/informalz') ||
    pathname.startsWith('/management') ||
    pathname.startsWith('/checkin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand & University Crest */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group focus:outline-none min-w-0">
          <div className="relative w-9 h-11 sm:w-12 sm:h-14 flex items-center justify-center shrink-0 p-0.5 group-hover:scale-105 transition-transform">
            <Image
              src="/lingayas_logo.png"
              alt="Lingaya's Vidyapeeth Crest"
              width={48}
              height={56}
              priority
              className="object-contain max-h-full"
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                ZEST 2K26
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                GENZFY
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-tight truncate max-w-[145px] xs:max-w-[210px] sm:max-w-none">
              Lingaya&apos;s Vidyapeeth
              <span className="hidden sm:inline"> (Deemed University)</span>
            </p>
          </div>
        </Link>

        {/* Committee Operator Badge (desktop visible) */}
        {isCommitteeRoute && (
          <div className="hidden lg:flex items-center">
            <OperatorDeskBadge />
          </div>
        )}

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
          <Link
            href="/#events-catalog"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Events Catalog
          </Link>
          <Link
            href="/#venue"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Venue &amp; Metro
          </Link>
          <Link
            href="/#faqs"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            FAQs
          </Link>
          <Link
            href="/#contact"
            className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Helpline
          </Link>
        </nav>

        {/* Top Registration Button (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all hover:shadow focus-visible:ring-2 focus-visible:ring-slate-900 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Register Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Mobile Menu & Quick Register Toggle */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          <Link
            href="/register"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-2xs"
          >
            Register
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-3 pb-6 bg-white border-b border-slate-200 space-y-2 text-xs font-semibold text-slate-700 animate-in fade-in-50 shadow-lg">
          {isCommitteeRoute && (
            <div className="pb-2 border-b border-slate-100">
              <OperatorDeskBadge />
            </div>
          )}
          <Link
            href="/#events-catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Events Catalog
          </Link>
          <Link
            href="/#venue"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Venue &amp; Metro Directions
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Frequently Asked Questions
          </Link>
          <Link
            href="/#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900"
          >
            Committee Helplines
          </Link>
          <div className="pt-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Register Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* Mandatory Operator Verification Modal for Committee Routes */}
      {isCommitteeRoute && <OperatorIdentityModal />}
    </header>
  );
}

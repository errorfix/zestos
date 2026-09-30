import React from 'react';
import Navbar from '@/components/Navbar';
import DocumentStorage from '@/components/DocumentStorage';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken, getRoleById } from '@/lib/auth';
import { getCommitteeById, getCommitteeBySlug, COMMITTEE_METAS } from '@/lib/committeeConstants';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, ShieldCheck } from 'lucide-react';

export const revalidate = 0;

export async function generateMetadata() {
  return {
    title: 'Document Storage Vault • FestOS v2.0',
    description: 'Committee isolated file and asset storage system',
  };
}

interface PageProps {
  searchParams: Promise<{ committee?: string }>;
}

export default async function CommitteeDocStorPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    redirect('/login?next=/committee/doc-stor');
  }

  const { committee: requestedSlug } = await searchParams;

  // Resolve committee identity
  let activeSlug = 'admin';
  let activeName = 'Registration Committee';

  if (session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT') {
    if (requestedSlug) {
      const match = getCommitteeBySlug(requestedSlug) || getCommitteeById(requestedSlug);
      if (match) {
        activeSlug = match.slug;
        activeName = match.name;
      } else {
        activeSlug = requestedSlug.toLowerCase();
        activeName = requestedSlug;
      }
    } else {
      activeSlug = 'super-admin';
      activeName = 'Super Admin (CS&IT)';
    }
  } else {
    // Normal committee is strictly locked to its own folder
    const comm = getCommitteeById(session.roleId);
    if (comm) {
      activeSlug = comm.slug;
      activeName = comm.name;
    }
  }

  const isSuperOrMgmt = session.roleId === 'SUPER_ADMIN' || session.roleId === 'MANAGEMENT';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Back navigation & header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={session.roleId === 'SUPER_ADMIN' ? '/super-admin' : session.roleId === 'MANAGEMENT' ? '/management' : `/committee/${activeSlug}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {activeName} Console</span>
          </Link>

          {isSuperOrMgmt && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Observing Committee:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COMMITTEE_METAS.slice(0, 8).map((c) => (
                  <Link
                    key={c.id}
                    href={`/committee/doc-stor?committee=${c.slug}`}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      activeSlug === c.slug
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.badge}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Storage Component */}
        <DocumentStorage committeeSlug={activeSlug} committeeName={activeName} />
      </main>
    </div>
  );
}

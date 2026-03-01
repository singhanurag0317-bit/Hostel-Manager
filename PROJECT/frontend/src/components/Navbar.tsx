'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Bed, MessageSquare, Bell, CreditCard, Users, Building2, Menu, X, Sparkles, LogOut, Shield, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!profile || pathname === '/' || pathname === '/login' || pathname === '/register') return null;

  const isAdmin = profile.role === 'ADMIN';

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ href: '/rooms', label: 'Rooms', icon: Bed }] : []),
    { href: '/complaints', label: 'Complaints', icon: MessageSquare },
    { href: '/notices', label: 'Notices', icon: Bell },
    ...(isAdmin ? [
      { href: '/students', label: 'Students', icon: Users },
      { href: '/payments', label: 'Payments', icon: CreditCard },
    ] : []),
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = () => {
    signOut();
    router.push('/login');
  };

  return (
    <>
      <nav className="fixed w-full z-50 top-0" style={{
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a0e1a] animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold gradient-text">HostelManager</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(link.href) ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  style={isActive(link.href) ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1))', border: '1px solid rgba(99, 102, 241, 0.3)' } : {}}>
                  <link.icon className="w-4 h-4" />{link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-200">{profile.name}</p>
                  <p className="text-xs font-medium" style={{ color: isAdmin ? '#818cf8' : '#22d3ee' }}>{isAdmin ? 'Administrator' : 'Student'}</p>
                </div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isAdmin ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                    border: isAdmin ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                  }}>
                  {isAdmin ? <Shield className="h-5 w-5 text-indigo-300" /> : <GraduationCap className="h-5 w-5 text-cyan-300" />}
                </div>
              </div>
              <button onClick={handleSignOut} className="p-2 text-slate-400 rounded-xl hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden animate-slide-down" style={{ background: 'rgba(10, 14, 26, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
            <div className="px-4 pt-3 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(link.href) ? 'text-white bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <link.icon className="w-5 h-5" />{link.label}
                </Link>
              ))}
              <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-rose-400 hover:bg-rose-500/10 transition-all" style={{ border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <LogOut className="w-5 h-5" />Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to push content down below the fixed navbar */}
      <div className="h-16 w-full shrink-0"></div>
    </>
  );
}

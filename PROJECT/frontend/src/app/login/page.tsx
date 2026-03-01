'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Building2, Mail, Lock, AlertCircle, Loader2, LogIn, Shield, GraduationCap, Phone, AtSign } from 'lucide-react';

export default function LoginPage() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await signIn(email, password, role);
            if (result.error) setError(result.error);
            else router.push('/dashboard');
        } catch { setError('Something went wrong'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-center overflow-hidden relative" style={{ background: '#0a0e1a' }}>
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.12), transparent 70%)' }} />
                <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.08), transparent 70%)' }} />
            </div>

            {/* Top Logo Section */}
            <div className="pt-2 pb-2 text-center relative z-10 shrink-0">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl mb-2"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)' }}>
                    <Building2 className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold gradient-text">HostelManager</h1>
                <p className="text-slate-500 text-xs mt-0.5">Sign in to continue</p>
            </div>

            {/* Middle Form Section - Centered and clamped */}
            <div className="flex items-center justify-center px-4 relative z-10 w-full max-w-md mx-auto py-1 shrink-0">
                <div className="w-full glass-card p-6 sm:p-8 animate-fade-in-up">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-down"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                            <p className="text-sm text-rose-300">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sign in as</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setRole('STUDENT')}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${role === 'STUDENT' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    style={role === 'STUDENT' ? { background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.15))', border: '1px solid rgba(6, 182, 212, 0.4)' }
                                        : { background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                    <GraduationCap className="h-4 w-4" style={{ color: role === 'STUDENT' ? '#22d3ee' : '#64748b' }} />Student
                                </button>
                                <button type="button" onClick={() => setRole('ADMIN')}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${role === 'ADMIN' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    style={role === 'ADMIN' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(99, 102, 241, 0.4)' }
                                        : { background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                                    <Shield className="h-4 w-4" style={{ color: role === 'ADMIN' ? '#818cf8' : '#64748b' }} />Admin
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input type="email" required placeholder="Email Address"
                                        className="input-dark w-full text-sm py-3 rounded-xl transition-all" style={{ paddingLeft: '2.75rem' }}
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input type="password" required placeholder="Password"
                                        className="input-dark w-full text-sm py-3 rounded-xl transition-all" style={{ paddingLeft: '2.75rem' }}
                                        value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="btn-gradient w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}Sign In
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Create Account</Link>
                    </p>
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="pt-2 pb-2 text-center relative z-10 shrink-0">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                    <a href="mailto:support@hostelmanager.com" className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors">
                        <AtSign className="h-4 w-4 text-indigo-400/60" />support@hostelmanager.com
                    </a>
                    <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                        <Phone className="h-4 w-4 text-emerald-400/60" />+91 98765 43210
                    </a>
                </div>
            </div>
        </div>
    );
}

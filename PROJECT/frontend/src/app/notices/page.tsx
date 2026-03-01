'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { supabase, Notice } from '@/lib/supabase';
import { Bell, Plus, Loader2, AlertCircle, X, Trash2, AlertTriangle, Info, Clock } from 'lucide-react';

export default function NoticesPage() {
  const { profile, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', message: '', priority: 'NORMAL' as const, expiresAt: '' });
  const isAdmin = profile?.role === 'ADMIN';

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (error) throw error; setNotices(data || []);
    } catch { setError('Failed to fetch notices'); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotices();
    const ch = supabase.channel('notices-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => fetchNotices()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const { error } = await supabase.from('notices').insert({ title: newNotice.title, message: newNotice.message, priority: newNotice.priority, created_by: user?.id, expires_at: newNotice.expiresAt || null });
      if (error) throw error;
      setShowAddModal(false); setNewNotice({ title: '', message: '', priority: 'NORMAL', expiresAt: '' });
    } catch (err: any) { setError(err.message || 'Failed to post'); } finally { setSubmitting(false); }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Delete this notice?')) return;
    try { const { error } = await supabase.from('notices').delete().eq('id', id); if (error) throw error; }
    catch (err: any) { setError(err.message || 'Failed to delete'); }
  };

  const getPriorityIcon = (p: string) => {
    if (p === 'URGENT') return <AlertTriangle className="h-5 w-5 text-rose-400" />;
    if (p === 'HIGH') return <AlertCircle className="h-5 w-5 text-amber-400" />;
    if (p === 'NORMAL') return <Info className="h-5 w-5 text-blue-400" />;
    return <Clock className="h-5 w-5 text-slate-400" />;
  };

  const getPriorityCard = (p: string) => {
    if (p === 'URGENT') return { bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)' };
    if (p === 'HIGH') return { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)' };
    if (p === 'NORMAL') return { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.12)' };
    return { bg: 'rgba(148, 163, 184, 0.05)', border: 'rgba(148, 163, 184, 0.1)' };
  };

  const getPriorityBadge = (p: string) => p === 'URGENT' ? 'badge-red' : p === 'HIGH' ? 'badge-orange' : p === 'NORMAL' ? 'badge-blue' : 'badge-gray';
  const isExpired = (e?: string) => e ? new Date(e) < new Date() : false;

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex justify-between items-center mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.15))', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Notices</h1>
                <p className="text-slate-400 text-sm">{isAdmin ? 'Post and manage announcements' : 'Stay updated with announcements'}</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddModal(true)} className="btn-gradient flex items-center gap-2"><Plus className="h-4 w-4" /> Post Notice</button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-down" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" /><p className="text-sm text-rose-300 flex-1">{error}</p>
              <button onClick={() => setError('')}><X className="h-4 w-4 text-rose-400" /></button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center py-24"><Loader2 className="h-10 w-10 text-indigo-400 animate-spin" /><p className="mt-4 text-slate-400 text-sm">Loading...</p></div>
          ) : notices.length === 0 ? (
            <div className="glass-card text-center py-16 animate-fade-in-up">
              <Bell className="mx-auto h-14 w-14 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No notices</h3>
              <p className="text-slate-500 text-sm mt-1">{isAdmin ? 'Post your first announcement.' : 'No announcements yet.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice, i) => {
                const expired = isExpired(notice.expires_at);
                const colors = getPriorityCard(notice.priority);
                return (
                  <div key={notice.id}
                    className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.005] animate-fade-in-up opacity-0 ${expired ? 'opacity-50' : ''}`}
                    style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'forwards', background: colors.bg, border: `1px solid ${colors.border}` }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="shrink-0 mt-0.5">{getPriorityIcon(notice.priority)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-100">{notice.title}</h3>
                            <span className={`badge ${getPriorityBadge(notice.priority)}`}>{notice.priority}</span>
                            {expired && <span className="badge badge-gray">Expired</span>}
                          </div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{notice.message}</p>
                          <div className="mt-3 flex items-center flex-wrap gap-4 text-xs text-slate-500">
                            <span>Posted: {new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {notice.expires_at && <span>Expires: {new Date(notice.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteNotice(notice.id)} className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Notice Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-lg w-[95%] sm:w-full p-6 animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-100">Post Notice</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                    <input type="text" required className="input-dark" placeholder="Notice title" value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea className="input-dark h-32 resize-none" placeholder="Notice content..." required value={newNotice.message} onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                      <select className="input-dark" value={newNotice.priority} onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value as any })}>
                        <option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expires (optional)</label>
                      <input type="date" className="input-dark" value={newNotice.expiresAt} onChange={(e) => setNewNotice({ ...newNotice, expiresAt: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-gradient flex items-center gap-2 disabled:opacity-50">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Post Notice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

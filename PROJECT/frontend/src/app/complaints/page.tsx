'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { getComplaints, addComplaint, updateComplaint, Complaint } from '@/lib/store';
import { MessageSquare, Plus, Loader2, AlertCircle, Clock, CheckCircle, HelpCircle, X, Send } from 'lucide-react';

export default function ComplaintsPage() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Complaint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({ category: 'Maintenance', description: '' });
  const [adminResponse, setAdminResponse] = useState('');
  const isAdmin = profile?.role === 'ADMIN';

  const fetchComplaints = () => {
    const all = getComplaints();
    setComplaints(isAdmin ? all : all.filter(c => c.student_id === profile?.id));
    setLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, [isAdmin, profile?.id]);

  const handleAddComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) { setError('Profile not found.'); return; }
    setSubmitting(true);
    try {
      addComplaint({ student_id: profile.id, category: newComplaint.category, description: newComplaint.description, status: 'OPEN' });
      setShowAddModal(false); setNewComplaint({ category: 'Maintenance', description: '' }); fetchComplaints();
    } catch (err: any) { setError(err.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    updateComplaint(id, { status }); fetchComplaints(); setShowDetailModal(prev => prev ? { ...prev, status } : null);
  };

  const submitAdminResponse = (id: string) => {
    if (!adminResponse.trim()) return;
    updateComplaint(id, { admin_response: adminResponse, status: 'IN_PROGRESS' });
    setAdminResponse(''); fetchComplaints(); setShowDetailModal(null);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'RESOLVED') return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    if (status === 'IN_PROGRESS') return <Clock className="h-5 w-5 text-amber-400" />;
    return <HelpCircle className="h-5 w-5 text-blue-400" />;
  };
  const getStatusBadge = (s: string) => s === 'RESOLVED' ? 'badge-green' : s === 'IN_PROGRESS' ? 'badge-yellow' : 'badge-blue';
  const categories = ['Maintenance', 'Cleanliness', 'Food', 'Internet', 'Security', 'Noise', 'Plumbing', 'Electrical', 'Others'];

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex justify-between items-center mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.15))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <MessageSquare className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Complaints</h1>
                <p className="text-slate-400 text-sm">{isAdmin ? 'Manage and respond to complaints' : 'Submit and track your complaints'}</p>
              </div>
            </div>
            {!isAdmin && (
              <button onClick={() => setShowAddModal(true)} className="btn-gradient flex items-center gap-2"><Plus className="h-4 w-4" /> New Complaint</button>
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
          ) : complaints.length === 0 ? (
            <div className="glass-card text-center py-16 animate-fade-in-up">
              <MessageSquare className="mx-auto h-14 w-14 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No complaints</h3>
              <p className="text-slate-500 text-sm mt-1">{isAdmin ? 'No complaints submitted yet.' : "You haven't submitted any complaints."}</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden animate-fade-in-up">
              <div className="divide-y divide-white/[0.04]">
                {complaints.map((c, i) => (
                  <div key={c.id} onClick={() => setShowDetailModal(c)}
                    className="px-6 py-5 hover:bg-white/[0.03] transition-all duration-300 cursor-pointer animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-purple">{c.category}</span>
                          <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-2">{c.description}</p>
                        <p className="text-xs text-slate-500 mt-2">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="ml-4">{getStatusIcon(c.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-md w-[95%] sm:w-full p-6 animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-100">Submit Complaint</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleAddComplaint} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                    <select className="input-dark" value={newComplaint.category} onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea className="input-dark h-32 resize-none" placeholder="Describe your issue..." required value={newComplaint.description} onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-gradient flex items-center gap-2 disabled:opacity-50">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showDetailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-lg w-[95%] sm:w-full p-6 max-h-[90vh] overflow-y-auto animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-purple">{showDetailModal.category}</span>
                    <span className={`badge ${getStatusBadge(showDetailModal.status)}`}>{showDetailModal.status}</span>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-5">
                  <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p><p className="text-slate-200 text-sm">{showDetailModal.description}</p></div>
                  <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Submitted</p><p className="text-slate-300 text-sm">{new Date(showDetailModal.created_at).toLocaleString()}</p></div>
                  {showDetailModal.admin_response && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Admin Response</p>
                      <p className="text-indigo-200 text-sm">{showDetailModal.admin_response}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="pt-4" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Admin Actions</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {showDetailModal.status !== 'IN_PROGRESS' && (
                          <button onClick={() => updateStatus(showDetailModal.id, 'IN_PROGRESS')} className="badge badge-yellow cursor-pointer hover:opacity-80 transition-opacity">Mark In Progress</button>
                        )}
                        {showDetailModal.status !== 'RESOLVED' && (
                          <button onClick={() => updateStatus(showDetailModal.id, 'RESOLVED')} className="badge badge-green cursor-pointer hover:opacity-80 transition-opacity">Mark Resolved</button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add a response..." className="input-dark flex-1" value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} />
                        <button onClick={() => submitAdminResponse(showDetailModal.id)} disabled={!adminResponse.trim()} className="btn-gradient px-3 disabled:opacity-50">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

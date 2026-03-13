'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { getRents, addRent, updateRent, getStudents, Rent, Student } from '@/lib/store';
import { CreditCard, Plus, Loader2, AlertCircle, X, Check, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

// For payments, we store student name alongside rent records for display
interface RentWithName extends Rent { studentName: string; }

export default function PaymentsPage() {
  const { profile } = useAuth();
  const [rents, setRents] = useState<RentWithName[]>([]);
  const [students, setStudents] = useState<(Student & { name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
  const [newRent, setNewRent] = useState({ studentId: '', month: new Date().toISOString().slice(0, 7), amount: 5000 });
  const isAdmin = profile?.role === 'ADMIN';

  const fetchData = () => {
    const allStudents = getStudents();
    // get stored users to match names
    const users: any[] = (() => { try { return JSON.parse(localStorage.getItem('hostel_users') || '[]'); } catch { return []; } })();
    const userMap: Record<string, string> = {};
    users.forEach((u: any) => { userMap[u.id] = u.name; });

    const enrichedStudents = allStudents.map(s => ({ ...s, name: userMap[s.user_id] || 'Unknown' }));
    setStudents(enrichedStudents);

    const studentNameMap: Record<string, string> = {};
    enrichedStudents.forEach(s => { studentNameMap[s.id] = s.name; });

    let allRents = getRents().map(r => ({ ...r, studentName: studentNameMap[r.student_id] || 'Unknown' }));
    if (filter !== 'ALL') allRents = allRents.filter(r => r.status === filter);
    setRents(allRents);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchData(); else setLoading(false); }, [isAdmin, filter]);

  const handleAddRent = (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      addRent({ student_id: newRent.studentId, month: newRent.month, amount: newRent.amount, status: 'PENDING' });
      setShowAddModal(false); setNewRent({ studentId: '', month: new Date().toISOString().slice(0, 7), amount: 5000 }); fetchData();
    } catch (err: any) { setError(err.message || 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = (id: string, status: 'PAID' | 'PENDING' | 'OVERDUE') => {
    updateRent(id, { status, paid_at: status === 'PAID' ? new Date().toISOString() : undefined }); fetchData();
  };

  const getStatusBadge = (s: string) => s === 'PAID' ? 'badge-green' : s === 'OVERDUE' ? 'badge-red' : 'badge-yellow';
  const getStatusIcon = (s: string) => {
    if (s === 'PAID') return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    if (s === 'OVERDUE') return <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />;
    return <Clock className="h-3.5 w-3.5 text-amber-400" />;
  };
  const totalPending = rents.filter(r => r.status === 'PENDING').reduce((s, r) => s + Number(r.amount), 0);
  const totalOverdue = rents.filter(r => r.status === 'OVERDUE').reduce((s, r) => s + Number(r.amount), 0);
  const totalCollected = rents.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0);

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center glass-card p-10"><AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" /><h1 className="text-xl font-bold text-slate-100">Access Denied</h1><p className="text-slate-400 mt-2">Admin only.</p></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <CreditCard className="h-5 w-5 text-emerald-400" />
              </div>
              <div><h1 className="text-2xl font-bold text-slate-100">Payments</h1><p className="text-slate-400 text-sm">Track and manage rent payments</p></div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-gradient flex items-center gap-2"><Plus className="h-4 w-4" /> Add Record</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Pending', value: totalPending, icon: Clock, cls: 'stat-card-yellow', iconColor: 'text-amber-400' },
              { label: 'Overdue', value: totalOverdue, icon: AlertTriangle, cls: 'stat-card-red', iconColor: 'text-rose-400' },
              { label: 'Collected', value: totalCollected, icon: TrendingUp, cls: 'stat-card-green', iconColor: 'text-emerald-400' },
            ].map((c, i) => (
              <div key={c.label} className={`${c.cls} rounded-2xl p-5 animate-fade-in-up opacity-0`} style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-3">
                  <div className={`${c.iconColor} opacity-60`}><c.icon className="h-8 w-8" strokeWidth={1.5} /></div>
                  <div><p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{c.label}</p><p className="text-2xl font-bold text-slate-100">₹{c.value.toLocaleString()}</p></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${filter === s ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                style={filter === s ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : { border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                {s === 'ALL' ? 'All Records' : s}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle className="h-5 w-5 text-rose-400" /><p className="text-sm text-rose-300 flex-1">{error}</p>
              <button onClick={() => setError('')}><X className="h-4 w-4 text-rose-400" /></button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center py-24"><Loader2 className="h-10 w-10 text-indigo-400 animate-spin" /></div>
          ) : rents.length === 0 ? (
            <div className="glass-card text-center py-16 animate-fade-in-up">
              <CreditCard className="mx-auto h-14 w-14 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No records</h3>
              <p className="text-slate-500 text-sm mt-1">Create your first rent record.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden animate-fade-in-up">
              <div className="overflow-x-auto">
                <table className="premium-table w-full">
                  <thead><tr><th>Student</th><th>Month</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {rents.map((rent) => (
                      <tr key={rent.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}>
                              <span className="text-indigo-300 font-bold text-xs">{rent.studentName?.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="font-medium">{rent.studentName}</span>
                          </div>
                        </td>
                        <td className="text-slate-400">{new Date(rent.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                        <td className="font-semibold text-emerald-400">₹{Number(rent.amount).toLocaleString()}</td>
                        <td><span className={`badge ${getStatusBadge(rent.status)} inline-flex items-center gap-1`}>{getStatusIcon(rent.status)} {rent.status}</span></td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {rent.status !== 'PAID' && <button onClick={() => updateStatus(rent.id, 'PAID')} className="badge badge-green cursor-pointer hover:opacity-80 text-[10px]">Mark Paid</button>}
                            {rent.status === 'PENDING' && <button onClick={() => updateStatus(rent.id, 'OVERDUE')} className="badge badge-red cursor-pointer hover:opacity-80 text-[10px]">Mark Overdue</button>}
                            {rent.status === 'PAID' && <button onClick={() => updateStatus(rent.id, 'PENDING')} className="badge badge-yellow cursor-pointer hover:opacity-80 text-[10px]">Undo</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-md w-[95%] sm:w-full p-6 animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-100">Add Rent Record</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleAddRent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Student</label>
                    <select required className="input-dark" value={newRent.studentId} onChange={(e) => setNewRent({ ...newRent, studentId: e.target.value })}>
                      <option value="">Select student...</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Month</label><input type="month" required className="input-dark" value={newRent.month} onChange={(e) => setNewRent({ ...newRent, month: e.target.value })} /></div>
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Amount (₹)</label><input type="number" min="0" required className="input-dark" value={newRent.amount} onChange={(e) => setNewRent({ ...newRent, amount: parseFloat(e.target.value) })} /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-gradient flex items-center gap-2 disabled:opacity-50">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create</button>
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

'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { getStudents, updateStudent, getBeds, updateBed, getRoomsWithBeds, Student, Bed, Room } from '@/lib/store';
import { Users, Loader2, AlertCircle, X, UserCheck, UserX, Bed as BedIcon, Search } from 'lucide-react';

interface StoredUser { id: string; name: string; email: string; role: string; }

interface StudentWithDetails extends Student {
  name: string; email: string;
  bedInfo?: { bed_number: string; room_number: string; floor: number; };
}

export default function StudentsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState<StudentWithDetails | null>(null);
  const [availableBeds, setAvailableBeds] = useState<(Bed & { room_number: string; floor: number })[]>([]);
  const [selectedBed, setSelectedBed] = useState('');
  const isAdmin = profile?.role === 'ADMIN';

  const getUserMap = (): Record<string, StoredUser> => {
    try {
      const users: StoredUser[] = JSON.parse(localStorage.getItem('hostel_users') || '[]');
      return Object.fromEntries(users.map(u => [u.id, u]));
    } catch { return {}; }
  };

  const fetchStudents = () => {
    const userMap = getUserMap();
    const rooms = getRoomsWithBeds();
    const bedRoomMap: Record<string, { bed_number: string; room_number: string; floor: number }> = {};
    rooms.forEach(r => r.beds.forEach(b => { bedRoomMap[b.id] = { bed_number: b.bed_number, room_number: r.room_number, floor: r.floor }; }));

    const raw = getStudents();
    const enriched: StudentWithDetails[] = raw.map(s => ({
      ...s,
      name: userMap[s.user_id]?.name || 'Unknown',
      email: userMap[s.user_id]?.email || '',
      bedInfo: s.bed_id ? bedRoomMap[s.bed_id] : undefined,
    }));
    setStudents(enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  };

  const fetchAvailableBeds = () => {
    const rooms = getRoomsWithBeds();
    const free: (Bed & { room_number: string; floor: number })[] = [];
    rooms.forEach(r => r.beds.filter(b => !b.is_occupied).forEach(b => free.push({ ...b, room_number: r.room_number, floor: r.floor })));
    setAvailableBeds(free);
  };

  useEffect(() => { if (isAdmin) { fetchStudents(); fetchAvailableBeds(); } else setLoading(false); }, [isAdmin]);

  const toggleStudentStatus = (id: string, active: boolean) => {
    updateStudent(id, { active: !active }); fetchStudents();
  };

  const assignBed = () => {
    if (!showAssignModal || !selectedBed) return;
    if (showAssignModal.bed_id) updateBed(showAssignModal.bed_id, { is_occupied: false });
    updateStudent(showAssignModal.id, { bed_id: selectedBed });
    updateBed(selectedBed, { is_occupied: true });
    setShowAssignModal(null); setSelectedBed(''); fetchStudents(); fetchAvailableBeds();
  };

  const unassignBed = (studentId: string, bedId: string) => {
    updateStudent(studentId, { bed_id: undefined });
    updateBed(bedId, { is_occupied: false });
    fetchStudents(); fetchAvailableBeds();
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.15))', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div><h1 className="text-2xl font-bold text-slate-100">Students</h1><p className="text-slate-400 text-sm">Manage student profiles and room assignments</p></div>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input type="text" placeholder="Search students..." className="input-dark pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle className="h-5 w-5 text-rose-400" /><p className="text-sm text-rose-300 flex-1">{error}</p>
              <button onClick={() => setError('')}><X className="h-4 w-4 text-rose-400" /></button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center py-24"><Loader2 className="h-10 w-10 text-indigo-400 animate-spin" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="glass-card text-center py-16 animate-fade-in-up">
              <Users className="mx-auto h-14 w-14 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No students found</h3>
              <p className="text-slate-500 text-sm mt-1">Students appear here after registration.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden animate-fade-in-up">
              <div className="overflow-x-auto">
                <table className="premium-table w-full">
                  <thead><tr><th>Student</th><th>Room / Bed</th><th>Join Date</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                              <span className="text-indigo-300 font-bold text-sm">{student.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div><div className="font-medium text-slate-100">{student.name}</div><div className="text-xs text-slate-500">{student.email}</div></div>
                          </div>
                        </td>
                        <td>
                          {student.bedInfo ? (
                            <div className="flex items-center gap-2 text-sm">
                              <BedIcon className="h-4 w-4 text-slate-500" />
                              <span className="text-slate-300">Room {student.bedInfo.room_number}, Bed {student.bedInfo.bed_number}</span>
                            </div>
                          ) : <span className="text-slate-500 italic text-sm">Not assigned</span>}
                        </td>
                        <td className="text-slate-400">{new Date(student.join_date).toLocaleDateString()}</td>
                        <td><span className={`badge ${student.active ? 'badge-green' : 'badge-red'}`}>{student.active ? 'Active' : 'Inactive'}</span></td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setShowAssignModal(student); setSelectedBed(student.bed_id || ''); }}
                              className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all" title="Assign bed"><BedIcon className="h-4 w-4" /></button>
                            {student.bed_id && (
                              <button onClick={() => unassignBed(student.id, student.bed_id!)}
                                className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all" title="Unassign"><UserX className="h-4 w-4" /></button>
                            )}
                            <button onClick={() => toggleStudentStatus(student.id, student.active)}
                              className={`p-2 rounded-lg transition-all ${student.active ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                              title={student.active ? 'Deactivate' : 'Activate'}>
                              {student.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-md w-[95%] sm:w-full p-6 animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-100">Assign Bed</h2>
                  <button onClick={() => setShowAssignModal(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <p className="text-sm text-slate-400 mb-4">Assign a bed to <strong className="text-slate-200">{showAssignModal.name}</strong></p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Select Bed</label>
                    <select className="input-dark" value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)}>
                      <option value="">Select a bed...</option>
                      {availableBeds.map((bed) => <option key={bed.id} value={bed.id}>Room {bed.room_number} - Bed {bed.bed_number} (Floor {bed.floor})</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button onClick={() => setShowAssignModal(null)} className="px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5">Cancel</button>
                    <button onClick={assignBed} disabled={!selectedBed} className="btn-gradient disabled:opacity-50">Assign Bed</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

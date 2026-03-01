'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { supabase, Room, Bed } from '@/lib/supabase';
import { Bed as BedIcon, Plus, Loader2, AlertCircle, Trash2, X, DoorOpen } from 'lucide-react';

interface RoomWithBeds extends Room { beds: Bed[]; }

export default function RoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', totalBeds: 4, floor: 1, rentAmount: 5000 });
  const isAdmin = profile?.role === 'ADMIN';

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase.from('rooms').select('*, beds(*)').order('room_number');
      if (error) throw error;
      setRooms(data || []);
    } catch { setError('Failed to fetch rooms'); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRooms();
    const ch1 = supabase.channel('rooms-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchRooms()).subscribe();
    const ch2 = supabase.channel('beds-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, () => fetchRooms()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const { data: room, error: roomError } = await supabase.from('rooms').insert({ room_number: newRoom.roomNumber, floor: newRoom.floor, rent_amount: newRoom.rentAmount, capacity: newRoom.totalBeds }).select().single();
      if (roomError) throw roomError;
      const beds = Array.from({ length: newRoom.totalBeds }, (_, i) => ({ bed_number: `${i + 1}`, room_id: room.id, is_occupied: false }));
      const { error: bedsError } = await supabase.from('beds').insert(beds);
      if (bedsError) throw bedsError;
      setShowAddModal(false); setNewRoom({ roomNumber: '', totalBeds: 4, floor: 1, rentAmount: 5000 }); fetchRooms();
    } catch (err: any) { setError(err.message || 'Failed to add room'); } finally { setSubmitting(false); }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room and all its beds?')) return;
    try { const { error } = await supabase.from('rooms').delete().eq('id', roomId); if (error) throw error; fetchRooms(); }
    catch (err: any) { setError(err.message || 'Failed to delete room'); }
  };

  const toggleBedOccupancy = async (bedId: string, currentStatus: boolean) => {
    try { const { error } = await supabase.from('beds').update({ is_occupied: !currentStatus }).eq('id', bedId); if (error) throw error; }
    catch (err: any) { setError(err.message || 'Failed to update bed'); }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex justify-between items-center mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.15))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <DoorOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Room Management</h1>
                <p className="text-slate-400 text-sm">Manage hostel rooms and bed availability</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddModal(true)} className="btn-gradient flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Room
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-down" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-300 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-300"><X className="h-4 w-4" /></button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
              <p className="mt-4 text-slate-400 text-sm">Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="glass-card text-center py-16 animate-fade-in-up">
              <BedIcon className="mx-auto h-14 w-14 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">No rooms yet</h3>
              <p className="text-slate-500 text-sm mt-1">Get started by adding your first room</p>
              {isAdmin && (
                <button onClick={() => setShowAddModal(true)} className="btn-gradient mt-5 inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Room
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, i) => {
                const occupiedCount = room.beds?.filter(b => b.is_occupied).length || 0;
                const totalBeds = room.beds?.length || 0;
                const pct = totalBeds > 0 ? (occupiedCount / totalBeds) * 100 : 0;
                const barColor = pct === 100 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div key={room.id} className="glass-card p-5 animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'forwards' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">Room {room.room_number}</h3>
                        <p className="text-xs text-slate-500">Floor {room.floor}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${pct === 100 ? 'badge-red' : pct > 50 ? 'badge-yellow' : 'badge-green'}`}>
                          {occupiedCount}/{totalBeds}
                        </span>
                        {isAdmin && (
                          <button onClick={() => handleDeleteRoom(room.id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Occupancy</span>
                        <span className="font-medium text-slate-300">{Math.round(pct)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className={`progress-bar-fill ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      <span className="text-slate-500">Rent:</span> <span className="text-emerald-400 font-semibold">₹{room.rent_amount}/mo</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {room.beds?.map((bed) => (
                        <button key={bed.id} onClick={() => isAdmin && toggleBedOccupancy(bed.id, bed.is_occupied)} disabled={!isAdmin}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all duration-300 border ${bed.is_occupied
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:border-rose-500/40'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:border-emerald-500/40'
                            } ${isAdmin ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'}`}>
                          <span className="flex items-center gap-1.5"><BedIcon className="h-3.5 w-3.5" /> Bed {bed.bed_number}</span>
                          <span>{bed.is_occupied ? '●' : '○'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Room Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-backdrop">
              <div className="glass-card max-w-md w-full p-6 animate-modal" style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-slate-100">Add New Room</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Room Number</label>
                    <input type="text" required className="input-dark" placeholder="e.g., 101, A1" value={newRoom.roomNumber} onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Floor</label>
                      <input type="number" min="1" required className="input-dark" value={newRoom.floor} onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Total Beds</label>
                      <input type="number" min="1" max="10" required className="input-dark" value={newRoom.totalBeds} onChange={(e) => setNewRoom({ ...newRoom, totalBeds: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Rent (₹/month)</label>
                    <input type="number" min="0" required className="input-dark" value={newRoom.rentAmount} onChange={(e) => setNewRoom({ ...newRoom, rentAmount: parseFloat(e.target.value) })} />
                  </div>
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting} className="btn-gradient flex items-center gap-2 disabled:opacity-50">
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Create Room
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

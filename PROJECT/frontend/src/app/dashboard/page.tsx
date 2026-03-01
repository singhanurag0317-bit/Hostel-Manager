'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { supabase, Room, Complaint, Notice, Rent } from '@/lib/supabase';
import { Home, Users, MessageSquare, Bell, CreditCard, ArrowRight, Loader2, Activity, Zap, BarChart3, BedDouble, AlertTriangle, CalendarCheck } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRooms: 0, occupiedBeds: 0, totalBeds: 0, openComplaints: 0, pendingRent: 0 });
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);

  // Student-specific state
  const [studentRoom, setStudentRoom] = useState<Room | null>(null);
  const [studentBed, setStudentBed] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState(0);
  const [myPendingRent, setMyPendingRent] = useState(0);

  const fetchDashboardData = async () => {
    try {
      if (isAdmin) {
        const [roomsRes, bedsRes, complaintsRes, noticesRes, rentRes] = await Promise.all([
          supabase.from('rooms').select('id'),
          supabase.from('beds').select('id, is_occupied'),
          supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
          supabase.from('rent').select('id').eq('status', 'PENDING'),
        ]);
        const beds = bedsRes.data || [];
        setStats({
          totalRooms: roomsRes.data?.length || 0,
          occupiedBeds: beds.filter(b => b.is_occupied).length,
          totalBeds: beds.length,
          openComplaints: (complaintsRes.data || []).filter(c => c.status !== 'RESOLVED').length,
          pendingRent: rentRes.data?.length || 0,
        });
        setRecentNotices(noticesRes.data || []);
        setRecentComplaints(complaintsRes.data || []);
      } else {
        // Student view — fetch their own data
        const [noticesRes] = await Promise.all([
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
        ]);
        setRecentNotices(noticesRes.data || []);
        // Demo data for student view
        setMyComplaints(0);
        setMyPendingRent(0);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
    const channels = ['complaints', 'notices', 'rooms', 'beds'].map(table =>
      supabase.channel(`${table}-dash`).on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchDashboardData()).subscribe()
    );
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [isAdmin]);

  const getPriorityBadge = (p: string) => {
    const map: Record<string, string> = { URGENT: 'badge-red', HIGH: 'badge-orange', NORMAL: 'badge-blue', LOW: 'badge-gray' };
    return map[p] || 'badge-gray';
  };

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = { OPEN: 'badge-blue', IN_PROGRESS: 'badge-yellow', RESOLVED: 'badge-green' };
    return map[s] || 'badge-gray';
  };

  // ==================== ADMIN DASHBOARD ====================
  const AdminDashboard = () => {
    const statsCards = [
      { name: 'Total Rooms', value: stats.totalRooms.toString(), icon: Home, cardClass: 'stat-card-blue', iconColor: 'text-blue-400', href: '/rooms' },
      { name: 'Occupied Beds', value: `${stats.occupiedBeds}/${stats.totalBeds}`, icon: Users, cardClass: 'stat-card-green', iconColor: 'text-emerald-400', href: '/rooms' },
      { name: 'Open Complaints', value: stats.openComplaints.toString(), icon: MessageSquare, cardClass: 'stat-card-red', iconColor: 'text-rose-400', href: '/complaints' },
      { name: 'Pending Rent', value: stats.pendingRent.toString(), icon: CreditCard, cardClass: 'stat-card-yellow', iconColor: 'text-amber-400', href: '/payments' },
    ];

    const quickActions = [
      { name: 'Add Room', icon: Home, href: '/rooms', gradient: 'from-blue-500/20 to-indigo-500/10', borderColor: 'border-blue-500/20', iconColor: 'text-blue-400', hoverBg: 'hover:border-blue-500/40' },
      { name: 'Complaints', icon: MessageSquare, href: '/complaints', gradient: 'from-purple-500/20 to-violet-500/10', borderColor: 'border-purple-500/20', iconColor: 'text-purple-400', hoverBg: 'hover:border-purple-500/40' },
      { name: 'Post Notice', icon: Bell, href: '/notices', gradient: 'from-amber-500/20 to-orange-500/10', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400', hoverBg: 'hover:border-amber-500/40' },
      { name: 'Payments', icon: CreditCard, href: '/payments', gradient: 'from-emerald-500/20 to-teal-500/10', borderColor: 'border-emerald-500/20', iconColor: 'text-emerald-400', hoverBg: 'hover:border-emerald-500/40' },
    ];

    return (
      <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {statsCards.map((stat, i) => (
            <Link key={stat.name} href={stat.href}
              className={`${stat.cardClass} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer animate-fade-in-up opacity-0`}
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-100 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.iconColor} opacity-60`}><stat.icon className="h-10 w-10" strokeWidth={1.5} /></div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="glass-card p-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-5"><Zap className="h-5 w-5 text-amber-400" /><h2 className="text-lg font-bold text-slate-100">Quick Actions</h2></div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br ${action.gradient} border ${action.borderColor} ${action.hoverBg} transition-all duration-300 hover:scale-[1.03] group`}>
                  <action.icon className={`h-7 w-7 ${action.iconColor} mb-2 group-hover:scale-110 transition-transform duration-300`} />
                  <span className="text-xs font-semibold text-slate-300">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-in-up opacity-0 lg:col-span-2" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-indigo-400" /><h2 className="text-lg font-bold text-slate-100">Recent Notices</h2></div>
              <Link href="/notices" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {recentNotices.length === 0 ? (
              <div className="text-center py-8"><Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" /><p className="text-slate-500 text-sm">No notices yet</p></div>
            ) : recentNotices.map((notice, i) => (
              <div key={notice.id} className="p-4 rounded-xl mb-3 transition-all duration-300 hover:bg-white/[0.03] animate-fade-in-up opacity-0"
                style={{ animationDelay: `${0.5 + i * 0.08}s`, animationFillMode: 'forwards', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{notice.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`badge ${getPriorityBadge(notice.priority)} shrink-0`}>{notice.priority}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{notice.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 glass-card p-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-400" /><h2 className="text-lg font-bold text-slate-100">Recent Complaints</h2></div>
            <Link href="/complaints" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-8"><MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" /><p className="text-slate-500 text-sm">No complaints yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="premium-table w-full">
                <thead><tr><th>Category</th><th>Description</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c.id}><td className="font-medium">{c.category}</td><td className="max-w-xs truncate text-slate-400">{c.description}</td>
                      <td><span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span></td>
                      <td className="text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  // ==================== STUDENT DASHBOARD ====================
  const StudentDashboard = () => {
    const studentStats = [
      { name: 'My Room', value: studentRoom ? `Room ${studentRoom.room_number}` : 'Not Assigned', icon: BedDouble, cardClass: studentRoom ? 'stat-card-blue' : 'stat-card-gray', iconColor: 'text-blue-400' },
      { name: 'My Complaints', value: myComplaints.toString(), icon: MessageSquare, cardClass: 'stat-card-purple', iconColor: 'text-purple-400' },
      { name: 'Pending Rent', value: `₹${myPendingRent.toLocaleString()}`, icon: AlertTriangle, cardClass: myPendingRent > 0 ? 'stat-card-red' : 'stat-card-green', iconColor: myPendingRent > 0 ? 'text-rose-400' : 'text-emerald-400' },
      { name: 'Notices', value: recentNotices.length.toString(), icon: Bell, cardClass: 'stat-card-yellow', iconColor: 'text-amber-400' },
    ];

    const studentActions = [
      { name: 'File Complaint', icon: MessageSquare, href: '/complaints', gradient: 'from-purple-500/20 to-violet-500/10', borderColor: 'border-purple-500/20', iconColor: 'text-purple-400', desc: 'Report an issue' },
      { name: 'View Notices', icon: Bell, href: '/notices', gradient: 'from-amber-500/20 to-orange-500/10', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400', desc: 'Latest updates' },
    ];

    return (
      <>
        {/* Student Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {studentStats.map((stat, i) => (
            <div key={stat.name}
              className={`${stat.cardClass} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up opacity-0`}
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'forwards' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.name}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.iconColor} opacity-60`}><stat.icon className="h-10 w-10" strokeWidth={1.5} /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Student Quick Actions */}
          <div className="glass-card p-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-slate-100">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              {studentActions.map((action) => (
                <Link key={action.name} href={action.href}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${action.gradient} border ${action.borderColor} transition-all duration-300 hover:scale-[1.02] group`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${action.iconColor} bg-white/5`}>
                    <action.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{action.name}</p>
                    <p className="text-xs text-slate-500">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Notice Board */}
          <div className="glass-card p-6 animate-fade-in-up opacity-0 lg:col-span-2" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-amber-400" /><h2 className="text-lg font-bold text-slate-100">Notice Board</h2></div>
              <Link href="/notices" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">All Notices <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {recentNotices.length === 0 ? (
              <div className="text-center py-12"><Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" /><h3 className="text-slate-400 font-medium">No notices yet</h3><p className="text-slate-500 text-sm mt-1">Announcements from your hostel will appear here</p></div>
            ) : recentNotices.map((notice, i) => (
              <div key={notice.id} className="p-4 rounded-xl mb-3 transition-all duration-300 hover:bg-white/[0.03] animate-fade-in-up opacity-0"
                style={{ animationDelay: `${0.5 + i * 0.08}s`, animationFillMode: 'forwards', background: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">{notice.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`badge ${getPriorityBadge(notice.priority)} shrink-0`}>{notice.priority}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{notice.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Room Info Card (if assigned) */}
        <div className="mt-8 glass-card p-6 animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 mb-5"><BedDouble className="h-5 w-5 text-cyan-400" /><h2 className="text-lg font-bold text-slate-100">My Accommodation</h2></div>
          {studentRoom ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Room</p>
                <p className="text-lg font-bold text-slate-100">Room {studentRoom.room_number}</p>
                <p className="text-xs text-slate-500 mt-1">Floor {studentRoom.floor}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bed</p>
                <p className="text-lg font-bold text-slate-100">Bed {studentBed || '-'}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Monthly Rent</p>
                <p className="text-lg font-bold text-emerald-400">₹{studentRoom.rent_amount}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BedDouble className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-300 font-semibold">No room assigned yet</h3>
              <p className="text-slate-500 text-sm mt-1">Contact your hostel admin for room assignment</p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))'
                    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.15))',
                  border: isAdmin
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(6, 182, 212, 0.3)',
                }}>
                <Activity className="h-5 w-5" style={{ color: isAdmin ? '#818cf8' : '#22d3ee' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  {isAdmin ? 'Welcome back, ' : 'Hey, '}<span className="gradient-text">{profile?.name}</span>
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {isAdmin ? "Here's your hostel management overview" : 'Your accommodation dashboard'}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
              <p className="mt-4 text-slate-400 text-sm">Loading dashboard...</p>
            </div>
          ) : isAdmin ? <AdminDashboard /> : <StudentDashboard />}
        </div>
      </div>
    </ProtectedRoute>
  );
}

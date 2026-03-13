// Central localStorage data store — replaces Supabase entirely
// All data is persisted in the browser across sessions.

export type Profile = {
    id: string; name: string; email: string;
    role: 'ADMIN' | 'STUDENT'; phone?: string; created_at: string;
};
export type Room = {
    id: string; room_number: string; floor: number;
    capacity: number; rent_amount: number; created_at: string;
    beds?: Bed[];
};
export type Bed = {
    id: string; bed_number: string; room_id: string;
    is_occupied: boolean; created_at: string; student?: Student;
};
export type Student = {
    id: string; user_id: string; bed_id?: string; phone?: string;
    emergency_contact?: string; address?: string; join_date: string;
    active: boolean; created_at: string; profile?: Profile;
};
export type Complaint = {
    id: string; student_id: string; category: string; description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; admin_response?: string;
    created_at: string; updated_at: string; student?: Student;
};
export type Notice = {
    id: string; title: string; message: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    created_by?: string; expires_at?: string; created_at: string;
};
export type Rent = {
    id: string; student_id: string; month: string; amount: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE'; paid_at?: string;
    created_at: string; student?: Student;
};

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function now() { return new Date().toISOString(); }

function get<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ── ROOMS ────────────────────────────────────────────────────────────────────
export const getRooms = (): Room[] => get<Room>('hm_rooms');
export const addRoom = (r: Omit<Room, 'id' | 'created_at'>): Room => {
    const room: Room = { ...r, id: uid(), created_at: now() };
    set('hm_rooms', [...getRooms(), room]); return room;
};
export const deleteRoom = (id: string) => set('hm_rooms', getRooms().filter(r => r.id !== id));

// ── BEDS ─────────────────────────────────────────────────────────────────────
export const getBeds = (): Bed[] => get<Bed>('hm_beds');
export const addBeds = (beds: Omit<Bed, 'id' | 'created_at'>[]) => {
    const newBeds = beds.map(b => ({ ...b, id: uid(), created_at: now() }));
    set('hm_beds', [...getBeds(), ...newBeds]); return newBeds;
};
export const updateBed = (id: string, patch: Partial<Bed>) => {
    set('hm_beds', getBeds().map(b => b.id === id ? { ...b, ...patch } : b));
};
export const deleteBedsForRoom = (roomId: string) =>
    set('hm_beds', getBeds().filter(b => b.room_id !== roomId));

// helper: rooms with their beds attached
export const getRoomsWithBeds = (): (Room & { beds: Bed[] })[] => {
    const beds = getBeds();
    return getRooms()
        .sort((a, b) => a.room_number.localeCompare(b.room_number))
        .map(r => ({ ...r, beds: beds.filter(b => b.room_id === r.id) }));
};

// ── STUDENTS ─────────────────────────────────────────────────────────────────
export const getStudents = (): Student[] => get<Student>('hm_students');
export const addStudent = (s: Omit<Student, 'id' | 'created_at'>): Student => {
    const student: Student = { ...s, id: uid(), created_at: now() };
    set('hm_students', [...getStudents(), student]); return student;
};
export const updateStudent = (id: string, patch: Partial<Student>) =>
    set('hm_students', getStudents().map(s => s.id === id ? { ...s, ...patch } : s));

// ── COMPLAINTS ───────────────────────────────────────────────────────────────
export const getComplaints = (): Complaint[] => get<Complaint>('hm_complaints');
export const addComplaint = (c: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>): Complaint => {
    const complaint: Complaint = { ...c, id: uid(), created_at: now(), updated_at: now() };
    set('hm_complaints', [complaint, ...getComplaints()]); return complaint;
};
export const updateComplaint = (id: string, patch: Partial<Complaint>) =>
    set('hm_complaints', getComplaints().map(c => c.id === id ? { ...c, ...patch, updated_at: now() } : c));

// ── NOTICES ──────────────────────────────────────────────────────────────────
export const getNotices = (): Notice[] => get<Notice>('hm_notices');
export const addNotice = (n: Omit<Notice, 'id' | 'created_at'>): Notice => {
    const notice: Notice = { ...n, id: uid(), created_at: now() };
    set('hm_notices', [notice, ...getNotices()]); return notice;
};
export const deleteNotice = (id: string) => set('hm_notices', getNotices().filter(n => n.id !== id));

// ── RENT ─────────────────────────────────────────────────────────────────────
export const getRents = (): Rent[] => get<Rent>('hm_rent');
export const addRent = (r: Omit<Rent, 'id' | 'created_at'>): Rent => {
    const rent: Rent = { ...r, id: uid(), created_at: now() };
    set('hm_rent', [rent, ...getRents()]); return rent;
};
export const updateRent = (id: string, patch: Partial<Rent>) =>
    set('hm_rent', getRents().map(r => r.id === id ? { ...r, ...patch } : r));

// helper: attach profile info to students
export const getStudentsWithProfiles = (profilesMap: Record<string, Profile>) =>
    getStudents().map(s => ({ ...s, profile: profilesMap[s.user_id] }));

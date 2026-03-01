import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '\n⚠️  Missing Supabase credentials!\n' +
    '   Please create PROJECT/frontend/.env.local with:\n' +
    '   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n' +
    '   Get these from: https://supabase.com/dashboard → Settings → API\n'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  phone?: string;
  created_at: string;
};

export type Room = {
  id: string;
  room_number: string;
  floor: number;
  capacity: number;
  rent_amount: number;
  created_at: string;
  beds?: Bed[];
};

export type Bed = {
  id: string;
  bed_number: string;
  room_id: string;
  is_occupied: boolean;
  created_at: string;
  student?: Student;
};

export type Student = {
  id: string;
  user_id: string;
  bed_id?: string;
  phone?: string;
  emergency_contact?: string;
  address?: string;
  join_date: string;
  active: boolean;
  created_at: string;
  profile?: Profile;
};

export type Complaint = {
  id: string;
  student_id: string;
  category: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  admin_response?: string;
  created_at: string;
  updated_at: string;
  student?: Student;
};

export type Notice = {
  id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  created_by?: string;
  expires_at?: string;
  created_at: string;
};

export type Rent = {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paid_at?: string;
  created_at: string;
  student?: Student;
};

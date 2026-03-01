'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push(profile ? '/dashboard' : '/login');
    }
  }, [loading, profile, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
    </div>
  );
}

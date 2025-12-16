// ============================================
// 6. hooks/useAuth.ts - Custom auth hook
// ============================================
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/app/lib/auth-context';

export function useAuthHook() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthHook must be used within AuthProvider');
  }
  return context;
}

// ============================================
// 7. hooks/useRole.ts - Role-based access hook
// ============================================
'use client';

import { useAuth } from './useAuth';

export function useRole() {
  const { user } = useAuth();

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const canAccess = (requiredRoles: string[]): boolean => {
    return hasRole(requiredRoles);
  };

  const isSuperAdmin = (): boolean => user?.role === 'SUPER_ADMIN';
  const isAdmin = (): boolean => ['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '');
  const isTeacher = (): boolean => user?.role === 'TEACHER';
  const isStudent = (): boolean => user?.role === 'STUDENT';
  const isStaff = (): boolean => user?.role === 'STAFF';
  const isParent = (): boolean => user?.role === 'PARENT';

  return {
    hasRole,
    canAccess,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    isStaff,
    isParent,
    userRole: user?.role,
  };
}
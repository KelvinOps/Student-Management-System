// hooks/useRole.ts
'use client';

import { useAuth } from './useAuth';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'USER';

export function useRole() {
  const { user } = useAuth();

  const getUserRole = (): UserRole | undefined => {
    return user?.role;
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    const userRole = getUserRole();
    if (!userRole) return false;
    
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  };

  const canAccess = (requiredRoles: UserRole[]): boolean => {
    return hasRole(requiredRoles);
  };

  const isSuperAdmin = (): boolean => getUserRole() === 'SUPER_ADMIN';
  const isAdmin = (): boolean => {
    const userRole = getUserRole();
    return userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  };
  const isTeacher = (): boolean => getUserRole() === 'TEACHER';
  const isStudent = (): boolean => getUserRole() === 'STUDENT';
  const isStaff = (): boolean => getUserRole() === 'STAFF';
  const isParent = (): boolean => getUserRole() === 'PARENT';
  const isUser = (): boolean => getUserRole() === 'USER';

  return {
    hasRole,
    canAccess,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    isStaff,
    isParent,
    isUser,
    getUserRole,
    userRole: getUserRole(),
  };
}
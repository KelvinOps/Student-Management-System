// app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  User,
  Loader,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  isActive: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Student Management',
    icon: Users,
    children: [
      { name: 'Student Search', href: '/student-management/student-search' },
      { name: 'Students', href: '/student-management/students' },
      { name: 'ID Cards', href: '/student-management/id-cards' },
      { name: 'Applicants', href: '/student-management/applicants' },
      { name: 'Student Reporting', href: '/student-management/student-reporting' },
      { name: 'Cohort Session Planner', href: '/student-management/cohort-planner' },
      { name: 'Classes', href: '/student-management/classes' },
    ],
  },
  {
    name: 'Student Academics',
    icon: GraduationCap,
    children: [
      { name: 'Lesson Attendance', href: '/academics/attendance/lesson' },
      { name: 'Attendance Reports', href: '/academics/attendance/reports' },
      { name: 'Marks Entry', href: '/academics/marks/entry' },
      { name: 'CAT Entry', href: '/academics/marks/cat' },
      { name: 'Exam Scheduling', href: '/academics/exams/scheduling' },
      { name: 'Exam Results', href: '/academics/exams/results' },
      { name: 'Transcripts', href: '/academics/exams/transcripts' },
      { name: 'Subject Registrations', href: '/academics/subjects/registration' },
      { name: 'Subjects', href: '/academics/subjects' },
      { name: 'Curriculums', href: '/academics/curriculum' },
      { name: 'Tutor Profile', href: '/academics/tutors' },
      { name: 'Timetable', href: '/academics/timetable/time-table' },
    ],
  },
  {
    name: 'Finance',
    icon: DollarSign,
    children: [
      { name: 'Fee Structure', href: '/finance/fee-structure' },
      { name: 'Payments', href: '/finance/payments' },
      { name: 'Invoices', href: '/finance/invoices' },
      { name: 'Reports', href: '/finance/reports' },
    ],
  },
  {
    name: 'Hostel',
    icon: Building2,
    children: [
      { name: 'Buildings', href: '/hostel/buildings' },
      { name: 'Rooms', href: '/hostel/rooms' },
      { name: 'Bookings', href: '/hostel/bookings' },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-expand menus based on current path
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) => pathname?.startsWith(child.href));
        if (isActive && !expandedMenus.includes(item.name)) {
          setExpandedMenus([...expandedMenus, item.name]);
        }
      }
    });
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout request fails
      router.push('/login');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800';
      case 'TEACHER':
        return 'bg-green-100 text-green-800';
      case 'STUDENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'PARENT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-cyan-700" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-cyan-700 text-white shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-cyan-800 transition"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-cyan-700 text-xl font-bold">I</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">Intellimis</h1>
                <p className="text-xs text-cyan-100">Kongoni Technical and Vocational College</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-cyan-800 transition relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 rounded-lg hover:bg-cyan-800 transition">
              <Settings size={20} />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-800 transition"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                    <User size={18} />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-cyan-100">{user.role.replace('_', ' ')}</p>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`hidden md:block transform transition-transform ${
                    showUserMenu ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                      <p className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </Link>
                    </div>
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } mt-[64px] lg:mt-0 overflow-y-auto`}
        >
          {/* User Info in Sidebar (Mobile) */}
          <div className="lg:hidden p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.firstName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-cyan-700 rounded-full flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-600">{user.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <nav className="py-4 px-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span>{item.name}</span>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`transform transition-transform ${
                            expandedMenus.includes(item.name) ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {expandedMenus.includes(item.name) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`block px-3 py-2 text-sm rounded-lg transition ${
                                pathname === child.href
                                  ? 'bg-cyan-700 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                        pathname === item.href
                          ? 'bg-cyan-700 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Footer in Sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <p className="text-xs text-center text-gray-500">
              Powered by ABNO Softwares International Ltd
            </p>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
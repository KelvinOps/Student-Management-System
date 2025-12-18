// src/app/(dashboard)/student-management/student-reporting/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Download, Filter, TrendingUp, Users, BookOpen, Award, 
  Calendar, Search, FileText, CheckCircle, X 
} from "lucide-react";
import { 
  getStudentReportingData, 
  getAcademicYears, 
  getStudentsForReporting, 
  createStudentReport, 
  getStudentReportsForExport 
} from "@/actions/student-reporting";
import { getDepartments } from "@/actions/department";
import { getClasses } from "@/actions/class";
import { exportToExcel, exportToPDF } from "@/app/lib/export-utils";

// ===== TYPES =====
interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  graduatedStudents: number;
  suspendedStudents: number;
}

interface ClassPerformance {
  classCode: string;
  className: string;
  studentCount: number;
  attendanceRate: number;
  averageScore: number;
}

interface DepartmentStats {
  departmentName: string;
  studentCount: number;
  activeCount: number;
  maleCount: number;
  femaleCount: number;
}

interface SessionBreakdown {
  session: string;
  studentCount: number;
  percentage: number;
}

interface StudentForReport {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  class: string;
  programme: string;
  department: string;
  session: string;
  academicYear: string;
  academicStatus: string;
  reportCount: number;
  lastReported: Date | null;
}

interface Department {
  id: string;
  name: string;
}

interface Class {
  id: string;
  code: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ===== HELPER FUNCTION =====
// TODO: Replace this with your actual auth implementation
async function getCurrentUserId(): Promise<string | null> {
  // OPTION 1: If using NextAuth
  // import { getServerSession } from "next-auth";
  // import { authOptions } from "@/app/api/auth/[...nextauth]/route";
  // const session = await getServerSession(authOptions);
  // return session?.user?.id || null;

  // OPTION 2: If using Clerk
  // import { auth } from "@clerk/nextjs";
  // const { userId } = auth();
  // return userId;

  // OPTION 3: Temporary fallback - Get from localStorage or context
  // For now, return a placeholder that should be replaced
  console.warn("getCurrentUserId not implemented - please add your auth logic");
  return null; // This will trigger the auth error message
}

// ===== TOAST COMPONENT =====
function ToastNotification({ toasts, onClose }: { 
  toasts: Toast[]; 
  onClose: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] animate-slide-in ${
            toast.type === 'success' ? 'bg-green-600 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onClose(toast.id)}
            className="hover:opacity-75"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function StudentReportingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [reporting, setReporting] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Overview data
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    graduatedStudents: 0,
    suspendedStudents: 0,
  });
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [sessionBreakdown, setSessionBreakdown] = useState<SessionBreakdown[]>([]);
  
  // Students table data
  const [students, setStudents] = useState<StudentForReport[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  
  // Filters
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    departmentId: '',
    classId: '',
    session: '',
    academicYear: '',
    academicStatus: '',
  });

  // ===== TOAST FUNCTIONS =====
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ===== DATA LOADING =====
  const loadInitialData = useCallback(async () => {
    try {
      const [deptResult, classResult, yearResult] = await Promise.all([
        getDepartments(),
        getClasses(),
        getAcademicYears(),
      ]);

      if (deptResult.success && Array.isArray(deptResult.data)) {
        setDepartments(deptResult.data);
      }

      if (classResult.success && Array.isArray(classResult.data)) {
        setClasses(classResult.data);
      }

      if (yearResult.success && Array.isArray(yearResult.data)) {
        setAcademicYears(yearResult.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Failed to load filter options', 'error');
    }
  }, [showToast]);

  const loadReportingData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStudentReportingData(filters);

      if (result.success && result.data) {
        setStats(result.data.stats);
        setClassPerformance(result.data.classPerformance);
        setDepartmentStats(result.data.departmentStats);
        setSessionBreakdown(result.data.sessionBreakdown);
      } else {
        showToast(result.error || 'Failed to load data', 'error');
      }
    } catch (error) {
      console.error('Error loading reporting data:', error);
      showToast('Failed to load reporting data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  const loadStudentsTable = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStudentsForReporting({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
      });

      if (result.success) {
        setStudents(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0, currentPage: 1 });
      } else {
        showToast(result.error || 'Failed to load students', 'error');
      }
    } catch (error) {
      console.error('Error loading students table:', error);
      showToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, itemsPerPage, searchTerm, showToast]);

  // ===== EFFECTS =====
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadReportingData();
    } else {
      loadStudentsTable();
    }
  }, [filters, activeTab, currentPage, itemsPerPage, searchTerm, loadReportingData, loadStudentsTable]);

  // ===== ACTION HANDLERS =====
  const handleReportStudent = async (studentId: string) => {
    setReporting(studentId);
    try {
      const userId = await getCurrentUserId();
      
      if (!userId) {
        showToast('Authentication required. Please log in.', 'error');
        setReporting(null);
        return;
      }

      const result = await createStudentReport({
        studentId,
        reportedBy: userId,
      });

      if (result.success) {
        showToast(result.message || 'Student reported successfully!', 'success');
        loadStudentsTable();
      } else {
        showToast(result.error || 'Failed to report student', 'error');
      }
    } catch (error) {
      console.error('Error reporting student:', error);
      showToast('Failed to report student', 'error');
    } finally {
      setReporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const result = await getStudentReportsForExport({
        ...filters,
        search: searchTerm,
      });

      if (result.success && result.data.length > 0) {
        exportToExcel(result.data, 'student_reports');
        showToast(`Successfully exported ${result.data.length} student records`, 'success');
      } else {
        showToast('No data to export', 'info');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const result = await getStudentReportsForExport({
        ...filters,
        search: searchTerm,
      });

      if (result.success && result.data.length > 0) {
        exportToPDF(result.data, 'Student Reports');
        showToast('PDF exported successfully', 'success');
      } else {
        showToast('No data to export', 'info');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate pagination page numbers with ellipsis
  const getPaginationPages = () => {
    const pages: (number | string)[] = [];
    const { totalPages, currentPage } = pagination;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // ===== STAT CARDS DATA =====
  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Active Students",
      value: stats.activeStudents.toLocaleString(),
      change: `${Math.round((stats.activeStudents / stats.totalStudents) * 100) || 0}%`,
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      label: "Graduated",
      value: stats.graduatedStudents.toLocaleString(),
      change: `${Math.round((stats.graduatedStudents / stats.totalStudents) * 100) || 0}%`,
      icon: Award,
      color: "bg-purple-500",
    },
    {
      label: "Inactive/Suspended",
      value: (stats.inactiveStudents + stats.suspendedStudents).toLocaleString(),
      change: `${Math.round(((stats.inactiveStudents + stats.suspendedStudents) / stats.totalStudents) * 100) || 0}%`,
      icon: BookOpen,
      color: "bg-orange-500",
    },
  ];

  // ===== RENDER =====
  return (
    <>
      <ToastNotification toasts={toasts} onClose={closeToast} />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Reporting</h1>
            <p className="text-gray-600 mt-1">Track student activities and generate reports</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                showFilters 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {activeTab === 'students' && (
              <>
                <button 
                  onClick={handleExportExcel}
                  disabled={exporting || loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export Excel'}
                </button>
                <button 
                  onClick={handleExportPDF}
                  disabled={exporting || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview & Analytics
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'students'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Student Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={filters.departmentId}
                  onChange={(e) => {
                    setFilters({ ...filters, departmentId: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={filters.classId}
                  onChange={(e) => {
                    setFilters({ ...filters, classId: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session/Term
                </label>
                <select
                  value={filters.session}
                  onChange={(e) => {
                    setFilters({ ...filters, session: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Sessions</option>
                  <option value="JAN_APRIL">Jan-April</option>
                  <option value="MAY_AUGUST">May-August</option>
                  <option value="SEPT_DEC">Sept-Dec</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={filters.academicYear}
                  onChange={(e) => {
                    setFilters({ ...filters, academicYear: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Years</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.academicStatus}
                  onChange={(e) => {
                    setFilters({ ...filters, academicStatus: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    departmentId: '',
                    classId: '',
                    session: '',
                    academicYear: '',
                    academicStatus: '',
                  });
                  setCurrentPage(1);
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'overview' ? (
          <>
            {/* Stats Cards */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading statistics...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 ${stat.color} rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-gray-600 text-sm mt-1">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Session Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Session/Term Breakdown</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sessionBreakdown.length > 0 ? (
                      sessionBreakdown.map((session, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <h3 className="font-medium text-gray-900 mb-2">{session.session}</h3>
                          <p className="text-2xl font-bold text-blue-600">{session.studentCount}</p>
                          <p className="text-sm text-gray-600">students ({session.percentage}%)</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${session.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 col-span-3 text-center py-4">No session data available</p>
                    )}
                  </div>
                </div>

                {/* Class Performance & Department Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Overview</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {classPerformance.length > 0 ? (
                        classPerformance.map((item, index) => (
                          <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{item.classCode}</h3>
                                <p className="text-sm text-gray-600">{item.studentCount} students</p>
                              </div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                                {item.averageScore}% avg
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Average Score</span>
                                <span className="font-medium">{item.averageScore}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(item.averageScore, 100)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Attendance</span>
                                <span className="font-medium">{item.attendanceRate}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(item.attendanceRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No class performance data available</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Statistics</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {departmentStats.length > 0 ? (
                        departmentStats.map((dept, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <h3 className="font-medium text-gray-900 mb-3">{dept.departmentName}</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Total Students</p>
                                <p className="text-xl font-bold text-gray-900">{dept.studentCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Active</p>
                                <p className="text-xl font-bold text-green-600">{dept.activeCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Male</p>
                                <p className="text-lg font-semibold text-blue-600">{dept.maleCount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Female</p>
                                <p className="text-lg font-semibold text-pink-600">{dept.femaleCount}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${(dept.maleCount / dept.studentCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-pink-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${(dept.femaleCount / dept.studentCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">No department data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Students Table Tab */}
            <div className="bg-white rounded-lg shadow">
              {/* Search and Controls */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                    <span className="text-sm text-gray-500">| Total {pagination.total} students</span>
                  </div>

                  <div className="relative ml-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm mt-2">Adjust your filters or search criteria.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Admission No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Gender
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Programme
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Session
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Reports
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Last Reported
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900">{student.admissionNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{student.gender}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{student.class}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{student.programme}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{student.session}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.academicStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              student.academicStatus === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                              student.academicStatus === 'GRADUATED' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {student.academicStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              <FileText size={14} />
                              {student.reportCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(student.lastReported)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleReportStudent(student.id)}
                              disabled={reporting === student.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {reporting === student.id ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <CheckCircle size={14} />
                                  Report
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>

                  {getPaginationPages().map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="px-2 text-gray-500">
                        {page}
                      </span>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
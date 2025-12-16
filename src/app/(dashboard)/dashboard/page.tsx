// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, GraduationCap, DollarSign, Building2, Loader } from "lucide-react";
import {
  getDashboardStats,
  getStudentsByGender,
  getStudentsByDepartment,
  getSubjectRegistrationStats,
  getStudentRecord,
  getTotalApplicants,
  getAcademicYears,
} from "@/actions/dashboard";
import { Session, AcademicStatus } from "@prisma/client";

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatar?: string | null;
  isActive: boolean;
}

interface DashboardData {
  stats: {
    totalStudents: number;
    activeClasses: number;
    totalDepartments: number;
    totalRevenue: number;
  };
  genderData: Array<{
    gender: string;
    count: number;
    color: string;
  }>;
  departmentData: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  subjectRegistration: {
    registered: number;
    notRegistered: number;
  };
  studentRecord: {
    active: number;
    inactive: number;
  };
  applicants: {
    total: number;
    male: number;
    female: number;
    others: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    status: "ACTIVE" as AcademicStatus | "ALL",
    academicYear: "",
    session: "" as Session | "ALL",
  });

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAcademicYears();
    }
  }, [user]);

  useEffect(() => {
    if (user && filters.academicYear) {
      loadDashboardData();
    }
  }, [filters, user]);

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

  const loadAcademicYears = async () => {
    const result = await getAcademicYears();
    if (result.success && result.data) {
      setAcademicYears(result.data);
      if (result.data.length > 0) {
        setFilters((prev) => ({ ...prev, academicYear: result.data[0] }));
      }
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const filterParams = {
        academicYear: filters.academicYear || undefined,
        session: filters.session !== "ALL" ? filters.session : undefined,
        status: filters.status !== "ALL" ? filters.status : undefined,
      };

      // Fetch all data in parallel
      const [
        statsResult,
        genderResult,
        departmentResult,
        registrationResult,
        recordResult,
        applicantsResult,
      ] = await Promise.all([
        getDashboardStats(filterParams),
        getStudentsByGender(filterParams),
        getStudentsByDepartment(filterParams),
        getSubjectRegistrationStats(filterParams),
        getStudentRecord(filterParams),
        getTotalApplicants(),
      ]);

      if (!statsResult.success) {
        setError(statsResult.error || "Failed to load dashboard data");
        return;
      }

      setData({
        stats: statsResult.data!,
        genderData: genderResult.success ? genderResult.data! : [],
        departmentData: departmentResult.success ? departmentResult.data! : [],
        subjectRegistration: registrationResult.success
          ? registrationResult.data!
          : { registered: 0, notRegistered: 0 },
        studentRecord: recordResult.success ? recordResult.data! : { active: 0, inactive: 0 },
        applicants: applicantsResult.success
          ? applicantsResult.data!
          : { total: 0, male: 0, female: 0, others: 0 },
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`;
    }
    return `KES ${amount.toLocaleString()}`;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-cyan-700" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading state while loading dashboard data
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-cyan-700" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const stats = data
    ? [
        {
          title: "Total Students",
          value: data.stats.totalStudents.toLocaleString(),
          change: "+12%",
          icon: Users,
          color: "bg-blue-500",
        },
        {
          title: "Active Classes",
          value: data.stats.activeClasses.toString(),
          change: "+5%",
          icon: GraduationCap,
          color: "bg-green-500",
        },
        {
          title: "Total Revenue",
          value: formatCurrency(data.stats.totalRevenue),
          change: "+8%",
          icon: DollarSign,
          color: "bg-yellow-500",
        },
        {
          title: "Departments",
          value: data.stats.totalDepartments.toString(),
          change: "0%",
          icon: Building2,
          color: "bg-purple-500",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header with User Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                {user?.role.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as AcademicStatus | "ALL" })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPELLED">Expelled</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
          <select
            value={filters.academicYear}
            onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent focus:outline-none"
          >
            {academicYears.length === 0 ? (
              <option>No academic years</option>
            ) : (
              academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))
            )}
          </select>
          <select
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value as Session | "ALL" })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent focus:outline-none"
          >
            <option value="ALL">All Sessions</option>
            <option value="SEPT_DEC">SEPT - DEC</option>
            <option value="JAN_APRIL">JAN - APRIL</option>
            <option value="MAY_AUGUST">MAY - AUGUST</option>
          </select>
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Population by Gender */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Population by Gender</h3>
          <div className="grid grid-cols-3 gap-4">
            {data?.genderData.map((item) => (
              <div key={item.gender} className="text-center">
                <div className={`${item.color} rounded-lg p-6 mb-3`}>
                  <Users className="text-white mx-auto" size={32} />
                </div>
                <p className="text-sm text-gray-600">{item.gender}</p>
                <p className="text-2xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Student Population Per Department */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Student Population Per Department
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.departmentData.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No department data available</p>
            ) : (
              data?.departmentData.map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate" title={dept.name}>
                      {dept.name}
                    </span>
                    <span className="font-semibold text-gray-900 ml-2">
                      {dept.percentage}% ({dept.count})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${dept.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${dept.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject Registration */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subject Registration</h3>
            <div className="flex gap-2">
              <select
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
              >
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={filters.session}
                onChange={(e) =>
                  setFilters({ ...filters, session: e.target.value as Session | "ALL" })
                }
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700"
              >
                <option value="ALL">All</option>
                <option value="SEPT_DEC">SEPT - DEC</option>
                <option value="JAN_APRIL">JAN - APRIL</option>
                <option value="MAY_AUGUST">MAY - AUGUST</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 bg-teal-50 rounded-lg">
              <GraduationCap className="text-teal-600 mx-auto mb-2" size={32} />
              <p className="text-3xl font-bold text-gray-900">
                {data?.subjectRegistration.registered.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">Registered</p>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <GraduationCap className="text-red-600 mx-auto mb-2" size={32} />
              <p className="text-3xl font-bold text-gray-900">
                {data?.subjectRegistration.notRegistered.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">Not Registered</p>
            </div>
          </div>
        </div>

        {/* Cumulative Student Record */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Student Record</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full border-8 border-teal-500 flex items-center justify-center">
                <div>
                  <p className="text-3xl font-bold text-teal-600">
                    {data?.studentRecord.active.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">Active</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto rounded-full border-8 border-red-500 flex items-center justify-center">
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    {data?.studentRecord.inactive.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 font-medium">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Applicants */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Applicants</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">
              {data?.applicants.total.toLocaleString()}
            </p>
            <div className="flex gap-8 mt-4 justify-center">
              <div>
                <p className="text-sm text-gray-600">Male</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.applicants.male.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Female</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.applicants.female.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Others</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.applicants.others.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
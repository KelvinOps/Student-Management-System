// app/(dashboard)/student-management/student-search/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, Mail, Phone, MapPin, User, BookOpen, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { searchStudents, getSearchFiltersData } from "@/actions/student-search";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string | null;
  phoneNumber: string | null;
  gender: string;
  academicStatus: string;
  session: string;
  class: {
    id: string;
    code: string;
    name: string;
    branch: string;
  };
  programme: {
    id: string;
    code: string;
    name: string;
    level: string;
  };
  department: {
    id: string;
    code: string;
    name: string;
  };
}

interface FilterData {
  classes: Array<{ id: string; code: string; name: string; branch?: string }>;
  departments: Array<{ id: string; code: string; name: string }>;
  programmes: Array<{ id: string; code: string; name: string; level: string }>;
}

export default function StudentSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    classId: "",
    departmentId: "",
    programmeId: "",
    academicStatus: "",
    gender: "",
    session: "",
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterData, setFilterData] = useState<FilterData>({
    classes: [],
    departments: [],
    programmes: [],
  });

  // Load filter options on mount
  useEffect(() => {
    loadFilterData();
  }, []);

  // Define handleSearch with useCallback to stabilize the reference
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchStudents({
        search: searchTerm,
        ...filters,
      });

      if (result.success && result.data) {
        setStudents(result.data);
      } else {
        setStudents([]);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err) {
      console.error("Error searching students:", err);
      setStudents([]);
      setError("An unexpected error occurred while searching");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  // Auto-search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, handleSearch]); // Added handleSearch to dependency array

  const loadFilterData = async () => {
    try {
      const result = await getSearchFiltersData();
      if (result.success && result.data) {
        setFilterData(result.data);
      }
    } catch (err) {
      console.error("Error loading filter data:", err);
      setError("Failed to load filter options");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      classId: "",
      departmentId: "",
      programmeId: "",
      academicStatus: "",
      gender: "",
      session: "",
    });
    setError(null);
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      INACTIVE: "bg-gray-100 text-gray-700",
      GRADUATED: "bg-blue-100 text-blue-700",
      SUSPENDED: "bg-red-100 text-red-700",
      WITHDRAWN: "bg-orange-100 text-orange-700",
      EXPELLED: "bg-red-200 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-700";
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, " - ");
  };

  const exportToCSV = () => {
    if (students.length === 0) {
      alert("No students to export");
      return;
    }

    const headers = [
      "Admission Number",
      "First Name",
      "Middle Name",
      "Last Name",
      "Email",
      "Phone",
      "Gender",
      "Class",
      "Programme",
      "Department",
      "Session",
      "Status",
    ];

    const csvData = students.map((student) => [
      student.admissionNumber,
      student.firstName,
      student.middleName || "",
      student.lastName,
      student.email || "",
      student.phoneNumber || "",
      student.gender,
      student.class.code,
      student.programme.name,
      student.department.name,
      formatSession(student.session),
      student.academicStatus,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_search_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Search</h1>
          <p className="text-gray-600 mt-1">Search and filter students across all programmes</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={students.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Results ({students.length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, admission number, email, phone, ID number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            {(searchTerm || Object.values(filters).some((v) => v !== "")) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Reset All
              </button>
            )}
            {loading && (
              <span className="text-sm text-gray-500 ml-2 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </span>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={filters.departmentId}
                  onChange={(e) =>
                    setFilters({ ...filters, departmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Departments</option>
                  {filterData.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programme
                </label>
                <select
                  value={filters.programmeId}
                  onChange={(e) =>
                    setFilters({ ...filters, programmeId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Programmes</option>
                  {filterData.programmes.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.name} ({prog.level})
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
                  onChange={(e) =>
                    setFilters({ ...filters, classId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Classes</option>
                  {filterData.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Status
                </label>
                <select
                  value={filters.academicStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, academicStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) =>
                    setFilters({ ...filters, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Genders</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session
                </label>
                <select
                  value={filters.session}
                  onChange={(e) =>
                    setFilters({ ...filters, session: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Sessions</option>
                  <option value="SEPT_DEC">Sept - Dec</option>
                  <option value="JAN_APRIL">Jan - April</option>
                  <option value="MAY_AUGUST">May - August</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Searching students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No students found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filters to find students.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{students.length}</span> student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-lg">
                        {student.firstName.charAt(0)}
                        {student.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.firstName}{" "}
                        {student.middleName ? student.middleName + " " : ""}
                        {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {student.admissionNumber}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getStatusBadgeClass(
                      student.academicStatus
                    )}`}
                  >
                    {student.academicStatus}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>{student.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{student.class.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate" title={student.programme.name}>
                      {student.programme.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{student.department.name}</span>
                  </div>
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                  {student.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{student.phoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/student-management/students/${student.id}`}
                    className="w-full block text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
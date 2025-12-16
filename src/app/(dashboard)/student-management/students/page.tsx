// app/(dashboard)/student-management/students/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Upload, FileDown, Eye, Edit, Trash2 } from 'lucide-react';
import { getStudents, deleteStudent } from '@/actions/student';
import { getStudentsForExport } from '@/actions/student-export';
import { getDepartments } from '@/actions/department';
import { getClasses } from '@/actions/class';
import { exportToExcel, exportToPDF } from '@/app/lib/export-utils';

interface StudentData {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  session: string;
  academicStatus: string;
  class?: {
    code: string;
  } | null;
  programme?: {
    name: string;
  } | null;
  department?: {
    name: string;
  } | null;
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
}

interface Filters {
  departmentId: string;
  classId: string;
  academicStatus: string;
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    departmentId: '',
    classId: '',
    academicStatus: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    loadDepartments();
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  const loadDepartments = async () => {
    try {
      const result = await getDepartments();
      if (result.success && Array.isArray(result.data)) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const result = await getClasses();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const result = await getStudents({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters,
      });

      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
      setPagination({ total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const result = await deleteStudent(id);
      if (result.success) {
        await loadStudents();
      } else {
        alert(result.error || 'Failed to delete student');
      }
    } catch (error) {
      alert('Error deleting student');
      console.error('Error:', error);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const result = await getStudentsForExport({
        search: searchTerm,
        ...filters,
      });

      if (result.success && result.data.length > 0) {
        exportToExcel(result.data, 'students_list');
        alert(`Successfully exported ${result.data.length} students to Excel`);
      } else {
        alert('No data to export');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const result = await getStudentsForExport({
        search: searchTerm,
        ...filters,
      });

      if (result.success && result.data.length > 0) {
        exportToPDF(result.data, 'Students List');
      } else {
        alert('No data to export');
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    alert('Import functionality coming soon!');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'GRADUATED':
        return 'bg-blue-100 text-blue-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Student Management &gt; Students &gt; Listing
          </nav>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting}
          >
            <Upload size={18} />
            Import Students
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting || loading}
          >
            <Download size={18} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exporting || loading}
          >
            <FileDown size={18} />
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <Link
            href="/student-management/students/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 ml-auto"
          >
            <Plus size={18} />
            Add Student
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
            <span className="text-sm text-gray-500">| Total {pagination.total} entries</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent w-full"
              />
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                Status
              </label>
              <select
                value={filters.academicStatus}
                onChange={(e) => {
                  setFilters({ ...filters, academicStatus: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students found. Add your first student to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{student.admissionNumber}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {student.firstName} {student.middleName} {student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.gender}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.class?.code || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.programme?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.department?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatSession(student.session)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(student.academicStatus)}`}>
                        {student.academicStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/student-management/students/${student.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/student-management/students/${student.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            «
          </button>

          {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNum
                    ? 'bg-cyan-700 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {pagination.totalPages > 5 && (
            <>
              <span className="px-2">...</span>
              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
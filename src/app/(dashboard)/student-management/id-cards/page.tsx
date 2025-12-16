'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { getIDCardsData } from '@/actions/id-card'
import { getDepartments } from '@/actions/department';
import { getClasses } from '@/actions/class';
import { downloadIDCard, downloadAllIDCards } from '@/app/lib/id-card-utils';

interface IDCardData {
  id: string;
  name: string;
  admissionNo: string;
  avatar: string | null;
  class: string;
  programme: string;
  department: string;
  academicYear: string;
  session: string;
  validUntil: string;
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

interface Filters {
  departmentId: string;
  classId: string;
  academicStatus: string;
}

export default function IDCardsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [students, setStudents] = useState<IDCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [filters, setFilters] = useState<Filters>({
    departmentId: '',
    classId: '',
    academicStatus: 'ACTIVE',
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
    loadIDCards();
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

  const loadIDCards = async () => {
    setLoading(true);
    try {
      const result = await getIDCardsData({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...filters,
      });

      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error loading ID cards:', error);
      setStudents([]);
      setPagination({ total: 0, totalPages: 0, currentPage: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    setDownloading(true);
    try {
      downloadAllIDCards(students);
    } catch (error) {
      console.error('Error downloading ID cards:', error);
      alert('Failed to download ID cards');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleDownloadCard = (student: IDCardData) => {
    try {
      downloadIDCard(student);
    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Failed to download ID card');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ID Cards</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Student Management &gt; ID Cards &gt; Listing
          </nav>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleDownloadAll}
            disabled={downloading || loading || students.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {downloading ? 'Generating...' : `Generate All (${students.length})`}
          </button>
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
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
            <span className="text-sm text-gray-500">| Total {pagination.total} entries</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              />
            </div>
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
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ID Cards Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading ID cards...
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No students found for ID card generation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-4 border-cyan-700">
                {/* Card Header */}
                <div className="bg-white p-4 text-center border-b-2 border-cyan-700">
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🏫</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Kongoni Technical and Vocational College
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-gradient-to-br from-cyan-50 to-white">
                  {/* Photo */}
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 bg-cyan-600 rounded-lg flex items-center justify-center overflow-hidden">
                      {student.avatar ? (
                        <img 
                          src={student.avatar} 
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-20 h-20 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{student.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{student.admissionNo}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {student.programme}<br/>
                      {student.department}<br/>
                      Class: {student.class}
                    </p>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                      <div className="w-20 h-20 bg-black opacity-80"></div>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Valid Until: {student.validUntil}</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-cyan-700 px-4 py-2 text-center">
                  <button 
                    onClick={() => handleDownloadCard(student)}
                    className="text-white text-sm hover:underline"
                  >
                    Download Card
                  </button>
                </div>
              </div>
            ))}
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
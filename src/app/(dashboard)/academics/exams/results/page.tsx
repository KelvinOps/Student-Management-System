// app/(dashboard)/academics/exams/results/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Download, Eye } from 'lucide-react';
import { getExamResults } from '@/actions/exam';
import { getClasses } from '@/actions/class';
import Link from 'next/link';

interface Class {
  id: string;
  code: string;
  name: string;
}

interface ExamResult {
  id: string;
  session: string;
  classCode: string;
  scheduleType: string;
  examType: string;
  overallPerformance: string | null;
  competence: string | null;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  };
  examSchedule: {
    id: string;
    scheduleType: string;
    session: string;
    examType: string;
    examStartDate: Date;
    examEndDate: Date;
  };
}

export default function ExamResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    classCode: '',
    session: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadResults();
  }, [currentPage, filters]);

  const loadClasses = async () => {
    const result = await getClasses();
    if (result.success && Array.isArray(result.data)) {
      setClasses(result.data);
    }
  };

  const loadResults = async () => {
    setLoading(true);
    try {
      const result = await getExamResults({
        classCode: filters.classCode || undefined,
        session: filters.session || undefined,
        page: currentPage,
        limit: 20,
      });

      if (result.success && Array.isArray(result.data)) {
        let filteredData = result.data;

        // Apply search filter
        if (filters.search) {
          filteredData = filteredData.filter((r: ExamResult) => {
            const searchTerm = filters.search.toLowerCase();
            return (
              r.student.admissionNumber.toLowerCase().includes(searchTerm) ||
              r.student.firstName.toLowerCase().includes(searchTerm) ||
              r.student.lastName.toLowerCase().includes(searchTerm)
            );
          });
        }

        setResults(filteredData);
        setPagination(result.pagination || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getCompetenceBadge = (competence: string | null) => {
    if (!competence) return null;
    
    const badges: Record<string, string> = {
      C: 'bg-green-100 text-green-800',
      P: 'bg-yellow-100 text-yellow-800',
      I: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      C: 'Competent',
      P: 'Progressing',
      I: 'Insufficient',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[competence]}`}>
        {labels[competence]}
      </span>
    );
  };

  const getPerformanceBadge = (performance: string | null) => {
    if (!performance) return null;

    const badges: Record<string, string> = {
      MM: 'bg-purple-100 text-purple-800',
      M: 'bg-green-100 text-green-800',
      A: 'bg-blue-100 text-blue-800',
      P: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[performance] || 'bg-gray-100 text-gray-800'}`}>
        {performance}
      </span>
    );
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
        <nav className="text-sm text-gray-600 mt-1">
          Dashboard &gt; Student Academics &gt; Exam Results
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <Download size={18} />
            Export Results
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FileText size={18} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by admission no. or name..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={filters.classCode}
              onChange={(e) => {
                setFilters({ ...filters, classCode: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.code}>
                  {cls.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session
            </label>
            <select
              value={filters.session}
              onChange={(e) => {
                setFilters({ ...filters, session: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Sessions</option>
              <option value="SEPT_DEC">Sept - Dec</option>
              <option value="JAN_APRIL">Jan - April</option>
              <option value="MAY_AUGUST">May - August</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No exam results found. Results will appear here once exams are completed and graded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Admission No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Class
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Exam Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Performance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Competence
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {result.student.admissionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {result.student.firstName} {result.student.middleName}{' '}
                      {result.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {result.classCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatSession(result.session)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {result.examType}
                    </td>
                    <td className="px-4 py-3">
                      {getPerformanceBadge(result.overallPerformance)}
                    </td>
                    <td className="px-4 py-3">
                      {getCompetenceBadge(result.competence)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/academics/exams/transcripts?studentId=${result.student.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Transcript"
                      >
                        <Eye size={18} />
                      </Link>
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
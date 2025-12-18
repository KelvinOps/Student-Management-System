// app/(dashboard)/academics/exams/results/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Download, Eye } from 'lucide-react';
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

  // Load classes on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const result = await getClasses();
      if (result.success && Array.isArray(result.data)) {
        setClasses(result.data);
      }
    };
    loadInitialData();
  }, []);

  // Memoized loadResults function
  const loadResults = useCallback(async () => {
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

        // Apply search filter locally if search is provided
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
      } else {
        setResults([]);
        setPagination({ total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading results:', error);
      setResults([]);
      setPagination({ total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters.classCode, filters.session, currentPage, filters.search]);

  // Load results when dependencies change
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const getCompetenceBadge = (competence: string | null) => {
    if (!competence) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Not Set
        </span>
      );
    }
    
    const badges: Record<string, string> = {
      C: 'bg-green-100 text-green-800 border border-green-300',
      P: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      I: 'bg-red-100 text-red-800 border border-red-300',
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
    if (!performance) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Not Set
        </span>
      );
    }

    const badges: Record<string, string> = {
      MM: 'bg-purple-100 text-purple-800 border border-purple-300',
      M: 'bg-green-100 text-green-800 border border-green-300',
      A: 'bg-blue-100 text-blue-800 border border-blue-300',
      P: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      S: 'bg-teal-100 text-teal-800 border border-teal-300',
      NS: 'bg-red-100 text-red-800 border border-red-300',
    };

    const labels: Record<string, string> = {
      MM: 'Merit',
      M: 'Meritorious',
      A: 'Achieved',
      P: 'Pass',
      S: 'Satisfactory',
      NS: 'Not Satisfactory',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[performance] || 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
        {labels[performance] || performance}
      </span>
    );
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleExportResults = async () => {
    try {
      // TODO: Implement export functionality
      console.log('Exporting results...');
      alert('Export feature coming soon!');
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export results');
    }
  };

  const handleGenerateReport = async () => {
    try {
      // TODO: Implement report generation
      console.log('Generating report...');
      alert('Report generation feature coming soon!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const clearFilters = () => {
    setFilters({
      classCode: '',
      session: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const paginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we don't have enough pages
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis-start" className="px-2 text-gray-500">...</span>);
      }
    }

    // Page buttons
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      buttons.push(
        <button
          key={pageNum}
          onClick={() => setCurrentPage(pageNum)}
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === pageNum
              ? 'bg-cyan-700 text-white'
              : 'border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {pageNum}
        </button>
      );
    }

    // Last page button
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        buttons.push(<span key="ellipsis-end" className="px-2 text-gray-500">...</span>);
      }
      buttons.push(
        <button
          key={pagination.totalPages}
          onClick={() => setCurrentPage(pagination.totalPages)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          {pagination.totalPages}
        </button>
      );
    }

    return buttons;
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
          <button
            onClick={handleExportResults}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Download size={18} />
            Export Results
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText size={18} />
            Generate Report
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Filters
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class
            </label>
            <select
              value={filters.classCode}
              onChange={(e) => handleFilterChange('classCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.code}>
                  {cls.code} - {cls.name}
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
              onChange={(e) => handleFilterChange('session', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
            >
              <option value="">All Sessions</option>
              <option value="SEPT_DEC">Sept - Dec</option>
              <option value="JAN_APRIL">Jan - April</option>
              <option value="MAY_AUGUST">May - August</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => loadResults()}
              disabled={loading}
              className="w-full px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh Results'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700"></div>
            <p className="mt-2 text-gray-500">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Exam Results Found</h3>
            <p className="mb-4">
              {filters.search || filters.classCode || filters.session
                ? 'No results match your search criteria. Try adjusting your filters.'
                : 'No exam results available. Results will appear here once exams are completed and graded.'}
            </p>
            {(filters.search || filters.classCode || filters.session) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
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
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {result.student.admissionNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
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
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Transcript"
                        >
                          <Eye size={18} />
                          <span className="text-xs">View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center text-sm text-gray-600">
              <div>
                Showing {results.length} of {pagination.total} results
              </div>
              <div>
                Page {currentPage} of {pagination.totalPages}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            « Previous
          </button>

          {paginationButtons()}

          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next »
          </button>
        </div>
      )}
    </div>
  );
}
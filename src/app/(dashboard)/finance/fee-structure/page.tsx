// app/(dashboard)/finance/fee-structure/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import Link from 'next/link';
import { Plus, Filter, Download, Edit, Trash2, Eye } from 'lucide-react';
import { getFeeStructures, deleteFeeStructure } from '@/actions/fee-structure';
import { getProgrammes } from '@/actions/programme';

interface FeeStructure {
  id: string;
  programmeId: string;
  academicYear: string;
  session: string;
  tuitionFee: number;
  examFee?: number | null;
  libraryFee?: number | null;
  activityFee?: number | null;
  totalFee: number;
  isActive: boolean;
  createdAt: Date;
}

interface Programme {
  id: string;
  code: string;
  name: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
}

interface Filters {
  programmeId: string;
  academicYear: string;
  session: string;
  isActive: string;
}

export default function FeeStructurePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [filters, setFilters] = useState<Filters>({
    programmeId: '',
    academicYear: '',
    session: '',
    isActive: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  // Define loadFeeStructures with useCallback
  const loadFeeStructures = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFeeStructures({
        page: currentPage,
        limit: itemsPerPage,
        programmeId: filters.programmeId || undefined,
        academicYear: filters.academicYear || undefined,
        session: filters.session || undefined,
        isActive: filters.isActive ? filters.isActive === 'true' : undefined,
      });

      if (result.success && Array.isArray(result.data)) {
        setFeeStructures(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error loading fee structures:', error);
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]); // Add dependencies

  useEffect(() => {
    loadProgrammes();
  }, []);

  useEffect(() => {
    loadFeeStructures();
  }, [currentPage, itemsPerPage, filters, loadFeeStructures]); // Add loadFeeStructures to dependencies

  const loadProgrammes = async () => {
    try {
      const result = await getProgrammes();
      if (result.success && Array.isArray(result.data)) {
        setProgrammes(result.data);
      }
    } catch (error) {
      console.error('Error loading programmes:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) {
      return;
    }

    try {
      const result = await deleteFeeStructure(id);
      if (result.success) {
        await loadFeeStructures();
      } else {
        alert(result.error || 'Failed to delete fee structure');
      }
    } catch (error) {
      alert('Error deleting fee structure');
      console.error('Error:', error);
    }
  };

  const formatSession = (session: string) => {
    return session.replace(/_/g, ' - ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getProgrammeName = (programmeId: string) => {
    const programme = programmes.find((p) => p.id === programmeId);
    return programme ? `${programme.code} - ${programme.name}` : programmeId;
  };

  const academicYears = ['2024/2025', '2025/2026', '2026/2027'];
  const sessions = ['SEPT_DEC', 'JAN_APRIL', 'MAY_AUGUST'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Structure</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Finance &gt; Fee Structure
          </nav>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/finance/fee-structure/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Add Fee Structure
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Print Report
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
            <span className="text-sm text-gray-500">| Total {pagination.total} entries</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme
              </label>
              <select
                value={filters.programmeId}
                onChange={(e) => {
                  setFilters({ ...filters, programmeId: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Programmes</option>
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.code} - {prog.name}
                  </option>
                ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                {sessions.map((session) => (
                  <option key={session} value={session}>
                    {formatSession(session)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => {
                  setFilters({ ...filters, isActive: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading fee structures...
          </div>
        ) : feeStructures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No fee structures found. Add your first fee structure to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Programme
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Academic Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tuition Fee
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Fee
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
                {feeStructures.map((structure) => (
                  <tr key={structure.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getProgrammeName(structure.programmeId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {structure.academicYear}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatSession(structure.session)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {formatCurrency(structure.tuitionFee)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(structure.totalFee)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          structure.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/finance/fee-structure/${structure.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/finance/fee-structure/${structure.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(structure.id)}
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
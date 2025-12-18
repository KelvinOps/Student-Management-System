// app/(dashboard)/student-management/classes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getClasses,
  deleteClass,
  exportClassesData,
} from '@/actions/class';
import { toast } from 'sonner';

interface ClassData {
  id: string;
  code: string;
  name: string;
  branch: string;
  sessionType: string;
  modeOfStudy: string;
  startDate: Date;
  endDate: Date;
  numberOfTeachers: number;
  status: string;
  programme: {
    name: string;
    department: {
      name: string;
    };
  };
  _count: {
    students: number;
  };
}

interface PaginationState {
  total: number;
  pages: number;
  current: number;
  limit: number;
}

interface ExportRow {
  [key: string]: string | number | boolean | null;
}

export default function ClassesPage(): React.ReactElement {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    pages: 0,
    current: 1,
    limit: 10,
  });
  const [showActions, setShowActions] = useState<string | null>(null);

  // Extract pagination properties for useCallback dependencies
  const { limit, current } = pagination;

  // Fetch classes
  const fetchClasses = useCallback(async (): Promise<void> => {
    setLoading(true);
    const result = await getClasses({
      search: searchTerm,
      limit,
      page: current,
    });

    if (result.success && result.data) {
      setClasses(result.data as ClassData[]);
      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          ...result.pagination
        }));
      }
    } else {
      toast.error(result.error || 'Failed to fetch classes');
    }
    setLoading(false);
  }, [searchTerm, limit, current]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Handle export
  const handleExport = async (): Promise<void> => {
    const result = await exportClassesData();
    if (result.success && result.data && result.data.length > 0) {
      try {
        // Convert to CSV
        const firstRow = result.data[0] as ExportRow;
        const headers = Object.keys(firstRow).join(',');
        const rows = result.data
          .map((row: ExportRow) =>
            Object.values(row)
              .map((value) => {
                const stringValue = String(value ?? '');
                return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
              })
              .join(',')
          )
          .join('\n');
        const csv = `${headers}\n${rows}`;

        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `classes_${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Classes exported successfully');
      } catch (error) {
        console.error('Error exporting data:', error);
        toast.error('Failed to export classes');
      }
    } else {
      toast.error(result.error || 'No data to export');
    }
  };

  // Handle delete
  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    const result = await deleteClass(id);
    if (result.success) {
      toast.success(result.message || 'Class deleted successfully');
      fetchClasses();
    } else {
      toast.error(result.error || 'Failed to delete class');
    }
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Student Management &gt; Class &gt; Listing
          </nav>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            type="button"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            type="button"
          >
            <Download size={18} />
            Export Excel
          </button>
          <button
            onClick={() => router.push('/student-management/classes/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 ml-auto"
            type="button"
          >
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination(prev => ({ ...prev, limit: Number(e.target.value), current: 1 }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
            <span className="text-sm text-gray-500">
              | Total {pagination.total} entries
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Programme
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Session Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mode of Study
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Students
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
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No classes found
                  </td>
                </tr>
              ) : (
                classes.map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {classItem.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {classItem.branch}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {classItem.programme.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {classItem.sessionType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(classItem.startDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(classItem.endDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {classItem.modeOfStudy}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {classItem._count.students}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {classItem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setShowActions(
                            showActions === classItem.id ? null : classItem.id
                          )
                        }
                        className="text-gray-600 hover:text-gray-900"
                        type="button"
                        aria-label="More options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showActions === classItem.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => {
                              router.push(
                                `/student-management/classes/${classItem.id}`
                              );
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            type="button"
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              router.push(
                                `/student-management/classes/${classItem.id}/edit`
                              );
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            type="button"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(classItem.id);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            type="button"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() =>
            setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))
          }
          disabled={pagination.current === 1}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          aria-label="Previous page"
        >
          «
        </button>

        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
          let pageNum: number;
          if (pagination.pages <= 5) {
            pageNum = i + 1;
          } else if (pagination.current <= 3) {
            pageNum = i + 1;
          } else if (pagination.current >= pagination.pages - 2) {
            pageNum = pagination.pages - 4 + i;
          } else {
            pageNum = pagination.current - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => setPagination(prev => ({ ...prev, current: pageNum }))}
              className={`px-3 py-1 rounded ${
                pagination.current === pageNum
                  ? 'bg-cyan-700 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
              type="button"
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </button>
          );
        })}

        {pagination.pages > 5 && pagination.current < pagination.pages - 2 && (
          <>
            <span className="px-2">...</span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: pagination.pages }))}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              type="button"
              aria-label={`Go to page ${pagination.pages}`}
            >
              {pagination.pages}
            </button>
          </>
        )}

        <button
          onClick={() =>
            setPagination(prev => ({
              ...prev,
              current: Math.min(pagination.pages, prev.current + 1),
            }))
          }
          disabled={pagination.current === pagination.pages}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          aria-label="Next page"
        >
          »
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        Powered By ABNO Softwares International Ltd
      </div>
    </div>
  );
}
// app/(dashboard)/staff-management/page.tsx
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
  Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getUsers,
  deleteUser,
  exportUsersData,
} from '@/actions/user';
import { toast } from 'sonner';
import { UserRole } from '@prisma/client';

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
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

export default function StaffManagementPage(): React.ReactElement {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    pages: 0,
    current: 1,
    limit: 10,
  });
  const [showActions, setShowActions] = useState<string | null>(null);

// Extract current and limit from pagination for dependencies
const { current: currentPage, limit: pageLimit } = pagination;

// Fetch users - wrapped in useCallback to stabilize the reference
const fetchUsers = useCallback(async (): Promise<void> => {
  setLoading(true);
  const result = await getUsers({
    search: searchTerm,
    role: roleFilter || undefined,
    limit: pageLimit,  // Changed from pagination.limit
    page: currentPage, // Changed from pagination.current
  });

  if (result.success && result.data) {
    setUsers(result.data as UserData[]);
    if (result.pagination) {
      setPagination(prev => ({
        ...prev,
        ...result.pagination
      }));
    }
  } else {
    toast.error(result.error || 'Failed to fetch staff');
  }
  setLoading(false);
}, [searchTerm, roleFilter, currentPage, pageLimit]); // Dependencies are correct

useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

  // Handle export
  const handleExport = async (): Promise<void> => {
    const result = await exportUsersData();
    if (result.success && result.data && result.data.length > 0) {
      try {
        // Convert to CSV
        const firstRow = result.data[0] as ExportRow;
        const headers = Object.keys(firstRow).join(',');
        const rows = result.data
          .map((row: ExportRow) => 
            Object.values(row)
              .map(value => {
                // Handle special characters and quotes in CSV
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
          `staff_${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Staff data exported successfully');
      } catch (error) {
        console.error('Error exporting data:', error);
        toast.error('Failed to export staff data');
      }
    } else {
      toast.error(result.error || 'No data to export');
    }
  };

  // Handle delete
  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    const result = await deleteUser(id);
    if (result.success) {
      toast.success(result.message || 'Staff member deleted successfully');
      fetchUsers();
    } else {
      toast.error(result.error || 'Failed to delete staff member');
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

  // Role badge colors
  const getRoleBadgeColor = (role: UserRole): string => {
    const colors: Record<UserRole, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      STAFF: 'bg-green-100 text-green-800',
      TEACHER: 'bg-yellow-100 text-yellow-800',
      STUDENT: 'bg-gray-100 text-gray-800',
      PARENT: 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Staff Management &gt; Listing
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
            onClick={() => router.push('/staff-management/new')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-700 text-white rounded-lg hover:bg-cyan-800 ml-auto"
            type="button"
          >
            <Plus size={18} />
            Add Staff
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="TEACHER">Teacher</option>
            </select>
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setShowActions(showActions === user.id ? null : user.id)
                        }
                        className="text-gray-600 hover:text-gray-900"
                        type="button"
                        aria-label="More options"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showActions === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => {
                              router.push(`/staff-management/${user.id}`);
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
                              router.push(`/staff-management/${user.id}/edit`);
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
                              router.push(`/staff-management/${user.id}/password`);
                              setShowActions(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            type="button"
                          >
                            <Lock size={16} />
                            Change Password
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(user.id);
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
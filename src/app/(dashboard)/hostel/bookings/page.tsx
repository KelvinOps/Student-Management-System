// app/(dashboard)/hostel/bookings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Eye, Check, X } from 'lucide-react';
import { getBookings, confirmBooking, checkOutBooking } from '@/actions/hostel';

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: string;
}

interface BookingData {
  id: string;
  studentId: string;
  academicYear: string;
  session: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  amount: number;
  paymentStatus: string;
  student: StudentData;
  room: {
    id: string;
    roomNumber: number;
  };
  floor: {
    id: string;
    floorLevel: string;
  };
  block: {
    id: string;
    blockNumber: number;
  };
  payments: Array<{
    id: string;
    amount: number;
  }>;
}

interface Pagination {
  total: number;
  totalPages: number;
}

interface Filters {
  status: string;
  academicYear: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

export default function HostelBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    status: '',
    academicYear: new Date().getFullYear().toString(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [currentPage, itemsPerPage, searchTerm, filters]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await getBookings({
        page: currentPage,
        limit: itemsPerPage,
        status: filters.status ? (filters.status as BookingStatus) : undefined,
        academicYear: filters.academicYear || undefined,
      });

      if (result.success && Array.isArray(result.data)) {
        setBookings(result.data);
        setPagination(result.pagination || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      setPagination({ total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (id: string) => {
    if (!confirm('Are you sure you want to confirm this booking?')) {
      return;
    }

    setProcessingId(id);
    try {
      const result = await confirmBooking(id);
      if (result.success) {
        await loadBookings();
        alert('Booking confirmed successfully');
      } else {
        alert(result.error || 'Failed to confirm booking');
      }
    } catch (error) {
      alert('Error confirming booking');
      console.error('Error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    if (!confirm('Are you sure you want to check out this student?')) {
      return;
    }

    setProcessingId(id);
    try {
      const result = await checkOutBooking(id);
      if (result.success) {
        await loadBookings();
        alert('Student checked out successfully');
      } else {
        alert(result.error || 'Failed to check out student');
      }
    } catch (error) {
      alert('Error checking out student');
      console.error('Error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentBadgeClass = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hostel Bookings</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Hostel Management &gt; Booking Management
          </nav>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/hostel/bookings/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            New Booking
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} />
            Export Report
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent w-full"
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
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
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
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No bookings found. Create a new booking to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Admission No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Block/Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {booking.student.firstName} {booking.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {booking.student.admissionNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      B{booking.block.blockNumber}/R{booking.room.roomNumber} ({booking.floor.floorLevel})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(booking.checkInDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(booking.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      KES {booking.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadgeClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={processingId === booking.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Confirm Booking"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCheckOut(booking.id)}
                            disabled={processingId === booking.id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Check Out"
                          >
                            <X size={18} />
                          </button>
                        )}
                        <Link
                          href={`/hostel/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
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
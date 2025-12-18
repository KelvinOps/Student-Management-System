// app/(dashboard)/hostel/bookings/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  paymentStatus?: string;
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
  payments?: Array<{
    id: string;
    amount: number;
  }>;
  bed?: {
    id: string;
    bedNumber: number;
  };
}

interface Pagination {
  total: number;
  totalPages: number;
}

interface Filters {
  status: string;
  academicYear: string;
  session?: string;
}

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

// Define the API data type based on what getBookings returns
interface ApiBooking {
  id: string;
  studentId: string;
  academicYear: string;
  session?: string;
  checkInDate?: Date | string;
  checkOutDate?: Date | string;
  status?: string;
  amount?: number;
  student?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    admissionNumber?: string;
    gender?: string;
  };
  room?: {
    id?: string;
    roomNumber?: number;
  };
  floor?: {
    id?: string;
    floorLevel?: string;
  };
  block?: {
    id?: string;
    blockNumber?: number;
  };
  bed?: {
    id: string;
    bedNumber: number;
  };
}

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
  const [exporting, setExporting] = useState(false);

  // Filter bookings client-side based on search term and session
  const filterBookings = useCallback((data: BookingData[]) => {
    let filtered = [...data];
    
    // Filter by search term (client-side)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.student.firstName.toLowerCase().includes(term) ||
        booking.student.lastName.toLowerCase().includes(term) ||
        booking.student.admissionNumber.toLowerCase().includes(term)
      );
    }
    
    // Filter by session (client-side)
    if (filters.session) {
      filtered = filtered.filter(booking => booking.session === filters.session);
    }
    
    return filtered;
  }, [searchTerm, filters.session]);

  // Transform API data to BookingData format
  const transformBookingData = useCallback((apiData: unknown[]): BookingData[] => {
    // Safely cast to ApiBooking array
    const data = apiData as ApiBooking[];
    
    return data.map(item => ({
      id: item.id || '',
      studentId: item.studentId || '',
      academicYear: item.academicYear || '',
      session: item.session || 'JAN_APRIL',
      checkInDate: item.checkInDate ? new Date(item.checkInDate).toISOString() : new Date().toISOString(),
      checkOutDate: item.checkOutDate ? new Date(item.checkOutDate).toISOString() : new Date().toISOString(),
      status: item.status || 'PENDING',
      amount: item.amount || 0,
      paymentStatus: item.status === 'CONFIRMED' ? 'COMPLETED' : 'PENDING', // Map status to payment status
      student: {
        id: item.student?.id || '',
        firstName: item.student?.firstName || '',
        lastName: item.student?.lastName || '',
        admissionNumber: item.student?.admissionNumber || '',
        gender: item.student?.gender || '',
      },
      room: {
        id: item.room?.id || '',
        roomNumber: item.room?.roomNumber || 0,
      },
      floor: {
        id: item.floor?.id || '',
        floorLevel: item.floor?.floorLevel || '',
      },
      block: {
        id: item.block?.id || '',
        blockNumber: item.block?.blockNumber || 0,
      },
      payments: [], // Payments might come from a different API endpoint
      bed: item.bed ? {
        id: item.bed.id,
        bedNumber: item.bed.bedNumber,
      } : undefined,
    }));
  }, []);

  // Memoized loadBookings function
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBookings({
        page: currentPage,
        limit: itemsPerPage,
        status: filters.status ? (filters.status as BookingStatus) : undefined,
        academicYear: filters.academicYear || undefined,
      });

      if (result.success && Array.isArray(result.data)) {
        // Transform API data to BookingData format
        const transformedData = transformBookingData(result.data);
        
        // Apply client-side filtering for session and search
        const filteredBookings = filterBookings(transformedData);
        setBookings(filteredBookings);
        
        // Update pagination based on filtered results
        const filteredTotal = filteredBookings.length;
        const originalTotal = result.pagination?.total || 0;
        
        // If we filtered client-side, adjust the pagination
        if (searchTerm || filters.session) {
          setPagination({
            total: filteredTotal,
            totalPages: Math.ceil(filteredTotal / itemsPerPage),
          });
        } else {
          setPagination({
            total: originalTotal,
            totalPages: result.pagination?.totalPages || 0,
          });
        }
      } else {
        setBookings([]);
        setPagination({ total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      setPagination({ total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters.status, filters.academicYear, filterBookings, searchTerm, filters.session, transformBookingData]);

  // Load bookings when dependencies change
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

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

  const handleExportReport = async () => {
    setExporting(true);
    try {
      // TODO: Implement export functionality
      console.log('Exporting bookings report...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      alert('Export feature coming soon!');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'CHECKED_IN':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPaymentBadgeClass = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const calculateDuration = (checkIn: string, checkOut: string) => {
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    } catch {
      return 'N/A';
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      academicYear: new Date().getFullYear().toString(),
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    const startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if needed
    let adjustedStartPage = startPage;
    if (endPage - startPage + 1 < maxVisiblePages) {
      adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button
    if (adjustedStartPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          1
        </button>
      );
      if (adjustedStartPage > 2) {
        buttons.push(<span key="ellipsis-start" className="px-2 text-gray-500">...</span>);
      }
    }

    // Page buttons
    for (let pageNum = adjustedStartPage; pageNum <= endPage; pageNum++) {
      buttons.push(
        <button
          key={pageNum}
          onClick={() => handlePageChange(pageNum)}
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
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          {pagination.totalPages}
        </button>
      );
    }

    return buttons;
  };

  const getBookingStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'PENDING').length,
      confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
      checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
      checkedOut: bookings.filter(b => b.status === 'CHECKED_OUT').length,
      totalAmount: bookings.reduce((sum, b) => sum + b.amount, 0),
      paidAmount: bookings.filter(b => b.paymentStatus === 'COMPLETED')
        .reduce((sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0), 0),
    };
    return stats;
  };

  const stats = getBookingStats();

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <span className="text-cyan-700 font-bold">🏢</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">⏳</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                KES {stats.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/hostel/bookings/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={18} />
            New Booking
          </Link>
          <button
            onClick={handleExportReport}
            disabled={exporting || bookings.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Report
              </>
            )}
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
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
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
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
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
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                value={filters.session || ''}
                onChange={(e) => {
                  setFilters({ ...filters, session: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-700 focus:border-transparent"
              >
                <option value="">All Sessions</option>
                <option value="JAN_APRIL">January - April</option>
                <option value="MAY_AUGUST">May - August</option>
                <option value="SEPT_DEC">September - December</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700"></div>
            <p className="mt-2 text-gray-500">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Bookings Found</h3>
            <p className="mb-4">
              {searchTerm || filters.status || filters.academicYear || filters.session
                ? 'No bookings match your search criteria. Try adjusting your filters.'
                : 'No bookings available. Create a new booking to get started.'}
            </p>
            {(searchTerm || filters.status || filters.academicYear || filters.session) && (
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
                      Duration
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
                  {bookings.map((booking) => {
                    const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {booking.student.firstName} {booking.student.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.student.gender}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {booking.student.admissionNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>
                            <span className="font-medium">
                              B{booking.block.blockNumber}/R{booking.room.roomNumber}
                              {booking.bed && `/B${booking.bed.bedNumber}`}
                            </span>
                            <div className="text-xs text-gray-500">
                              {booking.floor.floorLevel} Floor
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(booking.checkInDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(booking.checkOutDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {calculateDuration(booking.checkInDate, booking.checkOutDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            KES {booking.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Paid: KES {totalPaid.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentBadgeClass(booking.paymentStatus || 'PENDING')}`}>
                            {booking.paymentStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {booking.status === 'PENDING' && (
                              <button
                                onClick={() => handleConfirmBooking(booking.id)}
                                disabled={processingId === booking.id}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded disabled:opacity-50 transition-colors"
                                title="Confirm Booking"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            {(booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN') && (
                              <button
                                onClick={() => handleCheckOut(booking.id)}
                                disabled={processingId === booking.id}
                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded disabled:opacity-50 transition-colors"
                                title="Check Out"
                              >
                                <X size={18} />
                              </button>
                            )}
                            <Link
                              href={`/hostel/bookings/${booking.id}`}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center text-sm text-gray-600">
              <div>
                Showing {bookings.length} of {pagination.total} bookings
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
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            « Previous
          </button>

          {paginationButtons()}

          <button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
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
// src/app/(dashboard)/finance/payments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Filter, Download, Eye, Search, DollarSign } from 'lucide-react';
import { getFeePayments, getPaymentStatistics } from '@/actions/fee-payment';
import { formatKES, formatPaymentDate, getPaymentMethodIcon } from '@/app/lib/finance-utils';
import { PAYMENT_METHODS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/app/lib/finance-constants';

interface Payment {
  id: string;
  studentId: string;
  academicYear: string;
  session: string;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
  paymentDate: Date;
  status: string;
  student: {
    admissionNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    class: {
      code: string;
      name: string;
    };
    programme: {
      code: string;
      name: string;
    };
  };
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
}

interface Filters {
  search: string;
  paymentMethod: string;
  status: string;
  academicYear: string;
  session: string;
  startDate: string;
  endDate: string;
}

interface Statistics {
  totalPayments: number;
  totalAmount: number;
  paymentsByMethod: Array<{
    paymentMethod: string;
    _count: number;
    _sum: { amountPaid: number | null };
  }>;
}

type PaymentStatusKey = keyof typeof PAYMENT_STATUS_CONFIG;
type PaymentMethodKey = keyof typeof PAYMENT_METHODS_CONFIG;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [filters, setFilters] = useState<Filters>({
    search: '',
    paymentMethod: '',
    status: '',
    academicYear: '',
    session: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPayments();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, filters]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const result = await getFeePayments({
        page: currentPage,
        limit: itemsPerPage,
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod as PaymentMethodKey }),
        ...(filters.status && { status: filters.status as PaymentStatusKey }),
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.session && { session: filters.session }),
        ...(filters.startDate && { startDate: new Date(filters.startDate) }),
        ...(filters.endDate && { endDate: new Date(filters.endDate) }),
      });

      if (result.success && Array.isArray(result.data)) {
        let filteredData = result.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = result.data.filter(
            (payment: Payment) =>
              payment.student.admissionNumber.toLowerCase().includes(searchLower) ||
              `${payment.student.firstName} ${payment.student.lastName}`.toLowerCase().includes(searchLower) ||
              payment.transactionRef.toLowerCase().includes(searchLower)
          );
        }
        setPayments(filteredData);
        setPagination(result.pagination || { total: 0, totalPages: 0, currentPage: 1 });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await getPaymentStatistics({
        ...(filters.academicYear && { academicYear: filters.academicYear }),
        ...(filters.session && { session: filters.session }),
        ...(filters.startDate && { startDate: new Date(filters.startDate) }),
        ...(filters.endDate && { endDate: new Date(filters.endDate) }),
      });

      if (result.success && result.data) {
        setStatistics(result.data as Statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Payments</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Finance &gt; Payments
          </nav>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalPayments}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatKES(statistics.totalAmount)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">M-PESA Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.paymentsByMethod.find(m => m.paymentMethod === 'MPESA')?._count || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">📱</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatKES(statistics.totalPayments > 0 ? statistics.totalAmount / statistics.totalPayments : 0)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/finance/payments/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Record Payment
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, admission number, or transaction ref..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Items per page */}
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
            <span className="text-sm text-gray-500">| Total {pagination.total} payments</span>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => {
                  setFilters({ ...filters, paymentMethod: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Methods</option>
                {Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
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
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No payments found</p>
            <p className="text-sm">Try adjusting your filters or record a new payment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Programme
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Transaction Ref
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => {
                  const statusKey = payment.status as PaymentStatusKey;
                  const statusConfig = PAYMENT_STATUS_CONFIG[statusKey] || PAYMENT_STATUS_CONFIG.PENDING;
                  const methodKey = payment.paymentMethod as PaymentMethodKey;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatPaymentDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.student.firstName} {payment.student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{payment.student.admissionNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {payment.student.programme.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatKES(payment.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          {PAYMENT_METHODS_CONFIG[methodKey]?.name || payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {payment.transactionRef}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/finance/payments/${payment.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
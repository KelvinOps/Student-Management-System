// src/app/(dashboard)/finance/invoices/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, Download, Eye, Search, Filter, Calendar } from 'lucide-react';
import { generateBulkInvoices, type Invoice } from '@/actions/invoice';

// Define session type to match your Prisma enum
type SessionType = 'SEPT_DEC' | 'JAN_APRIL' | 'MAY_AUGUST';
type TermType = 'TERM1' | 'TERM2' | 'TERM3';

interface Filters {
  search: string;
  academicYear: string;
  session: SessionType;
  term: TermType;
  classId: string;
  programmeId: string;
  departmentId: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    session: 'SEPT_DEC',
    term: 'TERM1',
    classId: '',
    programmeId: '',
    departmentId: '',
  });

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const result = await generateBulkInvoices({
        academicYear: filters.academicYear,
        session: filters.session,
        term: filters.term,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.programmeId && { programmeId: filters.programmeId }),
        ...(filters.departmentId && { departmentId: filters.departmentId }),
      });

      if (result.success && result.data) {
        setInvoices(result.data.invoices);
        alert(`Successfully generated ${result.data.successful} invoices!`);
        setShowGenerateModal(false);
      } else {
        alert('Failed to generate invoices: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating invoices:', error);
      alert('An error occurred while generating invoices');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.student.admissionNumber.toLowerCase().includes(searchLower) ||
        invoice.student.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Invoices</h1>
          <nav className="text-sm text-gray-600 mt-1">
            Dashboard &gt; Finance &gt; Invoices
          </nav>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.subtotal, 0))}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.totalPaid, 0))}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.balance, 0))}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={18} />
            Generate Invoices
          </button>
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
                placeholder="Search by invoice number, student name, or admission number..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
                Academic Year
              </label>
              <select
                value={filters.academicYear}
                onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
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
                onChange={(e) => setFilters({ ...filters, session: e.target.value as SessionType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="SEPT_DEC">Sept - Dec</option>
                <option value="JAN_APRIL">Jan - April</option>
                <option value="MAY_AUGUST">May - August</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={filters.term}
                onChange={(e) => setFilters({ ...filters, term: e.target.value as TermType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="TERM1">Term 1</option>
                <option value="TERM2">Term 2</option>
                <option value="TERM3">Term 3</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No invoices found</p>
            <p className="text-sm">Generate invoices to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Programme
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Balance
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
                {filteredInvoices.map((invoice) => {
                  const isPaid = invoice.balance <= 0;
                  const isPartiallyPaid = invoice.totalPaid > 0 && invoice.balance > 0;
                  
                  return (
                    <tr key={invoice.invoiceNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {invoice.student.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.student.admissionNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {invoice.student.programme}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(invoice.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(invoice.totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                        {formatCurrency(invoice.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            isPaid
                              ? 'bg-green-100 text-green-800'
                              : isPartiallyPaid
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isPaid ? '✅ Paid' : isPartiallyPaid ? '⏳ Partial' : '❌ Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/finance/invoices/${invoice.invoiceNumber}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Invoice"
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

      {/* Generate Invoices Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-100 p-2 rounded-full">
                <FileText className="text-teal-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Generate Invoices</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This will generate invoices for all students matching the selected criteria.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={filters.academicYear}
                  onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
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
                  onChange={(e) => setFilters({ ...filters, session: e.target.value as SessionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="SEPT_DEC">Sept - Dec</option>
                  <option value="JAN_APRIL">Jan - April</option>
                  <option value="MAY_AUGUST">May - August</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term
                </label>
                <select
                  value={filters.term}
                  onChange={(e) => setFilters({ ...filters, term: e.target.value as TermType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="TERM1">Term 1</option>
                  <option value="TERM2">Term 2</option>
                  <option value="TERM3">Term 3</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateInvoices}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
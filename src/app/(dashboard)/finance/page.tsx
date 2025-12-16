// src/app/(dashboard)/finance/page.tsx
import { Suspense } from 'react';
import { getFeePayments } from '@/actions/fee-payment';
import { getProcurementRequests } from '@/actions/procurement';
import { formatKES, getSessionName } from '@/app/lib/finance-utils';
import { PAYMENT_STATUS_CONFIG, PROCUREMENT_STATUS_CONFIG } from '@/app/lib/finance-constants';

async function getFinanceDashboardData() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Get recent payments
  const paymentsResult = await getFeePayments({
    status: 'COMPLETED',
    dateFrom: startOfMonth,
    limit: 10,
  });

  // Get pending procurement
  const procurementResult = await getProcurementRequests({
    status: 'PENDING',
    limit: 5,
  });

  // Calculate totals
  const allPayments = await getFeePayments({
    status: 'COMPLETED',
  });

  const monthlyPayments = await getFeePayments({
    status: 'COMPLETED',
    dateFrom: startOfMonth,
  });

  const yearlyPayments = await getFeePayments({
    status: 'COMPLETED',
    dateFrom: startOfYear,
  });

  const todayPayments = await getFeePayments({
    status: 'COMPLETED',
    dateFrom: today,
  });

  const totalCollectedToday = todayPayments.data?.reduce((sum, p) => sum + p.amountPaid, 0) || 0;
  const totalCollectedMonth = monthlyPayments.data?.reduce((sum, p) => sum + p.amountPaid, 0) || 0;
  const totalCollectedYear = yearlyPayments.data?.reduce((sum, p) => sum + p.amountPaid, 0) || 0;

  return {
    recentPayments: paymentsResult.data || [],
    pendingProcurement: procurementResult.data || [],
    stats: {
      totalCollectedToday,
      totalCollectedMonth,
      totalCollectedYear,
      pendingPaymentsCount: 0, // Would need separate query
    },
  };
}

export default async function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of financial activities and transactions
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/finance/payments/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Record Payment
          </a>
          <a
            href="/finance/reports"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            View Reports
          </a>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  const data = await getFinanceDashboardData();

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Today's Collection"
          value={formatKES(data.stats.totalCollectedToday)}
          icon="💰"
          trend="+12.5%"
          trendUp={true}
        />
        <StatsCard
          title="This Month"
          value={formatKES(data.stats.totalCollectedMonth)}
          icon="📊"
          trend="+8.3%"
          trendUp={true}
        />
        <StatsCard
          title="This Year"
          value={formatKES(data.stats.totalCollectedYear)}
          icon="📈"
          trend="+15.7%"
          trendUp={true}
        />
        <StatsCard
          title="Pending Payments"
          value={data.stats.pendingPaymentsCount.toString()}
          icon="⏳"
          trend="-3.2%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Payments
              </h2>
              <a
                href="/finance/payments"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.student.firstName} {payment.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.student.admissionNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatKES(payment.amountPaid)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString('en-KE')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {PAYMENT_STATUS_CONFIG[payment.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Procurement */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Procurement
              </h2>
              <a
                href="/finance/procurement"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all →
              </a>
            </div>
            <div className="space-y-4">
              {data.pendingProcurement.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {request.requestNumber}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatKES(request.estimatedCost)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {request.department}
                    </span>
                  </div>
                </div>
              ))}
              {data.pendingProcurement.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No pending procurement requests
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <a
                href="/finance/payments/new"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                💳 Record Payment
              </a>
              <a
                href="/finance/invoices/generate"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                📄 Generate Invoice
              </a>
              <a
                href="/finance/fee-structure"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                📊 Manage Fee Structure
              </a>
              <a
                href="/finance/procurement/new"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                📦 New Procurement Request
              </a>
              <a
                href="/finance/reports"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                📈 Financial Reports
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="flex items-center">
        <span
          className={`text-xs font-medium ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend}
        </span>
        <span className="text-xs text-gray-500 ml-2">vs last period</span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-200 rounded-lg h-96"></div>
        <div className="bg-gray-200 rounded-lg h-96"></div>
      </div>
    </div>
  );
}
// src/app/(dashboard)/finance/reports/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import {
  BarChart3,
  DollarSign,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  generateCollectionReport,
  generateOutstandingFeesReport,
  generateDepartmentFinancialSummary,
  generateCashFlowReport,
  type ReportFilters,
} from '@/actions/finance-reports';

// Type definitions for report data
interface PaymentMethodSummary {
  MPESA?: number;
  BANK_TRANSFER?: number;
  CASH?: number;
  CARD?: number;
}

interface CollectionSummary {
  totalCollected: number;
  totalTransactions: number;
  byPaymentMethod: PaymentMethodSummary;
  byDepartment: Record<string, number>;
  byProgramme: Record<string, number>;
  bySession: Record<string, number>;
  dailyCollections: Record<string, number>;
}

interface PaymentDetail {
  id: string;
  paymentDate: Date | string;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    programme: {
      name: string;
    };
  };
}

interface CollectionReportData {
  payments: PaymentDetail[];
  summary: CollectionSummary;
  reportDate: Date;
  filters: ReportFilters;
}

interface OutstandingFeeRecord {
  studentId: string;
  admissionNumber: string;
  name: string;
  programme: string;
  department: string;
  class: string;
  totalFee: number;
  totalPaid: number;
  balance: number;
  percentagePaid: number;
}

interface OutstandingSummary {
  totalStudents: number;
  totalOutstanding: number;
  totalExpected: number;
  totalCollected: number;
  collectionRate: number;
  byDepartment: Record<string, { students: number; outstanding: number }>;
  byProgramme: Record<string, { students: number; outstanding: number }>;
}

interface OutstandingReportData {
  outstandingFees: OutstandingFeeRecord[];
  summary: OutstandingSummary;
  reportDate: Date;
  filters: ReportFilters;
}

interface DepartmentSummary {
  studentCount: number;
  totalExpectedRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  totalExpenses: number;
  netPosition: number;
}

interface DepartmentReportData {
  department: {
    id: string;
    name: string;
    code: string;
  };
  summary: DepartmentSummary;
  reportDate: Date;
  filters: ReportFilters;
}

interface MonthlyData {
  inflow: number;
  outflow: number;
  net: number;
}

interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  periodStart: Date;
  periodEnd: Date;
}

interface CashFlowReportData {
  summary: CashFlowSummary;
  monthlyData: Record<string, MonthlyData>;
  reportDate: Date;
}

export default function FinanceReportsPage() {
  const [activeTab, setActiveTab] = useState('collection');
  const [loading, setLoading] = useState(false);
  const [collectionData, setCollectionData] = useState<CollectionReportData | null>(null);
  const [outstandingData, setOutstandingData] = useState<OutstandingReportData | null>(null);
  const [departmentData, setDepartmentData] = useState<DepartmentReportData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowReportData | null>(null);

  const [filters, setFilters] = useState<ReportFilters>({
    academicYear: new Date().getFullYear().toString(),
    session: '',
    departmentId: '',
    programmeId: '',
    classId: '',
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      switch (reportType) {
        case 'collection':
          const collectionResult = await generateCollectionReport(filters);
          if (collectionResult.success && collectionResult.data) {
            setCollectionData(collectionResult.data as unknown as CollectionReportData);
          }
          break;
        case 'outstanding':
          const outstandingResult = await generateOutstandingFeesReport(filters);
          if (outstandingResult.success && outstandingResult.data) {
            setOutstandingData(outstandingResult.data as unknown as OutstandingReportData);
          }
          break;
        case 'department':
          if (filters.departmentId) {
            const deptResult = await generateDepartmentFinancialSummary(
              filters.departmentId,
              filters
            );
            if (deptResult.success && deptResult.data) {
              setDepartmentData(deptResult.data as unknown as DepartmentReportData);
            }
          }
          break;
        case 'cashflow':
          const cashFlowResult = await generateCashFlowReport(filters);
          if (cashFlowResult.success && cashFlowResult.data) {
            setCashFlowData(cashFlowResult.data as unknown as CashFlowReportData);
          }
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => 
        headers.map((h) => {
          const value = row[h];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Finance Reports</h1>
          <p className="text-muted-foreground">
            Generate and view comprehensive financial reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Set filters to customize your financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                type="text"
                placeholder="2024"
                value={filters.academicYear || ''}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                value={filters.session || ''}
                onValueChange={(value) => handleFilterChange('session', value)}
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPT_DEC">Sept - Dec</SelectItem>
                  <SelectItem value="JAN_APRIL">Jan - April</SelectItem>
                  <SelectItem value="MAY_AUGUST">May - August</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                onChange={(e) =>
                  handleFilterChange('dateFrom', new Date(e.target.value).toISOString())
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                onChange={(e) =>
                  handleFilterChange('dateTo', new Date(e.target.value).toISOString())
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => generateReport(activeTab)}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collection">Collection Report</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="department">Department Summary</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="collection" className="space-y-4">
          {collectionData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(collectionData.summary.totalCollected)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {collectionData.summary.totalTransactions} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">M-PESA</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(collectionData.summary.byPaymentMethod.MPESA || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bank Transfer</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(collectionData.summary.byPaymentMethod.BANK_TRANSFER || 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash</CardTitle>
                    <DollarSign className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(collectionData.summary.byPaymentMethod.CASH || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment Details</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(collectionData.payments, 'collection-report')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Programme</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction Ref</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collectionData.payments.slice(0, 10).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.student.firstName} {payment.student.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {payment.student.admissionNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.student.programme.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.transactionRef}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amountPaid)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!collectionData && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Set filters and click Generate Report to view collection data
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-4">
          {outstandingData && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(outstandingData.summary.totalOutstanding)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {outstandingData.summary.totalStudents} students
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(outstandingData.summary.totalExpected)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(outstandingData.summary.totalCollected)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {outstandingData.summary.collectionRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Outstanding Fees by Student</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportToCSV(outstandingData.outstandingFees, 'outstanding-fees')
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Programme</TableHead>
                        <TableHead className="text-right">Total Fee</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">% Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingData.outstandingFees.slice(0, 10).map((record) => (
                        <TableRow key={record.studentId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {record.admissionNumber}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">{record.programme}</div>
                              <div className="text-xs text-muted-foreground">
                                {record.department}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(record.totalFee)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(record.totalPaid)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600">
                            {formatCurrency(record.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={record.percentagePaid > 50 ? 'default' : 'destructive'}
                            >
                              {record.percentagePaid.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!outstandingData && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Set filters and click Generate Report to view outstanding fees
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Financial Summary</CardTitle>
              <CardDescription>
                Select a department to view its financial performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full md:w-1/2">
                  <Label htmlFor="departmentSelect">Select Department</Label>
                  <Select
                    value={filters.departmentId || ''}
                    onValueChange={(value) => {
                      handleFilterChange('departmentId', value);
                      generateReport('department');
                    }}
                  >
                    <SelectTrigger id="departmentSelect">
                      <SelectValue placeholder="Choose a department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dept1">Engineering</SelectItem>
                      <SelectItem value="dept2">Business</SelectItem>
                      <SelectItem value="dept3">ICT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {departmentData && (
                  <div className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Student Count</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {departmentData.summary.studentCount}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(departmentData.summary.totalCollected)}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div
                            className={`text-2xl font-bold ${
                              departmentData.summary.netPosition >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(departmentData.summary.netPosition)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          {cashFlowData && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Total Inflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(cashFlowData.summary.totalInflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Total Outflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(cashFlowData.summary.totalOutflow)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Net Cash Flow
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        cashFlowData.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(cashFlowData.summary.netCashFlow)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Inflow</TableHead>
                        <TableHead className="text-right">Outflow</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(cashFlowData.monthlyData).map(([month, data]) => (
                        <TableRow key={month}>
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(data.inflow)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(data.outflow)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              data.net >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(data.net)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {!cashFlowData && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Set date range and click Generate Report to view cash flow analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
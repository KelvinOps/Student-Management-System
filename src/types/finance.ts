// src/types/finance.ts

import { PaymentMethod, PaymentStatus, ProcurementStatus } from '@prisma/client';

// ==================== FEE STRUCTURE TYPES ====================

export interface FeeStructure {
  id: string;
  programmeId: string;
  academicYear: string;
  session: string;
  tuitionFee: number;
  examFee?: number;
  libraryFee?: number;
  activityFee?: number;
  totalFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeVotehead {
  name: string;
  term1: number;
  term2: number;
  term3: number;
  total: number;
}

export interface CreateFeeStructureInput {
  programmeId: string;
  academicYear: string;
  session: string;
  voteheads: FeeVotehead[];
}

// ==================== PAYMENT TYPES ====================

export interface FeePayment {
  id: string;
  studentId: string;
  academicYear: string;
  session: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: Date;
  status: PaymentStatus;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  programme: string;
  department: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: Date;
  status: PaymentStatus;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  byProgramme: Record<string, { count: number; amount: number }>;
  byDepartment: Record<string, { count: number; amount: number }>;
}

export interface StudentBalance {
  studentId: string;
  totalFee: number;
  totalPaid: number;
  balance: number;
  percentagePaid: number;
}

// ==================== INVOICE TYPES ====================

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  student: {
    admissionNumber: string;
    name: string;
    programme: string;
    department: string;
    class: string;
    email?: string;
    phoneNumber?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  totalPaid: number;
  balance: number;
  academicYear: string;
  session: string;
  term: 'TERM1' | 'TERM2' | 'TERM3';
}

export interface InvoiceItem {
  votehead: string;
  amount: number;
}

// ==================== PROCUREMENT TYPES ====================

export interface ProcurementRequest {
  id: string;
  requestNumber: string;
  requestedBy: string;
  department: string;
  description: string;
  estimatedCost: number;
  status: ProcurementStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcurementItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface ProcurementSummary {
  total: number;
  totalValue: number;
  byStatus: Record<ProcurementStatus, number>;
  byDepartment: Record<string, { count: number; value: number }>;
}

// ==================== REPORT TYPES ====================

export interface CollectionReport {
  payments: PaymentRecord[];
  summary: PaymentSummary;
  reportDate: Date;
  filters: ReportFilters;
}

export interface OutstandingFeesReport {
  outstandingFees: OutstandingFeeRecord[];
  summary: OutstandingSummary;
  reportDate: Date;
  filters: ReportFilters;
}

export interface OutstandingFeeRecord {
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

export interface OutstandingSummary {
  totalStudents: number;
  totalOutstanding: number;
  totalExpected: number;
  totalCollected: number;
  collectionRate: number;
  byDepartment: Record<string, { students: number; outstanding: number }>;
  byProgramme: Record<string, { students: number; outstanding: number }>;
}

export interface ReportFilters {
  academicYear?: string;
  session?: string;
  departmentId?: string;
  programmeId?: string;
  classId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CashFlowReport {
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashFlow: number;
    periodStart: Date;
    periodEnd: Date;
  };
  monthlyData: Record<string, { inflow: number; outflow: number; net: number }>;
  reportDate: Date;
}

export interface DepartmentFinancialSummary {
  department: {
    id: string;
    name: string;
    code: string;
  };
  summary: {
    studentCount: number;
    totalExpectedRevenue: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    totalExpenses: number;
    netPosition: number;
  };
  reportDate: Date;
  filters: ReportFilters;
}

// ==================== FILTER TYPES ====================

export interface PaymentFilters {
  studentId?: string;
  academicYear?: string;
  session?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProcurementFilters {
  department?: string;
  status?: ProcurementStatus;
  requestedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

// ==================== DASHBOARD TYPES ====================

export interface FinanceDashboardStats {
  totalCollectedToday: number;
  totalCollectedThisMonth: number;
  totalCollectedThisYear: number;
  totalOutstanding: number;
  pendingPayments: number;
  activeStudents: number;
  collectionRate: number;
  recentPayments: PaymentRecord[];
  topPayingDepartments: { department: string; amount: number }[];
  paymentMethodBreakdown: { method: string; amount: number; percentage: number }[];
}

export interface ProcurementDashboardStats {
  totalRequests: number;
  pendingApproval: number;
  approvedRequests: number;
  totalValue: number;
  departmentBreakdown: { department: string; count: number; value: number }[];
  recentRequests: ProcurementRequest[];
}

// ==================== EXPORT TYPES ====================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  filename: string;
  headers?: string[];
  includeTimestamp?: boolean;
}

export interface CSVExportData {
  headers: string[];
  rows: (string | number | boolean | null)[][];
}
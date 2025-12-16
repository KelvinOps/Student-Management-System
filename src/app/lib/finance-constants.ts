// src/app/lib/finance-constants.ts

/**
 * M-PESA Daraja API Configuration
 * IMPORTANT: Store these values in environment variables in production
 */
export const MPESA_CONFIG = {
  // Environment: 'sandbox' for testing, 'production' for live
  ENVIRONMENT: process.env.MPESA_ENVIRONMENT || 'sandbox',
  
  // Consumer Key from Daraja Portal
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY || '',
  
  // Consumer Secret from Daraja Portal
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET || '',
  
  // Business Short Code (Till Number or Paybill)
  BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE || '174379',
  
  // Lipa Na M-PESA Online Passkey from Daraja Portal
  PASSKEY: process.env.MPESA_PASSKEY || '',
  
  // Callback URL - M-PESA will send payment results here
  CALLBACK_URL: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback',
  
  // Transaction type
  TRANSACTION_TYPE: 'CustomerPayBillOnline',
  
  // Account Reference prefix
  ACCOUNT_REFERENCE_PREFIX: 'KONGONI-',
} as const;

/**
 * Standard fee structure voteheads for TVET institutions in Kenya
 */
export const STANDARD_FEE_VOTEHEADS = {
  TUITION_FEES: 'Tuition Fees',
  PTE_ENROLMENTS: 'P/Enrolments',
  LT_AND_T: 'L T&T',
  RMI: 'R.M.I',
  EWC: 'E W&C',
  ACTIVITY: 'Activity',
  ATTACHMENT_MEDICAL: 'Attachment & Medical',
} as const;

/**
 * Additional fees that may apply to students
 */
export const ADDITIONAL_FEES = {
  STUDENT_ID: {
    name: 'Student ID',
    amount: 500.0,
    applicability: 'New students only',
  },
  KUCCPS_REGISTRATION: {
    name: 'KUCCPS Registration Fee',
    amount: 1500.0,
    applicability: 'Once',
  },
  TVETA_QA: {
    name: 'TVETA Quality Assurance Fee',
    amount: 500.0,
    applicability: 'Per term',
  },
  STUDENT_UNION: {
    name: 'Student Union Fee',
    amount: 900.0,
    applicability: 'Annually',
  },
  ADMISSION: {
    name: 'Admission Fee',
    amount: 500.0,
    applicability: 'Payable on admission',
  },
  ASSESSMENT_TOOLS: {
    name: 'Assessment Tools',
    amount: 3000.0,
    applicability: 'Per Module',
  },
  MATERIAL_FEE: {
    name: 'Material Fee',
    amount: 9600.0,
    applicability: 'Per Module',
  },
  HOSTEL: {
    name: 'Hostel Fee',
    amount: 4500.0,
    applicability: 'Optional',
  },
} as const;

/**
 * Bank account details for payments
 */
export const BANK_ACCOUNTS = {
  MAIN: {
    name: 'KONGONI TECHNICAL AND VOCATIONAL COLLEGE',
    bank: 'KCB',
    branch: "MOI'S BRIDGE BRANCH",
    accountNo: '126312963',
    paybillNo: '522522',
    purpose: 'All Tuition fees and additional charges',
  },
  EXAM_FEES: {
    name: 'KONGONI TECHNICAL AND VOCATIONAL COLLEGE',
    bank: 'KCB',
    branch: "MOI'S BRIDGE BRANCH",
    accountNo: '1286110785',
    paybillNo: '522522',
    purpose: 'Examination fees',
  },
} as const;

/**
 * Payment method display names and configurations
 */
export const PAYMENT_METHODS_CONFIG = {
  MPESA: {
    name: 'M-PESA',
    icon: '📱',
    requiresRef: true,
    refPattern: /^[A-Z0-9]{10}$/,
    refPlaceholder: 'e.g., SH12345678',
  },
  CASH: {
    name: 'Cash',
    icon: '💵',
    requiresRef: true,
    refPattern: /^.{3,}$/,
    refPlaceholder: 'e.g., CASH001',
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer',
    icon: '🏦',
    requiresRef: true,
    refPattern: /^.{5,}$/,
    refPlaceholder: 'e.g., TRF123456',
  },
  CARD: {
    name: 'Card',
    icon: '💳',
    requiresRef: true,
    refPattern: /^.{4,}$/,
    refPlaceholder: 'e.g., CARD1234',
  },
} as const;

/**
 * Payment status configurations
 */
export const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '⏳',
    canEdit: true,
    canDelete: true,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✅',
    canEdit: false,
    canDelete: false,
  },
  FAILED: {
    label: 'Failed',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '❌',
    canEdit: true,
    canDelete: true,
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '↩️',
    canEdit: false,
    canDelete: false,
  },
} as const;

/**
 * Procurement status configurations
 */
export const PROCUREMENT_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Approval',
    color: 'yellow',
    icon: '⏳',
    nextStates: ['APPROVED', 'REJECTED'],
  },
  APPROVED: {
    label: 'Approved',
    color: 'green',
    icon: '✅',
    nextStates: ['IN_PROGRESS'],
  },
  REJECTED: {
    label: 'Rejected',
    color: 'red',
    icon: '❌',
    nextStates: [],
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'blue',
    icon: '🔄',
    nextStates: ['COMPLETED'],
  },
  COMPLETED: {
    label: 'Completed',
    color: 'green',
    icon: '✔️',
    nextStates: [],
  },
} as const;

/**
 * Academic sessions
 */
export const SESSIONS = {
  SEPT_DEC: {
    label: 'September - December',
    startMonth: 9,
    endMonth: 12,
    term: 'Term 1',
  },
  JAN_APRIL: {
    label: 'January - April',
    startMonth: 1,
    endMonth: 4,
    term: 'Term 2',
  },
  MAY_AUGUST: {
    label: 'May - August',
    startMonth: 5,
    endMonth: 8,
    term: 'Term 3',
  },
} as const;

/**
 * Report types available
 */
export const REPORT_TYPES = {
  COLLECTION: {
    name: 'Fee Collection Report',
    description: 'Detailed report of all fee collections',
    icon: '💰',
  },
  OUTSTANDING: {
    name: 'Outstanding Fees Report',
    description: 'Report of students with pending fees',
    icon: '📊',
  },
  CASH_FLOW: {
    name: 'Cash Flow Report',
    description: 'Income and expenses analysis',
    icon: '💵',
  },
  DEPARTMENT_SUMMARY: {
    name: 'Department Financial Summary',
    description: 'Financial overview by department',
    icon: '🏢',
  },
  PAYMENT_METHOD: {
    name: 'Payment Method Analysis',
    description: 'Breakdown of payments by method',
    icon: '📈',
  },
  PROCUREMENT: {
    name: 'Procurement Report',
    description: 'Summary of procurement requests',
    icon: '📦',
  },
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

/**
 * Currency formatting options
 */
export const CURRENCY_FORMAT = {
  locale: 'en-KE',
  currency: 'KES',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

/**
 * Date format options
 */
export const DATE_FORMAT = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

/**
 * Excel export configurations
 */
export const EXCEL_EXPORT = {
  MAX_ROWS: 10000,
  SHEET_NAME: 'Export',
  FILE_EXTENSION: '.xlsx',
} as const;

/**
 * Email notification templates
 */
export const EMAIL_TEMPLATES = {
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  PAYMENT_REMINDER: 'payment-reminder',
  INVOICE: 'invoice',
  RECEIPT: 'receipt',
  PROCUREMENT_APPROVAL: 'procurement-approval',
  PROCUREMENT_REJECTION: 'procurement-rejection',
} as const;

/**
 * System limits and thresholds
 */
export const LIMITS = {
  MAX_PAYMENT_AMOUNT: 1000000,
  MAX_PROCUREMENT_AMOUNT: 10000000,
  MIN_PAYMENT_AMOUNT: 1,
  PAYMENT_DUE_DAYS: 30,
  LATE_PAYMENT_PENALTY_RATE: 0.01,
  MAX_UPLOAD_SIZE: 5242880,
} as const;

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATION = {
  DASHBOARD_STATS: 300,
  FEE_STRUCTURE: 3600,
  REPORTS: 600,
  STUDENT_BALANCE: 60,
} as const;

/**
 * Permission levels for finance operations
 */
export const FINANCE_PERMISSIONS = {
  VIEW_PAYMENTS: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  CREATE_PAYMENTS: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  EDIT_PAYMENTS: ['SUPER_ADMIN', 'ADMIN'],
  DELETE_PAYMENTS: ['SUPER_ADMIN'],
  VIEW_REPORTS: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  MANAGE_FEE_STRUCTURE: ['SUPER_ADMIN', 'ADMIN'],
  APPROVE_PROCUREMENT: ['SUPER_ADMIN', 'ADMIN'],
  VIEW_PROCUREMENT: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  CREATE_PROCUREMENT: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
} as const;
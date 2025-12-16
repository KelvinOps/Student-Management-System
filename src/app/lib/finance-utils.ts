// src/app/lib/finance-utils.ts

export const TVET_DEPARTMENTS = [
  'Engineering',
  'Information Technology',
  'Agriculture',
  'Business Management',
  'Hospitality & Tourism',
  'Health Sciences',
  'Fashion & Design',
  'Building & Construction',
] as const;

export type TVETDepartment = (typeof TVET_DEPARTMENTS)[number];

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  MPESA: 'M-PESA',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
} as const;

export const PROCUREMENT_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
} as const;

export interface FeeStructureVoteheads {
  tuitionFees: number;
  pteEnrolments: number;
  ltAndT: number;
  rmi: number;
  ewc: number;
  activity: number;
  attachmentMedical: number;
}

export const STANDARD_VOTEHEADS: Record<string, string> = {
  tuitionFees: 'Tuition Fees',
  pteEnrolments: 'P/Enrolments',
  ltAndT: 'L T&T',
  rmi: 'R.M.I',
  ewc: 'E W&C',
  activity: 'Activity',
  attachmentMedical: 'Attachment & Medical',
};

export const ADDITIONAL_FEES = {
  studentId: 500.0,
  kuccpsRegistration: 1500.0,
  tvetaQualityAssurance: 500.0,
  studentUnionFee: 900.0,
  admissionFee: 500.0,
  assessmentTools: 3000.0,
  materialFee: 9600.0,
  hostelFee: 4500.0,
};

export const BANK_ACCOUNTS = {
  kongoniTechnical: {
    name: 'KONGONI TECHNICAL AND VOCATIONAL COLLEGE',
    accountNo: '126312963',
    branch: "KCB MOI'S BRIDGE BRANCH",
    paybill: '522522',
  },
  examFees: {
    name: 'KONGONI TECHNICAL AND VOCATIONAL COLLEGE',
    accountNo: '1286110785',
    branch: "KCB MOI'S BRIDGE BRANCH",
    paybill: '522522',
  },
};

/**
 * Calculate total fees from voteheads for a specific term
 */
export function calculateTermFees(
  voteheads: FeeStructureVoteheads,
  term: 'TERM1' | 'TERM2' | 'TERM3'
): number {
  const termMultiplier = {
    TERM1: 1,
    TERM2: 1,
    TERM3: 1,
  };

  const multiplier = termMultiplier[term];
  return (
    (voteheads.tuitionFees +
      voteheads.pteEnrolments +
      voteheads.ltAndT +
      voteheads.rmi +
      voteheads.ewc +
      voteheads.activity +
      voteheads.attachmentMedical) *
    multiplier
  );
}

/**
 * Calculate annual fees from voteheads
 */
export function calculateAnnualFees(voteheads: FeeStructureVoteheads): number {
  return (
    voteheads.tuitionFees * 3 +
    voteheads.pteEnrolments * 3 +
    voteheads.ltAndT * 3 +
    voteheads.rmi * 3 +
    voteheads.ewc * 3 +
    voteheads.activity * 3 +
    voteheads.attachmentMedical * 3
  );
}

/**
 * Format currency for Kenyan Shillings
 */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format payment date
 */
export function formatPaymentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    MPESA: '📱',
    CASH: '💵',
    BANK_TRANSFER: '🏦',
    CARD: '💳',
  };
  return icons[method] || '💰';
}

/**
 * Calculate payment progress percentage
 */
export function calculatePaymentProgress(paid: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((paid / total) * 100, 100);
}

/**
 * Get payment status badge color
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    COMPLETED: 'badge-success',
    PENDING: 'badge-warning',
    FAILED: 'badge-danger',
    REFUNDED: 'badge-info',
  };
  return colors[status] || 'badge-secondary';
}

/**
 * Get procurement status badge color
 */
export function getProcurementStatusColor(status: string): string {
  const colors: Record<string, string> = {
    APPROVED: 'badge-success',
    PENDING: 'badge-warning',
    REJECTED: 'badge-danger',
    IN_PROGRESS: 'badge-info',
    COMPLETED: 'badge-success',
  };
  return colors[status] || 'badge-secondary';
}

/**
 * Generate receipt number
 */
export function generateReceiptNumber(prefix: string = 'RCT'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const time = String(date.getTime()).slice(-6);
  return `${prefix}/${year}${month}${day}/${time}`;
}

/**
 * Validate M-PESA transaction reference
 */
export function validateMpesaRef(ref: string): boolean {
  const mpesaPattern = /^[A-Z0-9]{10}$/;
  return mpesaPattern.test(ref);
}

/**
 * Calculate late payment penalty
 */
export function calculateLatePenalty(
  balance: number,
  dueDate: Date,
  penaltyRate: number = 0.01
): number {
  const today = new Date();
  if (today <= dueDate) return 0;

  const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return balance * penaltyRate * Math.ceil(daysLate / 30);
}

/**
 * Get session name
 */
export function getSessionName(session: string): string {
  const sessions: Record<string, string> = {
    SEPT_DEC: 'September - December',
    JAN_APRIL: 'January - April',
    MAY_AUGUST: 'May - August',
  };
  return sessions[session] || session;
}

/**
 * Get term name
 */
export function getTermName(term: string): string {
  const terms: Record<string, string> = {
    TERM1: 'Term 1',
    TERM2: 'Term 2',
    TERM3: 'Term 3',
  };
  return terms[term] || term;
}

/**
 * Calculate department budget allocation
 */
export function calculateDepartmentBudget(
  studentCount: number,
  averageFeePerStudent: number
): number {
  return studentCount * averageFeePerStudent;
}

/**
 * Generate financial year
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  return `${year}/${nextYear}`;
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

/**
 * Calculate collection efficiency
 */
export function calculateCollectionEfficiency(collected: number, expected: number): number {
  if (expected === 0) return 0;
  return (collected / expected) * 100;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        return JSON.stringify(value ?? '');
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
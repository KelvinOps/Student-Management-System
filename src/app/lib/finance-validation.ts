// src/app/lib/finance-validation.ts

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(
  amount: number,
  options?: {
    min?: number;
    max?: number;
    balance?: number;
  }
): ValidationResult {
  const errors: string[] = [];
  const min = options?.min || 1;
  const max = options?.max || 10000000;

  if (isNaN(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (amount < min) {
    errors.push(`Amount must be at least KES ${min.toLocaleString()}`);
  }

  if (amount > max) {
    errors.push(`Amount cannot exceed KES ${max.toLocaleString()}`);
  }

  if (options?.balance !== undefined && amount > options.balance) {
    errors.push(`Amount exceeds outstanding balance of KES ${options.balance.toLocaleString()}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate transaction reference based on payment method
 */
export function validateTransactionRef(
  ref: string,
  paymentMethod: string
): ValidationResult {
  const errors: string[] = [];

  if (!ref || ref.trim().length === 0) {
    errors.push('Transaction reference is required');
    return { isValid: false, errors };
  }

  const cleanRef = ref.trim();

  switch (paymentMethod) {
    case 'MPESA':
      // M-PESA transaction codes are typically 10 characters (e.g., RDG4H8KJLM)
      if (!/^[A-Z0-9]{10}$/i.test(cleanRef)) {
        errors.push('M-PESA transaction code must be exactly 10 alphanumeric characters');
      }
      break;

    case 'BANK_TRANSFER':
      // Bank references vary but should be at least 6 characters
      if (cleanRef.length < 6) {
        errors.push('Bank transaction reference must be at least 6 characters');
      }
      if (!/^[A-Z0-9\-\/]+$/i.test(cleanRef)) {
        errors.push('Bank reference can only contain letters, numbers, hyphens, and slashes');
      }
      break;

    case 'CASH':
      // Cash receipt numbers should be alphanumeric
      if (cleanRef.length < 4) {
        errors.push('Cash receipt number must be at least 4 characters');
      }
      if (!/^[A-Z0-9\-]+$/i.test(cleanRef)) {
        errors.push('Receipt number can only contain letters, numbers, and hyphens');
      }
      break;

    case 'CARD':
      // Card transaction references
      if (cleanRef.length < 6) {
        errors.push('Card transaction reference must be at least 6 characters');
      }
      if (!/^[A-Z0-9\-]+$/i.test(cleanRef)) {
        errors.push('Card reference can only contain letters, numbers, and hyphens');
      }
      break;

    default:
      if (cleanRef.length < 4) {
        errors.push('Transaction reference must be at least 4 characters');
      }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || phone.trim().length === 0) {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  // Remove all non-numeric characters for validation
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid Kenyan phone number
  // Format: 254XXXXXXXXX (where X is 7 or 1 followed by 8 digits)
  const kenyaRegex = /^(?:254|\+254|0)?([17]\d{8})$/;
  
  if (!kenyaRegex.test(cleaned)) {
    errors.push('Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate student ID/Admission number
 */
export function validateStudentId(studentId: string): ValidationResult {
  const errors: string[] = [];

  if (!studentId || studentId.trim().length === 0) {
    errors.push('Student ID is required');
    return { isValid: false, errors };
  }

  const cleanId = studentId.trim();

  if (cleanId.length < 5) {
    errors.push('Student ID must be at least 5 characters');
  }

  // Basic format validation (can be customized)
  if (!/^[A-Z0-9\/\-]+$/i.test(cleanId)) {
    errors.push('Student ID can only contain letters, numbers, slashes, and hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string
): ValidationResult {
  const errors: string[] = [];

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime())) {
    errors.push('Invalid start date');
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid end date');
  }

  if (start > end) {
    errors.push('Start date must be before end date');
  }

  const now = new Date();
  if (start > now) {
    errors.push('Start date cannot be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment date
 */
export function validatePaymentDate(date: Date | string): ValidationResult {
  const errors: string[] = [];

  const paymentDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(paymentDate.getTime())) {
    errors.push('Invalid payment date');
    return { isValid: false, errors };
  }

  const now = new Date();
  if (paymentDate > now) {
    errors.push('Payment date cannot be in the future');
  }

  // Check if date is not too old (e.g., more than 1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (paymentDate < oneYearAgo) {
    errors.push('Payment date cannot be more than 1 year old');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate fee structure data
 */
export function validateFeeStructure(data: {
  tuitionFee: number;
  examFee?: number;
  libraryFee?: number;
  activityFee?: number;
}): ValidationResult {
  const errors: string[] = [];

  if (data.tuitionFee <= 0 || isNaN(data.tuitionFee)) {
    errors.push('Tuition fee must be a positive number');
  }

  if (data.examFee !== undefined && (data.examFee < 0 || isNaN(data.examFee))) {
    errors.push('Exam fee must be zero or a positive number');
  }

  if (data.libraryFee !== undefined && (data.libraryFee < 0 || isNaN(data.libraryFee))) {
    errors.push('Library fee must be zero or a positive number');
  }

  if (data.activityFee !== undefined && (data.activityFee < 0 || isNaN(data.activityFee))) {
    errors.push('Activity fee must be zero or a positive number');
  }

  const total =
    data.tuitionFee +
    (data.examFee || 0) +
    (data.libraryFee || 0) +
    (data.activityFee || 0);

  if (total > 1000000) {
    errors.push('Total fee cannot exceed KES 1,000,000');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate academic year format
 */
export function validateAcademicYear(year: string): ValidationResult {
  const errors: string[] = [];

  if (!year || year.trim().length === 0) {
    errors.push('Academic year is required');
    return { isValid: false, errors };
  }

  // Format: YYYY/YYYY (e.g., 2024/2025)
  const yearRegex = /^20\d{2}\/20\d{2}$/;

  if (!yearRegex.test(year)) {
    errors.push('Academic year must be in format YYYY/YYYY (e.g., 2024/2025)');
  } else {
    const [start, end] = year.split('/').map(Number);
    if (end !== start + 1) {
      errors.push('Academic year end must be exactly one year after start');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
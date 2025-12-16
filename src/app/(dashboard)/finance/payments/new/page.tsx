// src/app/(dashboard)/finance/payments/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { recordFeePayment } from '@/actions/fee-payment';
import { getStudentFeeBalance } from '@/actions/fee-payment';
import { validatePaymentAmount, validateTransactionRef } from '@/app/lib/finance-validation';
import { formatKES, generateReceiptNumber } from '@/app/lib/finance-utils';
import { PAYMENT_METHODS_CONFIG } from '@/app/lib/finance-constants';

// Define types
type PaymentMethod = 'MPESA' | 'BANK_TRANSFER' | 'CASH' | 'CARD';

interface PaymentRecord {
  paymentMethod: string;
  transactionRef: string;
  paymentDate: Date | string;
  id: string;
  studentId: string;
  amountPaid: number;
}

interface StudentData {
  totalFee: number;
  totalPaid: number;
  balance: number;
  academicYear?: string;
  session?: string;
  payments?: PaymentRecord[];
}

interface FormData {
  amount: string;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: string;
}

export default function NewPaymentPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [studentId, setStudentId] = useState<string>('');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    paymentMethod: 'MPESA',
    transactionRef: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);

  // Load student balance when student ID is entered
  useEffect(() => {
    const loadStudentBalance = async () => {
      if (studentId.length >= 10) {
        try {
          const result = await getStudentFeeBalance(studentId);
          if (result.success && result.data) {
            setStudentData(result.data as StudentData);
          } else {
            setStudentData(null);
          }
        } catch (error) {
          console.error('Error loading student balance:', error);
          setStudentData(null);
        }
      }
    };
    const timeoutId = setTimeout(loadStudentBalance, 500);
    return () => clearTimeout(timeoutId);
  }, [studentId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const amountValidation = validatePaymentAmount(Number(formData.amount));
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.errors[0];
    }

    // Validate transaction reference
    const refValidation = validateTransactionRef(
      formData.transactionRef,
      formData.paymentMethod
    );
    if (!refValidation.isValid) {
      newErrors.transactionRef = refValidation.errors[0];
    }

    // Validate student
    if (!studentId) {
      newErrors.studentId = 'Student ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await recordFeePayment({
        studentId,
        academicYear: studentData?.academicYear || '2025/2026',
        session: studentData?.session || 'SEPT_DEC',
        amountPaid: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionRef: formData.transactionRef,
        paymentDate: new Date(formData.paymentDate),
        status: 'COMPLETED',
      });

      if (result.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          amount: '',
          paymentMethod: 'MPESA',
          transactionRef: '',
          paymentDate: new Date().toISOString().split('T')[0],
        });
        setStudentId('');
        setStudentData(null);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/finance/payments';
        }, 2000);
      } else {
        setErrors({ submit: result.error || 'Failed to record payment' });
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
          <p className="text-gray-600 mt-1">
            Record a new fee payment for a student
          </p>
        </div>
        <a
          href="/finance/payments"
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          ← Back
        </a>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            <div>
              <p className="font-medium">Payment recorded successfully!</p>
              <p className="text-sm">Redirecting to payments list...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <p>{errors.submit}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Student Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Student ID / Admission Number *
              </label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., KTYC/2025/001"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.studentId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.studentId && (
                <p className="text-red-600 text-sm mt-1">{errors.studentId}</p>
              )}
            </div>

            {/* Student Balance Info */}
            {studentData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Total Fee</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatKES(studentData.totalFee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Paid</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatKES(studentData.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Balance</p>
                    <p className="text-sm font-semibold text-red-600">
                      {formatKES(studentData.balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (studentData.totalPaid / studentData.totalFee) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {Math.round((studentData.totalPaid / studentData.totalFee) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (KES) *
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g., 15000"
                min="1"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.amount && (
                <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
              )}
              {studentData && Number(formData.amount) > studentData.balance && (
                <p className="text-yellow-600 text-sm mt-1">
                  ⚠️ Amount exceeds outstanding balance
                </p>
              )}
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as PaymentMethod,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="transactionRef" className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference *
              </label>
              <input
                type="text"
                id="transactionRef"
                value={formData.transactionRef}
                onChange={(e) =>
                  setFormData({ ...formData, transactionRef: e.target.value.toUpperCase() })
                }
                placeholder={PAYMENT_METHODS_CONFIG[formData.paymentMethod].refPlaceholder}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.transactionRef ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.transactionRef && (
                <p className="text-red-600 text-sm mt-1">{errors.transactionRef}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.paymentMethod === 'MPESA' && 'Enter the M-PESA transaction code (10 characters)'}
                {formData.paymentMethod === 'BANK_TRANSFER' && 'Enter the bank transaction reference'}
                {formData.paymentMethod === 'CASH' && 'Enter the cash receipt number'}
                {formData.paymentMethod === 'CARD' && 'Enter the card transaction reference'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Payment Instructions
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ensure all payment details are accurate before submitting</li>
            <li>• Transaction reference must be unique and valid</li>
            <li>• M-PESA payments: Use the transaction code from confirmation SMS</li>
            <li>• Bank transfers: Use the reference from your bank statement</li>
          </ul>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !studentData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
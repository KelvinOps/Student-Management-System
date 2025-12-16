// src/actions/fee-payment.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface FeePaymentData {
  studentId: string;
  academicYear: string;
  session: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  paymentDate: Date;
  status: PaymentStatus;
}

export async function recordFeePayment(data: FeePaymentData) {
  try {
    // Check if transaction reference already exists
    const existingPayment = await prisma.feePayment.findUnique({
      where: { transactionRef: data.transactionRef },
    });

    if (existingPayment) {
      return {
        success: false,
        error: 'Transaction reference already exists. Please use a unique reference.',
      };
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { id: true, admissionNumber: true, firstName: true, lastName: true },
    });

    if (!student) {
      return {
        success: false,
        error: 'Student not found',
      };
    }

    // Create payment record
    const payment = await prisma.feePayment.create({
      data: {
        studentId: data.studentId,
        academicYear: data.academicYear,
        session: data.session,
        amountPaid: data.amountPaid,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef,
        paymentDate: data.paymentDate,
        status: data.status,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    revalidatePath('/finance/payments');
    return {
      success: true,
      data: payment,
      message: 'Payment recorded successfully',
    };
  } catch (error) {
    console.error('Error recording payment:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'Transaction reference already exists',
        };
      }
    }

    return {
      success: false,
      error: 'Failed to record payment',
    };
  }
}

export async function getFeePayments(filters?: {
  studentId?: string;
  academicYear?: string;
  session?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      studentId,
      academicYear,
      session,
      paymentMethod,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters || {};

    const where: Prisma.FeePaymentWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (academicYear) where.academicYear = academicYear;
    if (session) where.session = session;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = startDate;
      if (endDate) where.paymentDate.lte = endDate;
    }

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: {
          student: {
            select: {
              admissionNumber: true,
              firstName: true,
              lastName: true,
              email: true,
              class: {
                select: {
                  code: true,
                  name: true,
                },
              },
              programme: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.feePayment.count({ where }),
    ]);

    return {
      success: true,
      data: payments,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return {
      success: false,
      error: 'Failed to fetch payments',
      data: [],
      pagination: { total: 0, totalPages: 0, currentPage: 1 },
    };
  }
}

export async function getFeePayment(id: string) {
  try {
    const payment = await prisma.feePayment.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phoneNumber: true,
            class: {
              select: {
                code: true,
                name: true,
              },
            },
            programme: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    return { success: true, data: payment };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return { success: false, error: 'Failed to fetch payment' };
  }
}

export async function getStudentFeeBalance(studentId: string) {
  try {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { admissionNumber: studentId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        academicYear: true,
        session: true,
        programmeId: true,
      },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get fee structure for the student
    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        programmeId: student.programmeId,
        academicYear: student.academicYear,
        session: student.session,
        isActive: true,
      },
    });

    if (!feeStructure) {
      return {
        success: false,
        error: 'No active fee structure found for this student',
      };
    }

    // Get all payments for the student
    const payments = await prisma.feePayment.findMany({
      where: {
        studentId: student.id,
        academicYear: student.academicYear,
        session: student.session,
        status: 'COMPLETED',
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const balance = feeStructure.totalFee - totalPaid;

    return {
      success: true,
      data: {
        studentId: student.id,
        totalFee: feeStructure.totalFee,
        totalPaid,
        balance,
        academicYear: student.academicYear,
        session: student.session,
        payments,
      },
    };
  } catch (error) {
    console.error('Error fetching student balance:', error);
    return { success: false, error: 'Failed to fetch student balance' };
  }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  try {
    const payment = await prisma.feePayment.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/finance/payments');
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: 'Failed to update payment status' };
  }
}

export async function deletePayment(id: string) {
  try {
    await prisma.feePayment.delete({
      where: { id },
    });

    revalidatePath('/finance/payments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false, error: 'Failed to delete payment' };
  }
}

export async function getPaymentStatistics(filters?: {
  academicYear?: string;
  session?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const where: Prisma.FeePaymentWhereInput = { status: 'COMPLETED' };

    if (filters?.academicYear) where.academicYear = filters.academicYear;
    if (filters?.session) where.session = filters.session;

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate.gte = filters.startDate;
      if (filters.endDate) where.paymentDate.lte = filters.endDate;
    }

    const [totalPayments, paymentsByMethod, totalAmount] = await Promise.all([
      prisma.feePayment.count({ where }),
      prisma.feePayment.groupBy({
        by: ['paymentMethod'],
        where,
        _count: true,
        _sum: { amountPaid: true },
      }),
      prisma.feePayment.aggregate({
        where,
        _sum: { amountPaid: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPayments,
        totalAmount: totalAmount._sum.amountPaid || 0,
        paymentsByMethod,
      },
    };
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    return { success: false, error: 'Failed to fetch payment statistics' };
  }
}

// M-PESA Integration placeholder functions
export async function initiateMpesaPayment(data: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
}) {
  // This will be implemented with actual M-PESA Daraja API
  try {
    // TODO: Implement M-PESA STK Push
    console.log('Initiating M-PESA payment:', data);

    return {
      success: true,
      data: {
        merchantRequestId: 'mock-merchant-request-id',
        checkoutRequestId: 'mock-checkout-request-id',
        responseCode: '0',
        responseDescription: 'Success. Request accepted for processing',
      },
    };
  } catch (error) {
    console.error('Error initiating M-PESA payment:', error);
    return {
      success: false,
      error: 'Failed to initiate M-PESA payment',
    };
  }
}

export async function verifyMpesaPayment(checkoutRequestId: string) {
  // This will be implemented with actual M-PESA Daraja API
  try {
    // TODO: Implement M-PESA payment status query
    console.log('Verifying M-PESA payment:', checkoutRequestId);

    return {
      success: true,
      data: {
        resultCode: '0',
        resultDesc: 'The service request is processed successfully.',
        transactionId: 'mock-transaction-id',
      },
    };
  } catch (error) {
    console.error('Error verifying M-PESA payment:', error);
    return {
      success: false,
      error: 'Failed to verify M-PESA payment',
    };
  }
}
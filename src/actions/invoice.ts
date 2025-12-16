// src/actions/invoice.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';

export interface InvoiceData {
  studentId: string;
  academicYear: string;
  session: string;
  term: 'TERM1' | 'TERM2' | 'TERM3';
}

export interface InvoiceItem {
  votehead: string;
  amount: number;
}

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
    email: string;
    phoneNumber: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  totalPaid: number;
  balance: number;
  academicYear: string;
  session: string;
  term: 'TERM1' | 'TERM2' | 'TERM3';
}

export interface InvoiceResult {
  success: boolean;
  data?: Invoice;
  error?: string;
}

export async function generateStudentInvoice(data: InvoiceData): Promise<InvoiceResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        class: true,
      },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        programmeId: student.programmeId,
        academicYear: data.academicYear,
        session: data.session,
        isActive: true,
      },
    });

    if (!feeStructure) {
      return { success: false, error: 'No active fee structure found' };
    }

    // Calculate term fees (divide total by 3)
    const termAmount = feeStructure.totalFee / 3;

    // Build invoice items based on the fee structure
    const items: InvoiceItem[] = [
      { votehead: 'Tuition Fees', amount: feeStructure.tuitionFee / 3 },
    ];

    if (feeStructure.examFee) {
      items.push({ votehead: 'Examination Fee', amount: feeStructure.examFee / 3 });
    }

    if (feeStructure.libraryFee) {
      items.push({ votehead: 'Library Fee', amount: feeStructure.libraryFee / 3 });
    }

    if (feeStructure.activityFee) {
      items.push({ votehead: 'Activity Fee', amount: feeStructure.activityFee / 3 });
    }

    // Get existing payments for this term
    const payments = await prisma.feePayment.findMany({
      where: {
        studentId: data.studentId,
        academicYear: data.academicYear,
        session: data.session,
        status: 'COMPLETED',
      },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const balance = termAmount - totalPaid;

    const invoice: Invoice = {
      invoiceNumber: `INV/${data.academicYear}/${student.admissionNumber}/${data.term}`,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      student: {
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        programme: student.programme.name,
        department: student.programme.department.name,
        class: student.class.name,
        email: student.email || '',
        phoneNumber: student.phoneNumber || '',
      },
      items,
      subtotal: termAmount,
      totalPaid,
      balance,
      academicYear: data.academicYear,
      session: data.session,
      term: data.term,
    };

    return { success: true, data: invoice };
  } catch (error) {
    console.error('Error generating invoice:', error);
    return { success: false, error: 'Failed to generate invoice' };
  }
}

export interface BulkInvoiceFilters {
  academicYear: string;
  session: string;
  term: 'TERM1' | 'TERM2' | 'TERM3';
  classId?: string;
  programmeId?: string;
  departmentId?: string;
}

export interface BulkInvoiceResult {
  success: boolean;
  data?: {
    total: number;
    successful: number;
    failed: number;
    invoices: Invoice[];
  };
  error?: string;
}

export async function generateBulkInvoices(filters: BulkInvoiceFilters): Promise<BulkInvoiceResult> {
  try {
    const where: Prisma.StudentWhereInput = {
      academicYear: filters.academicYear,
      academicStatus: 'ACTIVE',
    };

    // Add session separately to handle type properly
    (where as Record<string, unknown>).session = filters.session;

    if (filters.classId) where.classId = filters.classId;
    if (filters.programmeId) where.programmeId = filters.programmeId;
    if (filters.departmentId) where.departmentId = filters.departmentId;

    const students = await prisma.student.findMany({
      where,
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        class: true,
      },
    });

    const invoices = await Promise.all(
      students.map((student) =>
        generateStudentInvoice({
          studentId: student.id,
          academicYear: filters.academicYear,
          session: filters.session,
          term: filters.term,
        })
      )
    );

    const successfulInvoices = invoices.filter((inv): inv is InvoiceResult & { success: true; data: Invoice } => 
      inv.success && inv.data !== undefined
    );
    const failedInvoices = invoices.filter((inv) => !inv.success);

    return {
      success: true,
      data: {
        total: invoices.length,
        successful: successfulInvoices.length,
        failed: failedInvoices.length,
        invoices: successfulInvoices.map((inv) => inv.data),
      },
    };
  } catch (error) {
    console.error('Error generating bulk invoices:', error);
    return { success: false, error: 'Failed to generate bulk invoices' };
  }
}

export interface InvoiceHistoryResult {
  success: boolean;
  data?: Invoice[];
  error?: string;
}

export async function getStudentInvoiceHistory(studentId: string): Promise<InvoiceHistoryResult> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Generate invoices for all terms
    const terms: ('TERM1' | 'TERM2' | 'TERM3')[] = ['TERM1', 'TERM2', 'TERM3'];
    const invoices = await Promise.all(
      terms.map((term) =>
        generateStudentInvoice({
          studentId,
          academicYear: student.academicYear,
          session: student.session,
          term,
        })
      )
    );

    const successfulInvoices = invoices.filter((inv): inv is InvoiceResult & { success: true; data: Invoice } => 
      inv.success && inv.data !== undefined
    );

    return {
      success: true,
      data: successfulInvoices.map((inv) => inv.data),
    };
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    return { success: false, error: 'Failed to fetch invoice history' };
  }
}
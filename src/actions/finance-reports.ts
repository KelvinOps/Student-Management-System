// src/actions/finance-reports.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma, Session } from '@prisma/client';

export interface ReportFilters {
  academicYear?: string;
  session?: Session;
  departmentId?: string;
  programmeId?: string;
  classId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function generateCollectionReport(filters: ReportFilters) {
  try {
    const where: Prisma.FeePaymentWhereInput = {
      status: 'COMPLETED',
    };

    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.session) where.session = filters.session;
    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) where.paymentDate.gte = filters.dateFrom;
      if (filters.dateTo) where.paymentDate.lte = filters.dateTo;
    }

    if (filters.departmentId || filters.programmeId || filters.classId) {
      where.student = {};
      if (filters.departmentId) where.student.departmentId = filters.departmentId;
      if (filters.programmeId) where.student.programmeId = filters.programmeId;
      if (filters.classId) where.student.classId = filters.classId;
    }

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: {
          include: {
            programme: true,
            department: true,
            class: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const summary = {
      totalCollected: 0,
      totalTransactions: payments.length,
      byPaymentMethod: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
      byProgramme: {} as Record<string, number>,
      bySession: {} as Record<string, number>,
      dailyCollections: {} as Record<string, number>,
    };

    payments.forEach((payment) => {
      summary.totalCollected += payment.amountPaid;

      // By payment method
      summary.byPaymentMethod[payment.paymentMethod] =
        (summary.byPaymentMethod[payment.paymentMethod] || 0) + payment.amountPaid;

      // By department
      const deptName = payment.student.department.name;
      summary.byDepartment[deptName] = (summary.byDepartment[deptName] || 0) + payment.amountPaid;

      // By programme
      const progName = payment.student.programme.name;
      summary.byProgramme[progName] = (summary.byProgramme[progName] || 0) + payment.amountPaid;

      // By session
      summary.bySession[payment.session] =
        (summary.bySession[payment.session] || 0) + payment.amountPaid;

      // Daily collections
      const dateKey = payment.paymentDate.toISOString().split('T')[0];
      summary.dailyCollections[dateKey] =
        (summary.dailyCollections[dateKey] || 0) + payment.amountPaid;
    });

    return {
      success: true,
      data: {
        payments,
        summary,
        reportDate: new Date(),
        filters,
      },
    };
  } catch (error) {
    console.error('Error generating collection report:', error);
    return { success: false, error: 'Failed to generate collection report' };
  }
}

export async function generateOutstandingFeesReport(filters: ReportFilters) {
  try {
    const where: Prisma.StudentWhereInput = {
      academicStatus: 'ACTIVE',
    };

    if (filters.academicYear) where.academicYear = filters.academicYear;
    if (filters.session) where.session = filters.session;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.programmeId) where.programmeId = filters.programmeId;
    if (filters.classId) where.classId = filters.classId;

    const students = await prisma.student.findMany({
      where,
      include: {
        programme: true,
        department: true,
        class: true,
        feePayments: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    const outstandingFees = await Promise.all(
      students.map(async (student) => {
        const feeStructure = await prisma.feeStructure.findFirst({
          where: {
            programmeId: student.programmeId,
            academicYear: student.academicYear,
            session: student.session,
            isActive: true,
          },
        });

        if (!feeStructure) return null;

        const totalPaid = student.feePayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const balance = feeStructure.totalFee - totalPaid;

        return {
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          name: `${student.firstName} ${student.lastName}`,
          programme: student.programme.name,
          department: student.department.name,
          class: student.class.name,
          totalFee: feeStructure.totalFee,
          totalPaid,
          balance,
          percentagePaid: (totalPaid / feeStructure.totalFee) * 100,
        };
      })
    );

    const validOutstanding = outstandingFees.filter((f) => f !== null && f.balance > 0);

    const summary = {
      totalStudents: validOutstanding.length,
      totalOutstanding: validOutstanding.reduce((sum, f) => sum + f!.balance, 0),
      totalExpected: validOutstanding.reduce((sum, f) => sum + f!.totalFee, 0),
      totalCollected: validOutstanding.reduce((sum, f) => sum + f!.totalPaid, 0),
      collectionRate:
        (validOutstanding.reduce((sum, f) => sum + f!.totalPaid, 0) /
          validOutstanding.reduce((sum, f) => sum + f!.totalFee, 0)) *
        100,
      byDepartment: {} as Record<string, { students: number; outstanding: number }>,
      byProgramme: {} as Record<string, { students: number; outstanding: number }>,
    };

    validOutstanding.forEach((record) => {
      if (!record) return;

      // By department
      if (!summary.byDepartment[record.department]) {
        summary.byDepartment[record.department] = { students: 0, outstanding: 0 };
      }
      summary.byDepartment[record.department].students++;
      summary.byDepartment[record.department].outstanding += record.balance;

      // By programme
      if (!summary.byProgramme[record.programme]) {
        summary.byProgramme[record.programme] = { students: 0, outstanding: 0 };
      }
      summary.byProgramme[record.programme].students++;
      summary.byProgramme[record.programme].outstanding += record.balance;
    });

    return {
      success: true,
      data: {
        outstandingFees: validOutstanding,
        summary,
        reportDate: new Date(),
        filters,
      },
    };
  } catch (error) {
    console.error('Error generating outstanding fees report:', error);
    return { success: false, error: 'Failed to generate outstanding fees report' };
  }
}

export async function generateDepartmentFinancialSummary(
  departmentId: string,
  filters: ReportFilters
) {
  try {
    const studentWhere: Prisma.StudentWhereInput = {
      departmentId,
      academicStatus: 'ACTIVE',
    };

    if (filters.academicYear) studentWhere.academicYear = filters.academicYear;
    if (filters.session) studentWhere.session = filters.session;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        programmes: {
          include: {
            students: {
              where: studentWhere,
            },
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: 'Department not found' };
    }

    let totalExpectedRevenue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    const studentCount = department.programmes.reduce((sum, p) => sum + p.students.length, 0);

    for (const programme of department.programmes) {
      for (const student of programme.students) {
        const feeStructure = await prisma.feeStructure.findFirst({
          where: {
            programmeId: programme.id,
            academicYear: student.academicYear,
            session: student.session,
            isActive: true,
          },
        });

        if (feeStructure) {
          totalExpectedRevenue += feeStructure.totalFee;

          const payments = await prisma.feePayment.findMany({
            where: {
              studentId: student.id,
              status: 'COMPLETED',
            },
          });

          const paid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
          totalCollected += paid;
          totalOutstanding += feeStructure.totalFee - paid;
        }
      }
    }

    // Get procurement expenses
    const procurementWhere: Prisma.ProcurementRequestWhereInput = {
      department: department.name,
      status: 'COMPLETED',
    };

    if (filters.dateFrom || filters.dateTo) {
      procurementWhere.createdAt = {};
      if (filters.dateFrom) procurementWhere.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) procurementWhere.createdAt.lte = filters.dateTo;
    }

    const procurementExpenses = await prisma.procurementRequest.findMany({
      where: procurementWhere,
    });

    const totalExpenses = procurementExpenses.reduce((sum, p) => sum + p.estimatedCost, 0);

    return {
      success: true,
      data: {
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
        },
        summary: {
          studentCount,
          totalExpectedRevenue,
          totalCollected,
          totalOutstanding,
          collectionRate: (totalCollected / totalExpectedRevenue) * 100,
          totalExpenses,
          netPosition: totalCollected - totalExpenses,
        },
        reportDate: new Date(),
        filters,
      },
    };
  } catch (error) {
    console.error('Error generating department financial summary:', error);
    return { success: false, error: 'Failed to generate department financial summary' };
  }
}

export async function generateCashFlowReport(filters: ReportFilters) {
  try {
    const dateFrom = filters.dateFrom || new Date(new Date().getFullYear(), 0, 1);
    const dateTo = filters.dateTo || new Date();

    // Get all payments
    const payments = await prisma.feePayment.findMany({
      where: {
        status: 'COMPLETED',
        paymentDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    // Get all procurement expenses
    const expenses = await prisma.procurementRequest.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    const totalInflow = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalOutflow = expenses.reduce((sum, e) => sum + e.estimatedCost, 0);
    const netCashFlow = totalInflow - totalOutflow;

    // Monthly breakdown
    const monthlyData: Record<
      string,
      { inflow: number; outflow: number; net: number }
    > = {};

    payments.forEach((payment) => {
      const monthKey = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflow: 0, outflow: 0, net: 0 };
      }
      monthlyData[monthKey].inflow += payment.amountPaid;
    });

    expenses.forEach((expense) => {
      const monthKey = expense.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflow: 0, outflow: 0, net: 0 };
      }
      monthlyData[monthKey].outflow += expense.estimatedCost;
    });

    Object.keys(monthlyData).forEach((key) => {
      monthlyData[key].net = monthlyData[key].inflow - monthlyData[key].outflow;
    });

    return {
      success: true,
      data: {
        summary: {
          totalInflow,
          totalOutflow,
          netCashFlow,
          periodStart: dateFrom,
          periodEnd: dateTo,
        },
        monthlyData,
        reportDate: new Date(),
      },
    };
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    return { success: false, error: 'Failed to generate cash flow report' };
  }
}
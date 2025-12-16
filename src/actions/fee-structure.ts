// src/actions/fee-structure.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface FeeStructureData {
  programmeId: string;
  academicYear: string;
  session: string;
  tuitionFee: number;
  examFee?: number;
  libraryFee?: number;
  activityFee?: number;
  totalFee: number;
  isActive: boolean;
}

export interface FeeVotehead {
  name: string;
  term1: number;
  term2: number;
  term3: number;
  total: number;
}

export async function createFeeStructure(data: FeeStructureData) {
  try {
    const feeStructure = await prisma.feeStructure.create({
      data,
    });

    revalidatePath('/finance/fee-structure');
    return { success: true as const, data: feeStructure };
  } catch (error) {
    console.error('Error creating fee structure:', error);
    return { success: false as const, error: 'Failed to create fee structure' };
  }
}

export async function updateFeeStructure(id: string, data: Partial<FeeStructureData>) {
  try {
    const feeStructure = await prisma.feeStructure.update({
      where: { id },
      data,
    });

    revalidatePath('/finance/fee-structure');
    return { success: true as const, data: feeStructure };
  } catch (error) {
    console.error('Error updating fee structure:', error);
    return { success: false as const, error: 'Failed to update fee structure' };
  }
}

export async function getFeeStructures(filters?: {
  programmeId?: string;
  academicYear?: string;
  session?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const { programmeId, academicYear, session, isActive, page = 1, limit = 50 } = filters || {};

    const where: Prisma.FeeStructureWhereInput = {};

    if (programmeId) where.programmeId = programmeId;
    if (academicYear) where.academicYear = academicYear;
    if (session) where.session = session;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    const [feeStructures, total] = await Promise.all([
      prisma.feeStructure.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { academicYear: 'desc' },
          { session: 'asc' },
        ],
      }),
      prisma.feeStructure.count({ where }),
    ]);

    return {
      success: true as const,
      data: feeStructures,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    return { success: false as const, error: 'Failed to fetch fee structures', data: [] };
  }
}

export async function getFeeStructure(id: string) {
  try {
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id },
    });

    if (!feeStructure) {
      return { success: false as const, error: 'Fee structure not found' };
    }

    return { success: true as const, data: feeStructure };
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return { success: false as const, error: 'Failed to fetch fee structure' };
  }
}

export async function getStudentFeeStructure(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        programme: true,
        class: true,
      },
    });

    if (!student) {
      return { success: false as const, error: 'Student not found' };
    }

    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        programmeId: student.programmeId,
        academicYear: student.academicYear,
        session: student.session,
        isActive: true,
      },
    });

    if (!feeStructure) {
      return { success: false as const, error: 'No active fee structure found for student' };
    }

    return { success: true as const, data: { student, feeStructure } };
  } catch (error) {
    console.error('Error fetching student fee structure:', error);
    return { success: false as const, error: 'Failed to fetch student fee structure' };
  }
}

export async function deleteFeeStructure(id: string) {
  try {
    await prisma.feeStructure.delete({
      where: { id },
    });

    revalidatePath('/finance/fee-structure');
    return { success: true as const };
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    return { success: false as const, error: 'Failed to delete fee structure' };
  }
}

export async function calculateTotalFees(voteheads: FeeVotehead[]) {
  const totals = {
    term1: 0,
    term2: 0,
    term3: 0,
    grandTotal: 0,
  };

  voteheads.forEach((votehead) => {
    totals.term1 += votehead.term1;
    totals.term2 += votehead.term2;
    totals.term3 += votehead.term3;
    totals.grandTotal += votehead.total;
  });

  return totals;
}
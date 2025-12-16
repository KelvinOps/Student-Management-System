// src/actions/marks.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface MarksEntryData {
  studentId: string;
  subjectId: string;
  classCode: string;
  cohort: string;
  session: string;
  scheduleType: string;
  examType: string;
  cat?: number;
  midTerm?: number;
  practical?: number;
  endOfTerm?: number;
  industrialAttachment?: number;
  total?: number;
  enteredBy: string;
}

export async function createMarksEntry(data: MarksEntryData) {
  try {
    const marksEntry = await prisma.marksEntry.create({
      data: {
        ...data,
        enteredAt: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    revalidatePath('/academics/marks/entry');
    return { success: true, data: marksEntry };
  } catch (error) {
    console.error('Error creating marks entry:', error);
    return { success: false, error: 'Failed to create marks entry' };
  }
}

export async function updateMarksEntry(id: string, data: Partial<MarksEntryData>) {
  try {
    const marksEntry = await prisma.marksEntry.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    revalidatePath('/academics/marks/entry');
    return { success: true, data: marksEntry };
  } catch (error) {
    console.error('Error updating marks entry:', error);
    return { success: false, error: 'Failed to update marks entry' };
  }
}

export async function getMarksEntries(filters: {
  classCode?: string;
  session?: string;
  subjectId?: string;
  studentId?: string;
  scheduleType?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      classCode,
      session,
      subjectId,
      studentId,
      scheduleType,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.MarksEntryWhereInput = {};

    if (classCode) where.classCode = classCode;
    if (session) where.session = session;
    if (subjectId) where.subjectId = subjectId;
    if (studentId) where.studentId = studentId;
    if (scheduleType) where.scheduleType = scheduleType;

    const [marks, total] = await Promise.all([
      prisma.marksEntry.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { student: { admissionNumber: 'asc' } },
          { subject: { code: 'asc' } },
        ],
      }),
      prisma.marksEntry.count({ where }),
    ]);

    return {
      success: true,
      data: marks,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching marks entries:', error);
    return { success: false, error: 'Failed to fetch marks entries', data: [] };
  }
}

export async function getStudentMarks(studentId: string) {
  try {
    const marks = await prisma.marksEntry.findMany({
      where: { studentId },
      include: {
        subject: {
          select: {
            code: true,
            name: true,
            credits: true,
          },
        },
      },
      orderBy: [
        { session: 'desc' },
        { subject: { code: 'asc' } },
      ],
    });

    return { success: true, data: marks };
  } catch (error) {
    console.error('Error fetching student marks:', error);
    return { success: false, error: 'Failed to fetch student marks', data: [] };
  }
}

export async function bulkCreateMarksEntry(entries: MarksEntryData[]) {
  try {
    const created = await prisma.marksEntry.createMany({
      data: entries.map(entry => ({
        ...entry,
        enteredAt: new Date(),
      })),
      skipDuplicates: true,
    });

    revalidatePath('/academics/marks/entry');
    return { success: true, data: created };
  } catch (error) {
    console.error('Error bulk creating marks:', error);
    return { success: false, error: 'Failed to create marks entries' };
  }
}

export async function calculateModuleAverage(
  studentId: string,
  subjectId: string,
  session: string
) {
  try {
    const marks = await prisma.marksEntry.findMany({
      where: {
        studentId,
        subjectId,
        session,
      },
    });

    if (marks.length === 0) {
      return { success: false, error: 'No marks found' };
    }

    // Calculate averages for written and practical assessments
    const writtenMarks = marks
      .filter(m => m.cat !== null)
      .map(m => m.cat as number);
    
    const practicalMarks = marks
      .filter(m => m.practical !== null)
      .map(m => m.practical as number);

    const writtenAvg = writtenMarks.length > 0
      ? writtenMarks.reduce((a, b) => a + b, 0) / writtenMarks.length
      : 0;

    const practicalAvg = practicalMarks.length > 0
      ? practicalMarks.reduce((a, b) => a + b, 0) / practicalMarks.length
      : 0;

    // Overall average (50% written, 50% practical)
    const overallAvg = (writtenAvg + practicalAvg) / 2;

    return {
      success: true,
      data: {
        writtenAverage: Math.round(writtenAvg * 100) / 100,
        practicalAverage: Math.round(practicalAvg * 100) / 100,
        overallAverage: Math.round(overallAvg * 100) / 100,
        writtenCount: writtenMarks.length,
        practicalCount: practicalMarks.length,
      },
    };
  } catch (error) {
    console.error('Error calculating module average:', error);
    return { success: false, error: 'Failed to calculate average' };
  }
}

export async function deleteMarksEntry(id: string) {
  try {
    await prisma.marksEntry.delete({
      where: { id },
    });

    revalidatePath('/academics/marks/entry');
    return { success: true };
  } catch (error) {
    console.error('Error deleting marks entry:', error);
    return { success: false, error: 'Failed to delete marks entry' };
  }
}
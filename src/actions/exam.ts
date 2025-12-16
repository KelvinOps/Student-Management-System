// src/actions/exam.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface ExamScheduleData {
  scheduleType: string;
  session: string;
  examType: string;
  numberOfClasses: number;
  examStartDate: Date;
  examEndDate: Date;
  subjectIds?: string[];
}

export interface ExamResultData {
  studentId: string;
  examScheduleId: string;
  session: string;
  classCode: string;
  scheduleType: string;
  examType: string;
  overallPerformance?: string;
  competence?: string;
}

export async function createExamSchedule(data: ExamScheduleData) {
  try {
    const { subjectIds, ...scheduleData } = data;

    const examSchedule = await prisma.examSchedule.create({
      data: scheduleData,
    });

    revalidatePath('/academics/exams/scheduling');
    return { success: true, data: examSchedule };
  } catch (error) {
    console.error('Error creating exam schedule:', error);
    return { success: false, error: 'Failed to create exam schedule' };
  }
}

export async function updateExamSchedule(
  id: string,
  data: Partial<ExamScheduleData>
) {
  try {
    const { subjectIds, ...scheduleData } = data;

    const examSchedule = await prisma.examSchedule.update({
      where: { id },
      data: scheduleData,
    });

    revalidatePath('/academics/exams/scheduling');
    return { success: true, data: examSchedule };
  } catch (error) {
    console.error('Error updating exam schedule:', error);
    return { success: false, error: 'Failed to update exam schedule' };
  }
}

export async function getExamSchedules(filters?: {
  session?: string;
  scheduleType?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { session, scheduleType, page = 1, limit = 20 } = filters || {};

    const where: Prisma.ExamScheduleWhereInput = {};

    if (session) where.session = session;
    if (scheduleType) where.scheduleType = scheduleType;

    const [schedules, total] = await Promise.all([
      prisma.examSchedule.findMany({
        where,
        include: {
          subjects: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              examResults: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { examStartDate: 'desc' },
      }),
      prisma.examSchedule.count({ where }),
    ]);

    return {
      success: true,
      data: schedules,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching exam schedules:', error);
    return { success: false, error: 'Failed to fetch exam schedules', data: [] };
  }
}

export async function getExamSchedule(id: string) {
  try {
    const schedule = await prisma.examSchedule.findUnique({
      where: { id },
      include: {
        subjects: true,
        examResults: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return { success: false, error: 'Exam schedule not found' };
    }

    return { success: true, data: schedule };
  } catch (error) {
    console.error('Error fetching exam schedule:', error);
    return { success: false, error: 'Failed to fetch exam schedule' };
  }
}

export async function deleteExamSchedule(id: string) {
  try {
    await prisma.examSchedule.delete({
      where: { id },
    });

    revalidatePath('/academics/exams/scheduling');
    return { success: true };
  } catch (error) {
    console.error('Error deleting exam schedule:', error);
    return { success: false, error: 'Failed to delete exam schedule' };
  }
}

// Exam Results Actions

export async function createExamResult(data: ExamResultData) {
  try {
    const result = await prisma.examResult.create({
      data,
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        examSchedule: {
          select: {
            scheduleType: true,
            session: true,
            examType: true,
          },
        },
      },
    });

    revalidatePath('/academics/exams/results');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating exam result:', error);
    return { success: false, error: 'Failed to create exam result' };
  }
}

export async function bulkCreateExamResults(results: ExamResultData[]) {
  try {
    const created = await prisma.examResult.createMany({
      data: results,
      skipDuplicates: true,
    });

    revalidatePath('/academics/exams/results');
    return { success: true, data: created };
  } catch (error) {
    console.error('Error bulk creating exam results:', error);
    return { success: false, error: 'Failed to create exam results' };
  }
}

export async function getExamResults(filters?: {
  studentId?: string;
  examScheduleId?: string;
  session?: string;
  classCode?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      studentId,
      examScheduleId,
      session,
      classCode,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: Prisma.ExamResultWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (examScheduleId) where.examScheduleId = examScheduleId;
    if (session) where.session = session;
    if (classCode) where.classCode = classCode;

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
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
          examSchedule: {
            select: {
              id: true,
              scheduleType: true,
              session: true,
              examType: true,
              examStartDate: true,
              examEndDate: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ student: { admissionNumber: 'asc' } }],
      }),
      prisma.examResult.count({ where }),
    ]);

    return {
      success: true,
      data: results,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return { success: false, error: 'Failed to fetch exam results', data: [] };
  }
}

export async function getStudentExamResults(studentId: string) {
  try {
    const results = await prisma.examResult.findMany({
      where: { studentId },
      include: {
        examSchedule: {
          select: {
            scheduleType: true,
            session: true,
            examType: true,
            examStartDate: true,
            examEndDate: true,
          },
        },
      },
      orderBy: { session: 'desc' },
    });

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching student exam results:', error);
    return {
      success: false,
      error: 'Failed to fetch student exam results',
      data: [],
    };
  }
}

export async function generateStudentTranscript(studentId: string) {
  try {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        programme: true,
        department: true,
      },
    });

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Get all marks
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
      orderBy: [{ session: 'asc' }, { subject: { code: 'asc' } }],
    });

    // Get exam results
    const examResults = await prisma.examResult.findMany({
      where: { studentId },
      include: {
        examSchedule: true,
      },
      orderBy: { session: 'asc' },
    });

    // Group marks by session
    const marksBySession = marks.reduce((acc, mark) => {
      if (!acc[mark.session]) {
        acc[mark.session] = [];
      }
      acc[mark.session].push(mark);
      return acc;
    }, {} as Record<string, typeof marks>);

    return {
      success: true,
      data: {
        student,
        marksBySession,
        examResults,
      },
    };
  } catch (error) {
    console.error('Error generating transcript:', error);
    return { success: false, error: 'Failed to generate transcript' };
  }
}

export async function calculateGrade(percentage: number): Promise<string> {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'E';
}

export async function calculateCompetence(percentage: number): Promise<string> {
  if (percentage >= 80) return 'C'; // Competent
  if (percentage >= 60) return 'P'; // Progressing
  return 'I'; // Insufficient
}
// src/actions/subject.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface SubjectData {
  code: string;
  name: string;
  curriculumId?: string;
  credits: number;
  isCore: boolean;
}

export interface SubjectRegistrationData {
  studentId: string;
  subjectId: string;
  cohort: string;
  classCode: string;
  startDate: Date;
  endDate: Date;
  numberOfSubjects: number;
}

export async function createSubject(data: SubjectData) {
  try {
    const subject = await prisma.subject.create({
      data,
    });

    revalidatePath('/academics/subjects');
    return { success: true, data: subject };
  } catch (error) {
    console.error('Error creating subject:', error);
    return { success: false, error: 'Failed to create subject' };
  }
}

export async function updateSubject(id: string, data: Partial<SubjectData>) {
  try {
    const subject = await prisma.subject.update({
      where: { id },
      data,
    });

    revalidatePath('/academics/subjects');
    return { success: true, data: subject };
  } catch (error) {
    console.error('Error updating subject:', error);
    return { success: false, error: 'Failed to update subject' };
  }
}

export async function getSubjects(filters?: {
  curriculumId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { curriculumId, search, page = 1, limit = 50 } = filters || {};

    const where: Prisma.SubjectWhereInput = {};

    if (curriculumId) {
      where.curriculumId = curriculumId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          curriculum: {
            select: {
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      prisma.subject.count({ where }),
    ]);

    return {
      success: true,
      data: subjects,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { success: false, error: 'Failed to fetch subjects', data: [] };
  }
}

export async function getSubject(id: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        curriculum: true,
        registrations: {
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

    if (!subject) {
      return { success: false, error: 'Subject not found' };
    }

    return { success: true, data: subject };
  } catch (error) {
    console.error('Error fetching subject:', error);
    return { success: false, error: 'Failed to fetch subject' };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({
      where: { id },
    });

    revalidatePath('/academics/subjects');
    return { success: true };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { success: false, error: 'Failed to delete subject' };
  }
}

// Subject Registration Actions

export async function registerStudentSubject(data: SubjectRegistrationData) {
  try {
    const registration = await prisma.subjectRegistration.create({
      data,
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        subject: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    revalidatePath('/academics/subjects/registration');
    return { success: true, data: registration };
  } catch (error) {
    console.error('Error registering student subject:', error);
    return { success: false, error: 'Failed to register student for subject' };
  }
}

export async function bulkRegisterStudentSubjects(
  registrations: SubjectRegistrationData[]
) {
  try {
    const created = await prisma.subjectRegistration.createMany({
      data: registrations,
      skipDuplicates: true,
    });

    revalidatePath('/academics/subjects/registration');
    return { success: true, data: created };
  } catch (error) {
    console.error('Error bulk registering subjects:', error);
    return { success: false, error: 'Failed to register subjects' };
  }
}

export async function getSubjectRegistrations(filters?: {
  studentId?: string;
  subjectId?: string;
  classCode?: string;
  cohort?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      studentId,
      subjectId,
      classCode,
      cohort,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: Prisma.SubjectRegistrationWhereInput = {};

    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (classCode) where.classCode = classCode;
    if (cohort) where.cohort = cohort;

    const [registrations, total] = await Promise.all([
      prisma.subjectRegistration.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              middleName: true,
              class: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
          subject: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
              isCore: true,
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
      prisma.subjectRegistration.count({ where }),
    ]);

    return {
      success: true,
      data: registrations,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching subject registrations:', error);
    return {
      success: false,
      error: 'Failed to fetch subject registrations',
      data: [],
    };
  }
}

export async function deleteSubjectRegistration(id: string) {
  try {
    await prisma.subjectRegistration.delete({
      where: { id },
    });

    revalidatePath('/academics/subjects/registration');
    return { success: true };
  } catch (error) {
    console.error('Error deleting subject registration:', error);
    return { success: false, error: 'Failed to delete registration' };
  }
}

export async function getStudentSubjects(studentId: string) {
  try {
    const registrations = await prisma.subjectRegistration.findMany({
      where: { studentId },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            isCore: true,
          },
        },
      },
      orderBy: {
        subject: { code: 'asc' },
      },
    });

    return { success: true, data: registrations };
  } catch (error) {
    console.error('Error fetching student subjects:', error);
    return { success: false, error: 'Failed to fetch student subjects', data: [] };
  }
}

export async function getSubjectStudents(subjectId: string) {
  try {
    const registrations = await prisma.subjectRegistration.findMany({
      where: { subjectId },
      include: {
        student: {
          select: {
            id: true,
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
          },
        },
      },
      orderBy: {
        student: { admissionNumber: 'asc' },
      },
    });

    return { success: true, data: registrations };
  } catch (error) {
    console.error('Error fetching subject students:', error);
    return { success: false, error: 'Failed to fetch subject students', data: [] };
  }
}
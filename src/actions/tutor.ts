// src/actions/tutor.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/app/lib/prisma';
import type { Tutor, TutorSubjectAssignment, Subject } from '@prisma/client';

// Types
type TutorWithAssignments = Tutor & {
  subjectAssignments: (TutorSubjectAssignment & {
    subject: Subject;
  })[];
  _count?: {
    timetableEntries: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateTutorInput = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  specialization?: string | null;
  isActive?: boolean;
};

export type UpdateTutorInput = Partial<CreateTutorInput> & {
  id: string;
};

export type AssignSubjectInput = {
  tutorId: string;
  subjectId: string;
  classId?: string | null;
};

export async function createTutor(data: CreateTutorInput): Promise<ApiResponse<Tutor>> {
  try {
    // Check if employee code already exists
    const existingCode = await prisma.tutor.findUnique({
      where: { employeeCode: data.employeeCode },
    });

    if (existingCode) {
      return {
        success: false,
        error: 'A tutor with this employee code already exists',
      };
    }

    // Check if email already exists
    const existingEmail = await prisma.tutor.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return {
        success: false,
        error: 'A tutor with this email already exists',
      };
    }

    const tutor = await prisma.tutor.create({
      data: {
        ...data,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath('/academics/tutors');
    
    return {
      success: true,
      data: tutor,
      message: 'Tutor created successfully',
    };
  } catch (error: unknown) {
    console.error('Error creating tutor:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A tutor with this information already exists',
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to create tutor. Please try again.',
    };
  }
}

export async function updateTutor(data: UpdateTutorInput): Promise<ApiResponse<Tutor>> {
  try {
    const { id, ...updateData } = data;

    // Check if tutor exists
    const existingTutor = await prisma.tutor.findUnique({
      where: { id },
    });

    if (!existingTutor) {
      return {
        success: false,
        error: 'Tutor not found',
      };
    }

    const tutor = await prisma.tutor.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/academics/tutors');
    revalidatePath(`/academics/tutors/${id}`);
    
    return {
      success: true,
      data: tutor,
      message: 'Tutor updated successfully',
    };
  } catch (error: unknown) {
    console.error('Error updating tutor:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A tutor with this information already exists',
        };
      }
    }
    
    return {
      success: false,
      error: 'Failed to update tutor. Please try again.',
    };
  }
}

export async function deleteTutor(id: string): Promise<ApiResponse<null>> {
  try {
    // Check if tutor has assignments
    const assignments = await prisma.tutorSubjectAssignment.count({
      where: { tutorId: id },
    });

    if (assignments > 0) {
      return {
        success: false,
        error: 'Cannot delete tutor with active subject assignments. Remove assignments first.',
      };
    }

    await prisma.tutor.delete({
      where: { id },
    });

    revalidatePath('/academics/tutors');
    
    return {
      success: true,
      message: 'Tutor deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting tutor:', error);
    return {
      success: false,
      error: 'Failed to delete tutor. Please try again.',
    };
  }
}

export async function getTutors(params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}): Promise<ApiResponse<TutorWithAssignments[]>> {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    type TutorWhereInput = {
      OR?: Array<{
        employeeCode?: { contains: string; mode: 'insensitive' };
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
      isActive?: boolean;
    };

    const where: TutorWhereInput = {};

    if (params.search && params.search.trim()) {
      where.OR = [
        { employeeCode: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [tutors, total] = await Promise.all([
      prisma.tutor.findMany({
        where,
        skip,
        take: limit,
        include: {
          subjectAssignments: {
            include: {
              subject: true,
            },
          },
          _count: {
            select: {
              timetableEntries: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tutor.count({ where }),
    ]);

    return {
      success: true,
      data: tutors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return {
      success: false,
      error: 'Failed to fetch tutors',
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

export async function getTutorById(id: string): Promise<ApiResponse<TutorWithAssignments>> {
  try {
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        subjectAssignments: {
          include: {
            subject: true,
          },
        },
        _count: {
          select: {
            timetableEntries: true,
          },
        },
      },
    });

    if (!tutor) {
      return {
        success: false,
        error: 'Tutor not found',
      };
    }

    return {
      success: true,
      data: tutor,
    };
  } catch (error) {
    console.error('Error fetching tutor:', error);
    return {
      success: false,
      error: 'Failed to fetch tutor details',
    };
  }
}

export async function assignSubject(data: AssignSubjectInput): Promise<ApiResponse<TutorSubjectAssignment>> {
  try {
    // Check if assignment already exists
    const existing = await prisma.tutorSubjectAssignment.findUnique({
      where: {
        tutorId_subjectId: {
          tutorId: data.tutorId,
          subjectId: data.subjectId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'This tutor is already assigned to this subject',
      };
    }

    const assignment = await prisma.tutorSubjectAssignment.create({
      data: {
        tutorId: data.tutorId,
        subjectId: data.subjectId,
        classId: data.classId,
      },
    });

    revalidatePath('/academics/tutors');
    
    return {
      success: true,
      data: assignment,
      message: 'Subject assigned successfully',
    };
  } catch (error) {
    console.error('Error assigning subject:', error);
    return {
      success: false,
      error: 'Failed to assign subject. Please try again.',
    };
  }
}

export async function removeSubjectAssignment(tutorId: string, subjectId: string): Promise<ApiResponse<null>> {
  try {
    await prisma.tutorSubjectAssignment.delete({
      where: {
        tutorId_subjectId: {
          tutorId,
          subjectId,
        },
      },
    });

    revalidatePath('/academics/tutors');
    
    return {
      success: true,
      message: 'Subject assignment removed successfully',
    };
  } catch (error) {
    console.error('Error removing subject assignment:', error);
    return {
      success: false,
      error: 'Failed to remove subject assignment. Please try again.',
    };
  }
}

export async function generateEmployeeCode(): Promise<ApiResponse<string>> {
  try {
    const lastTutor = await prisma.tutor.findFirst({
      orderBy: {
        employeeCode: 'desc',
      },
      where: {
        employeeCode: {
          startsWith: 'KTYC/TUT/',
        },
      },
    });

    let nextNumber = 1;
    if (lastTutor) {
      const match = lastTutor.employeeCode.match(/\/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return {
      success: true,
      data: `KTYC/TUT/${String(nextNumber).padStart(4, '0')}`,
    };
  } catch (error) {
    console.error('Error generating employee code:', error);
    return {
      success: false,
      error: 'Failed to generate employee code',
    };
  }
}
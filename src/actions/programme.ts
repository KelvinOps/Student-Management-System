// src/actions/programme.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, ProgrammeLevel } from '@prisma/client';

export interface ProgrammeData {
  code: string;
  name: string;
  departmentId: string;
  level: ProgrammeLevel;
  duration: number;
  awardScheme?: string;
  effectiveDate: Date | string;
  endDate: Date | string;
  isActive?: boolean;
}

export async function createProgramme(data: ProgrammeData) {
  try {
    // Convert dates if they're strings
    const effectiveDate = typeof data.effectiveDate === 'string' 
      ? new Date(data.effectiveDate) 
      : data.effectiveDate;
    
    const endDate = typeof data.endDate === 'string' 
      ? new Date(data.endDate) 
      : data.endDate;

    const programme = await prisma.programme.create({
      data: {
        ...data,
        effectiveDate,
        endDate,
        awardScheme: data.awardScheme || 'General',
        isActive: data.isActive ?? true,
      },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    revalidatePath('/programmes');
    return { success: true, data: programme };
  } catch (error) {
    console.error('Error creating programme:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === 'P2002') {
        return {
          success: false,
          error: 'A programme with this code already exists',
        };
      }
    }
    
    return { success: false, error: 'Failed to create programme' };
  }
}

export async function updateProgramme(id: string, data: Partial<ProgrammeData>) {
  try {
    // Build update data with proper date conversion
    const updateData: Record<string, unknown> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'effectiveDate' || key === 'endDate') {
          updateData[key] = typeof value === 'string' ? new Date(value) : value;
        } else {
          updateData[key] = value;
        }
      }
    });

    const programme = await prisma.programme.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    revalidatePath('/programmes');
    revalidatePath(`/programmes/${id}`);
    return { success: true, data: programme };
  } catch (error) {
    console.error('Error updating programme:', error);
    return { success: false, error: 'Failed to update programme' };
  }
}

export async function getProgrammes(filters?: {
  departmentId?: string;
  level?: ProgrammeLevel;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { departmentId, level, isActive, search, page = 1, limit = 50 } = filters || {};

    const where: Prisma.ProgrammeWhereInput = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (level) {
      where.level = level;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programmes, total] = await Promise.all([
      prisma.programme.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          _count: {
            select: {
              students: true,
              classes: true,
              curriculums: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      prisma.programme.count({ where }),
    ]);

    return {
      success: true,
      data: programmes,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return { 
      success: false, 
      error: 'Failed to fetch programmes', 
      data: [] 
    };
  }
}

export async function getProgramme(id: string) {
  try {
    const programme = await prisma.programme.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        curriculums: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        classes: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            students: true,
            applicants: true,
          },
        },
      },
    });

    if (!programme) {
      return { success: false, error: 'Programme not found' };
    }

    return { success: true, data: programme };
  } catch (error) {
    console.error('Error fetching programme:', error);
    return { success: false, error: 'Failed to fetch programme' };
  }
}

export async function deleteProgramme(id: string) {
  try {
    // Check if programme has students
    const studentsCount = await prisma.student.count({
      where: { programmeId: id },
    });

    if (studentsCount > 0) {
      return {
        success: false,
        error: `Cannot delete programme with ${studentsCount} students. Please remove or reassign students first.`,
      };
    }

    // Check if programme has classes
    const classesCount = await prisma.class.count({
      where: { programmeId: id },
    });

    if (classesCount > 0) {
      return {
        success: false,
        error: `Cannot delete programme with ${classesCount} classes. Please remove or reassign classes first.`,
      };
    }

    await prisma.programme.delete({
      where: { id },
    });

    revalidatePath('/programmes');
    return { success: true };
  } catch (error) {
    console.error('Error deleting programme:', error);
    return { success: false, error: 'Failed to delete programme' };
  }
}

export async function getProgrammesByDepartment(departmentId: string) {
  try {
    const programmes = await prisma.programme.findMany({
      where: { 
        departmentId,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        level: true,
        duration: true,
      },
      orderBy: { code: 'asc' },
    });

    return { success: true, data: programmes };
  } catch (error) {
    console.error('Error fetching programmes by department:', error);
    return { success: false, error: 'Failed to fetch programmes', data: [] };
  }
}

export async function getProgrammeStatistics(programmeId: string) {
  try {
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      include: {
        _count: {
          select: {
            students: true,
            classes: true,
            applicants: true,
            curriculums: true,
          },
        },
      },
    });

    if (!programme) {
      return { success: false, error: 'Programme not found' };
    }

    // Get students by status
    const studentsByStatus = await prisma.student.groupBy({
      by: ['academicStatus'],
      where: { programmeId },
      _count: true,
    });

    // Get students by session
    const studentsBySession = await prisma.student.groupBy({
      by: ['session'],
      where: { programmeId },
      _count: true,
    });

    return {
      success: true,
      data: {
        totalStudents: programme._count.students,
        totalClasses: programme._count.classes,
        totalApplicants: programme._count.applicants,
        totalCurriculums: programme._count.curriculums,
        studentsByStatus,
        studentsBySession,
      },
    };
  } catch (error) {
    console.error('Error fetching programme statistics:', error);
    return { success: false, error: 'Failed to fetch programme statistics' };
  }
}
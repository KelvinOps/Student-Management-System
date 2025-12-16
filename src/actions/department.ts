// src/actions/department.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface DepartmentData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export async function createDepartment(data: DepartmentData) {
  try {
    const department = await prisma.department.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath('/departments');
    return { success: true, data: department };
  } catch (error) {
    console.error('Error creating department:', error);
    return { success: false, error: 'Failed to create department' };
  }
}

export async function updateDepartment(id: string, data: Partial<DepartmentData>) {
  try {
    const department = await prisma.department.update({
      where: { id },
      data,
    });

    revalidatePath('/departments');
    return { success: true, data: department };
  } catch (error) {
    console.error('Error updating department:', error);
    return { success: false, error: 'Failed to update department' };
  }
}

export async function getDepartments(filters?: {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { isActive, search, page = 1, limit = 50 } = filters || {};

    const where: Prisma.DepartmentWhereInput = {};

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          _count: {
            select: {
              programmes: true,
              students: true,
              applicants: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      success: true,
      data: departments,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { success: false, error: 'Failed to fetch departments', data: [] };
  }
}

export async function getDepartment(id: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        programmes: {
          select: {
            id: true,
            code: true,
            name: true,
            level: true,
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

    if (!department) {
      return { success: false, error: 'Department not found' };
    }

    return { success: true, data: department };
  } catch (error) {
    console.error('Error fetching department:', error);
    return { success: false, error: 'Failed to fetch department' };
  }
}

export async function deleteDepartment(id: string) {
  try {
    // Check if department has programmes
    const programmesCount = await prisma.programme.count({
      where: { departmentId: id },
    });

    if (programmesCount > 0) {
      return {
        success: false,
        error: `Cannot delete department with ${programmesCount} programmes. Please remove or reassign programmes first.`,
      };
    }

    await prisma.department.delete({
      where: { id },
    });

    revalidatePath('/departments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting department:', error);
    return { success: false, error: 'Failed to delete department' };
  }
}

export async function getDepartmentStatistics(departmentId: string) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            programmes: true,
            students: true,
            applicants: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: 'Department not found' };
    }

    // Get students by status
    const studentsByStatus = await prisma.student.groupBy({
      by: ['academicStatus'],
      where: { departmentId },
      _count: true,
    });

    // Get applicants by status
    const applicantsByStatus = await prisma.applicant.groupBy({
      by: ['status'],
      where: { departmentId },
      _count: true,
    });

    return {
      success: true,
      data: {
        totalProgrammes: department._count.programmes,
        totalStudents: department._count.students,
        totalApplicants: department._count.applicants,
        studentsByStatus,
        applicantsByStatus,
      },
    };
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    return { success: false, error: 'Failed to fetch department statistics' };
  }
}
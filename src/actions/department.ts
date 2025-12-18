'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma, ProgrammeLevel } from '@prisma/client';

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

export async function getProgrammesByDepartment(departmentId: string) {
  try {
    const programmes = await prisma.programme.findMany({
      where: { departmentId },
      select: {
        id: true,
        name: true,
        code: true,
        level: true,
        duration: true,
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, data: programmes };
  } catch (error) {
    console.error('Error fetching programmes by department:', error);
    return { success: false, error: 'Failed to fetch programmes', data: [] };
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

// Helper function to find or create department by name
export async function findOrCreateDepartment(departmentName: string) {
  try {
    // First, try to find existing department
    let department = await prisma.department.findFirst({
      where: { 
        name: { 
          equals: departmentName,
          mode: 'insensitive'
        }
      },
    });

    // If not found, create it
    if (!department) {
      const departmentCode = departmentName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 4);

      department = await prisma.department.create({
        data: {
          name: departmentName,
          code: departmentCode,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      data: department,
    };
  } catch (error) {
    console.error('Error finding/creating department:', error);
    return {
      success: false,
      error: 'Failed to find or create department',
    };
  }
}

// Helper function to find or create programme by name and department
export async function findOrCreateProgramme(programmeName: string, departmentId: string) {
  try {
    // First, try to find existing programme
    let programme = await prisma.programme.findFirst({
      where: { 
        name: { 
          equals: programmeName,
          mode: 'insensitive'
        },
        departmentId: departmentId
      },
    });

    // If not found, create it
    if (!programme) {
      // Generate programme code from name
      const generateProgrammeCode = (name: string): string => {
        const words = name.split(' ');
        const mainWords = words.filter(word => 
          !['In', 'And', 'The', 'For', 'Of', 'To', 'With', 'L3', 'L4', 'L5', 'L6', 
            'NITA', 'Grade', 'III', 'Certificate', 'Diploma', 'Artisan', 'Level'].includes(word)
        );
        
        if (mainWords.length >= 2) {
          return `${mainWords[0].charAt(0)}${mainWords[1].charAt(0)}`.toUpperCase();
        }
        return name.substring(0, 4).toUpperCase().replace(/\s+/g, '');
      };
      
      // Determine programme level
      const getProgrammeLevel = (name: string): ProgrammeLevel => {
        if (name.includes('L6') || name.includes('Level 6') || name.includes('Diploma')) 
          return ProgrammeLevel.DIPLOMA;
        if (name.includes('L5') || name.includes('Level 5') || name.includes('Certificate')) 
          return ProgrammeLevel.CERTIFICATE;
        if (name.includes('L4') || name.includes('Level 4') || name.includes('Artisan')) 
          return ProgrammeLevel.ARTISAN;
        if (name.includes('L3') || name.includes('Level 3') || name.includes('Grade III')) 
          return ProgrammeLevel.CERTIFICATE;
        
        return ProgrammeLevel.CERTIFICATE;
      };
      
      // Determine award scheme
      const getAwardScheme = (name: string): string => {
        if (name.includes('NITA')) return 'NITA';
        if (name.includes('Grade')) return 'NITA';
        return 'TVET';
      };
      
      // Determine duration based on level
      const getDuration = (level: ProgrammeLevel): number => {
        switch(level) {
          case ProgrammeLevel.DIPLOMA: return 3;
          case ProgrammeLevel.CERTIFICATE: return 2;
          case ProgrammeLevel.ARTISAN: return 1;
          case ProgrammeLevel.HIGHER_DIPLOMA: return 3;
          case ProgrammeLevel.BACHELOR: return 4;
          default: return 2;
        }
      };
      
      const level = getProgrammeLevel(programmeName);
      const duration = getDuration(level);
      const awardScheme = getAwardScheme(programmeName);
      const programmeCode = generateProgrammeCode(programmeName);
      
      // Create the programme
      programme = await prisma.programme.create({
        data: {
          name: programmeName,
          code: programmeCode,
          departmentId: departmentId,
          level: level,
          duration: duration,
          awardScheme: awardScheme,
          effectiveDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
          isActive: true,
        },
      });
    }

    return {
      success: true,
      data: programme,
    };
  } catch (error) {
    console.error('Error finding/creating programme:', error);
    return {
      success: false,
      error: 'Failed to find or create programme',
    };
  }
}
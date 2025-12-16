// src/actions/class.ts
'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Get all classes with optional filtering
export async function getClasses(params?: {
  search?: string;
  limit?: number;
  page?: number;
  status?: string;
}) {
  try {
    const { search = '', limit = 10, page = 1, status = 'Active' } = params || {};
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ClassWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { branch: { contains: search, mode: 'insensitive' } },
          { programme: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    // Fetch classes with pagination
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          programme: {
            select: {
              id: true,
              code: true,
              name: true,
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
              timetableEntries: true,
            },
          },
        },
        orderBy: { code: 'asc' },
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ]);

    return {
      success: true,
      data: classes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
      data: [],
    };
  }
}

// Get single class by ID
export async function getClassById(id: string) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        students: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            students: true,
            timetableEntries: true,
          },
        },
      },
    });

    if (!classData) {
      return {
        success: false,
        error: 'Class not found',
      };
    }

    // Calculate average scores for students
    const studentsWithScores = await Promise.all(
      classData.students.map(async (student) => {
        const marks = await prisma.marksEntry.findMany({
          where: { studentId: student.id },
          select: { total: true },
        });

        const totalMarks = marks.reduce((sum, mark) => sum + (mark.total || 0), 0);
        const avgScore = marks.length > 0 ? totalMarks / marks.length : 0;

        return {
          ...student,
          avgScore: Math.round(avgScore * 100) / 100,
        };
      })
    );

    // Calculate class average
    const classAverage =
      studentsWithScores.length > 0
        ? studentsWithScores.reduce((sum, s) => sum + s.avgScore, 0) / studentsWithScores.length
        : 0;

    return {
      success: true,
      data: {
        ...classData,
        students: studentsWithScores,
        classAverage: Math.round(classAverage * 100) / 100,
      },
    };
  } catch (error) {
    console.error('Error fetching class:', error);
    return {
      success: false,
      error: 'Failed to fetch class details',
    };
  }
}

// Create new class
export async function createClass(data: {
  code: string;
  name: string;
  programmeId: string;
  branch: string;
  sessionType: string;
  modeOfStudy: string;
  startDate: Date;
  endDate: Date;
  numberOfTeachers?: number;
}) {
  try {
    // Check if class code already exists
    const existingClass = await prisma.class.findUnique({
      where: { code: data.code },
    });

    if (existingClass) {
      return {
        success: false,
        error: 'Class with this code already exists',
      };
    }

    const newClass = await prisma.class.create({
      data: {
        ...data,
        status: 'Active',
        numberOfTeachers: data.numberOfTeachers || 0,
      },
      include: {
        programme: {
          include: {
            department: true,
          },
        },
      },
    });

    revalidatePath('/student-management/classes');

    return {
      success: true,
      data: newClass,
      message: 'Class created successfully',
    };
  } catch (error) {
    console.error('Error creating class:', error);
    return {
      success: false,
      error: 'Failed to create class',
    };
  }
}

// Update existing class
export async function updateClass(
  id: string,
  data: {
    code?: string;
    name?: string;
    programmeId?: string;
    branch?: string;
    sessionType?: string;
    modeOfStudy?: string;
    startDate?: Date;
    endDate?: Date;
    numberOfTeachers?: number;
    status?: string;
  }
) {
  try {
    // If code is being updated, check if it's already taken
    if (data.code) {
      const existingClass = await prisma.class.findFirst({
        where: {
          code: data.code,
          NOT: { id },
        },
      });

      if (existingClass) {
        return {
          success: false,
          error: 'Class code already exists',
        };
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data,
      include: {
        programme: {
          include: {
            department: true,
          },
        },
      },
    });

    revalidatePath('/student-management/classes');
    revalidatePath(`/student-management/classes/${id}`);

    return {
      success: true,
      data: updatedClass,
      message: 'Class updated successfully',
    };
  } catch (error) {
    console.error('Error updating class:', error);
    return {
      success: false,
      error: 'Failed to update class',
    };
  }
}

// Delete class
export async function deleteClass(id: string) {
  try {
    // Check if class has students
    const classWithStudents = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (classWithStudents && classWithStudents._count.students > 0) {
      return {
        success: false,
        error: `Cannot delete class with ${classWithStudents._count.students} enrolled student(s)`,
      };
    }

    await prisma.class.delete({
      where: { id },
    });

    revalidatePath('/student-management/classes');

    return {
      success: true,
      message: 'Class deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting class:', error);
    return {
      success: false,
      error: 'Failed to delete class',
    };
  }
}

// Export classes data
export async function exportClassesData() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        programme: {
          include: {
            department: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = classes.map((cls) => ({
      Code: cls.code,
      Name: cls.name,
      Branch: cls.branch,
      Programme: cls.programme.name,
      Department: cls.programme.department.name,
      'Session Type': cls.sessionType,
      'Mode of Study': cls.modeOfStudy,
      'Start Date': cls.startDate.toISOString().split('T')[0],
      'End Date': cls.endDate.toISOString().split('T')[0],
      'Number of Students': cls._count.students,
      'Number of Teachers': cls.numberOfTeachers,
      Status: cls.status,
    }));

    return {
      success: true,
      data: csvData,
    };
  } catch (error) {
    console.error('Error exporting classes:', error);
    return {
      success: false,
      error: 'Failed to export classes',
    };
  }
}

// Get programmes for dropdown
export async function getProgrammesForDropdown() {
  try {
    const programmes = await prisma.programme.findMany({
      where: { isActive: true },
      include: {
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: programmes,
    };
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return {
      success: false,
      error: 'Failed to fetch programmes',
      data: [],
    };
  }
}

// Get class statistics
export async function getClassStatistics(id: string) {
  try {
    const [studentCount, averageAttendance, subjectCount] = await Promise.all([
      prisma.student.count({
        where: { classId: id, academicStatus: 'ACTIVE' },
      }),
      prisma.attendanceRecord.aggregate({
        where: {
          classId: id,
          status: 'PRESENT',
        },
        _count: true,
      }),
      prisma.timetableEntry.count({
        where: { classId: id },
      }),
    ]);

    return {
      success: true,
      data: {
        studentCount,
        averageAttendance: averageAttendance._count,
        subjectCount,
      },
    };
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    return {
      success: false,
      error: 'Failed to fetch class statistics',
    };
  }
}
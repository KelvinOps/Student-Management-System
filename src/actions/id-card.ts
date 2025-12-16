// src/actions/id-card.ts
"use server";

import prisma from "@/app/lib/prisma";
import { Prisma, AcademicStatus } from "@prisma/client";

interface IDCardFilters {
  departmentId?: string;
  classId?: string;
  academicStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface IDCardData {
  id: string;
  name: string;
  admissionNo: string;
  avatar: string | null;
  class: string;
  programme: string;
  department: string;
  academicYear: string;
  session: string;
  validUntil: string;
}

interface IDCardResponse {
  success: boolean;
  data: IDCardData[];
  pagination?: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
  error?: string;
}

// Calculate valid until date (typically 4 years from academic year start)
function calculateValidUntil(academicYear: string, session: string): string {
  const yearMatch = academicYear.match(/\d{4}/);
  if (!yearMatch) return 'N/A';
  
  const startYear = parseInt(yearMatch[0]);
  const endYear = startYear + 4;
  
  return `31 Dec ${endYear}`;
}

export async function getIDCardsData(filters?: IDCardFilters): Promise<IDCardResponse> {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.StudentWhereInput = {
      academicStatus: 'ACTIVE', // Only active students get ID cards
    };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.academicStatus) {
      where.academicStatus = filters.academicStatus as AcademicStatus;
    }

    if (filters?.search) {
      where.OR = [
        { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students with pagination
    const students = await prisma.student.findMany({
      where,
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        admissionNumber: 'asc',
      },
      skip,
      take: limit,
    });

    // Format data for ID cards
    const idCardData: IDCardData[] = students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: student.session.replace(/_/g, '-'),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    }));

    return {
      success: true,
      data: idCardData,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching ID cards data:", error);
    return {
      success: false,
      error: "Failed to fetch ID cards data",
      data: [],
    };
  }
}

// Get single student for ID card generation
export async function getStudentIDCard(studentId: string): Promise<{ success: boolean; data?: IDCardData; error?: string }> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
        programme: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    const idCardData: IDCardData = {
      id: student.id,
      name: `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase(),
      admissionNo: student.admissionNumber,
      avatar: student.avatar,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      academicYear: student.academicYear,
      session: student.session.replace(/_/g, '-'),
      validUntil: calculateValidUntil(student.academicYear, student.session),
    };

    return {
      success: true,
      data: idCardData,
    };
  } catch (error) {
    console.error("Error fetching student ID card:", error);
    return {
      success: false,
      error: "Failed to fetch student ID card",
    };
  }
}
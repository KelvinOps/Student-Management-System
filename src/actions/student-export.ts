// src/actions/student-export.ts
"use server";

import prisma from "@/app/lib/prisma";
import { AcademicStatus, Prisma } from "@prisma/client";

interface ExportFilters {
  departmentId?: string;
  classId?: string;
  academicStatus?: string;
  search?: string;
}

interface ExportResponse {
  success: boolean;
  data: ExportData[];
  error?: string;
}

// Interface with index signature to match ExportableData
interface ExportData {
  [key: string]: string;
  'Admission Number': string;
  'First Name': string;
  'Middle Name': string;
  'Last Name': string;
  'Gender': string;
  'Date of Birth': string;
  'Email': string;
  'Phone Number': string;
  'ID Number': string;
  'Class': string;
  'Programme': string;
  'Department': string;
  'Cohort': string;
  'Academic Year': string;
  'Session': string;
  'Academic Status': string;
  'Guardian Name': string;
  'Guardian Phone': string;
  'Guardian Relation': string;
  'County': string;
  'Sub County': string;
}

// Get students data for export
export async function getStudentsForExport(filters?: ExportFilters): Promise<ExportResponse> {
  try {
    // Use Prisma's type-safe where clause
    const where: Prisma.StudentWhereInput = {};

    // Apply filters
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
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

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
            code: true,
            name: true,
          },
        },
        department: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    // Format data for export
    const exportData: ExportData[] = students.map((student) => ({
      'Admission Number': student.admissionNumber,
      'First Name': student.firstName,
      'Middle Name': student.middleName || '',
      'Last Name': student.lastName,
      'Gender': student.gender,
      'Date of Birth': student.dateOfBirth.toISOString().split('T')[0],
      'Email': student.email || '',
      'Phone Number': student.phoneNumber || '',
      'ID Number': student.idNumber || '',
      'Class': student.class?.code || '',
      'Programme': student.programme?.name || '',
      'Department': student.department?.name || '',
      'Cohort': student.cohort,
      'Academic Year': student.academicYear,
      'Session': student.session.replace(/_/g, '-'),
      'Academic Status': student.academicStatus,
      'Guardian Name': student.guardianName || '',
      'Guardian Phone': student.guardianPhone || '',
      'Guardian Relation': student.guardianRelation || '',
      'County': student.county || '',
      'Sub County': student.subCounty || '',
    }));

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("Error fetching students for export:", error);
    return {
      success: false,
      error: "Failed to fetch students for export",
      data: [],
    };
  }
}
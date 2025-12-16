// src/actions/student-reporting.ts
"use server";

import prisma from "@/app/lib/prisma";
import { Prisma, AcademicStatus, Session } from "@prisma/client";

interface ReportingFilters {
  departmentId?: string;
  classId?: string;
  session?: string;
  academicYear?: string;
  academicStatus?: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  graduatedStudents: number;
  suspendedStudents: number;
}

interface ClassPerformance {
  classCode: string;
  className: string;
  studentCount: number;
  attendanceRate: number;
  averageScore: number;
}

interface DepartmentStats {
  departmentName: string;
  studentCount: number;
  activeCount: number;
  maleCount: number;
  femaleCount: number;
}

interface SessionBreakdown {
  session: string;
  studentCount: number;
  percentage: number;
}

interface ReportingData {
  stats: StudentStats;
  classPerformance: ClassPerformance[];
  departmentStats: DepartmentStats[];
  sessionBreakdown: SessionBreakdown[];
  recentReports: Array<{
    id: string;
    studentName: string;
    admissionNumber: string;
    session: string;
    classCode: string;
    programme: string;
    department: string;
    reportedAt: Date;
  }>;
}

interface ReportingResponse {
  success: boolean;
  data?: ReportingData;
  error?: string;
}

interface StudentForReport {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  class: string;
  programme: string;
  department: string;
  session: string;
  academicYear: string;
  academicStatus: string;
  reportCount: number;
  lastReported: Date | null;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
}

// Get comprehensive reporting data
export async function getStudentReportingData(
  filters?: ReportingFilters
): Promise<ReportingResponse> {
  try {
    // Build where clause
    const where: Prisma.StudentWhereInput = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.session) {
      where.session = filters.session as Session;
    }

    if (filters?.academicYear) {
      where.academicYear = filters.academicYear;
    }

    if (filters?.academicStatus) {
      where.academicStatus = filters.academicStatus as AcademicStatus;
    }

    // Get student statistics
    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      suspendedStudents,
    ] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.count({ where: { ...where, academicStatus: 'ACTIVE' } }),
      prisma.student.count({ where: { ...where, academicStatus: 'INACTIVE' } }),
      prisma.student.count({ where: { ...where, academicStatus: 'GRADUATED' } }),
      prisma.student.count({ where: { ...where, academicStatus: 'SUSPENDED' } }),
    ]);

    // Get class performance data
    const classesWithStudents = await prisma.class.findMany({
      where: filters?.classId ? { id: filters.classId } : {},
      include: {
        students: {
          where,
          include: {
            attendanceRecords: {
              where: {
                date: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
            },
            marksEntries: true,
          },
        },
      },
    });

    const classPerformance: ClassPerformance[] = classesWithStudents.map((cls) => {
      const studentCount = cls.students.length;
      
      // Calculate attendance rate
      let totalAttendance = 0;
      let attendanceRecords = 0;
      cls.students.forEach((student) => {
        const present = student.attendanceRecords.filter(
          (record) => record.status === 'PRESENT'
        ).length;
        const total = student.attendanceRecords.length;
        if (total > 0) {
          totalAttendance += (present / total) * 100;
          attendanceRecords += 1;
        }
      });
      const attendanceRate = attendanceRecords > 0 ? totalAttendance / attendanceRecords : 0;

      // Calculate average score
      let totalScore = 0;
      let scoreCount = 0;
      cls.students.forEach((student) => {
        student.marksEntries.forEach((marks) => {
          if (marks.total) {
            totalScore += marks.total;
            scoreCount += 1;
          }
        });
      });
      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      return {
        classCode: cls.code,
        className: cls.name,
        studentCount,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
      };
    });

    // Get department statistics
    const departments = await prisma.department.findMany({
      where: filters?.departmentId ? { id: filters.departmentId } : {},
      include: {
        students: {
          where,
        },
      },
    });

    const departmentStats: DepartmentStats[] = departments.map((dept) => ({
      departmentName: dept.name,
      studentCount: dept.students.length,
      activeCount: dept.students.filter((s) => s.academicStatus === 'ACTIVE').length,
      maleCount: dept.students.filter((s) => s.gender === 'MALE').length,
      femaleCount: dept.students.filter((s) => s.gender === 'FEMALE').length,
    }));

    // Get session breakdown
    const sessionCounts = await prisma.student.groupBy({
      by: ['session'],
      where,
      _count: true,
    });

    const sessionBreakdown: SessionBreakdown[] = sessionCounts.map((item) => ({
      session: item.session.replace(/_/g, '-'),
      studentCount: item._count,
      percentage: totalStudents > 0 ? Math.round((item._count / totalStudents) * 100) : 0,
    }));

    // Get recent reports
    const recentReportsData = await prisma.studentReport.findMany({
      where: filters?.departmentId || filters?.classId
        ? {
            student: where,
          }
        : {},
      include: {
        student: {
          include: {
            class: true,
            programme: true,
            department: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: 10,
    });

    const recentReports = recentReportsData.map((report) => ({
      id: report.id,
      studentName: `${report.student.firstName} ${report.student.lastName}`,
      admissionNumber: report.student.admissionNumber,
      session: report.session,
      classCode: report.student.class?.code || 'N/A',
      programme: report.student.programme?.name || 'N/A',
      department: report.student.department?.name || 'N/A',
      reportedAt: report.reportedAt,
    }));

    return {
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          graduatedStudents,
          suspendedStudents,
        },
        classPerformance,
        departmentStats,
        sessionBreakdown,
        recentReports,
      },
    };
  } catch (error) {
    console.error("Error fetching student reporting data:", error);
    return {
      success: false,
      error: "Failed to fetch student reporting data",
    };
  }
}

// Get students for reporting table with pagination
export async function getStudentsForReporting(
  filters: ReportingFilters
): Promise<{
  success: boolean;
  data: StudentForReport[];
  pagination: Pagination;
  error?: string;
}> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.StudentWhereInput = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.session) {
      where.session = filters.session as Session;
    }

    if (filters?.academicYear) {
      where.academicYear = filters.academicYear;
    }

    if (filters?.academicStatus) {
      where.academicStatus = filters.academicStatus as AcademicStatus;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students with related data
    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
        programme: true,
        department: true,
        studentReports: {
          orderBy: {
            reportedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            studentReports: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    const data: StudentForReport[] = students.map((student) => ({
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      class: student.class?.code || 'N/A',
      programme: student.programme?.name || 'N/A',
      department: student.department?.name || 'N/A',
      session: student.session.replace(/_/g, '-'),
      academicYear: student.academicYear,
      academicStatus: student.academicStatus,
      reportCount: student._count.studentReports,
      lastReported: student.studentReports[0]?.reportedAt || null,
    }));

    return {
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error fetching students for reporting:", error);
    return {
      success: false,
      data: [],
      pagination: { total: 0, totalPages: 0, currentPage: 1 },
      error: "Failed to fetch students",
    };
  }
}

// Create a student report
interface CreateReportInput {
  studentId: string;
  reportedBy: string;
}

export async function createStudentReport(
  input: CreateReportInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
      include: {
        class: true,
        programme: true,
        department: true,
      },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    await prisma.studentReport.create({
      data: {
        admissionNumber: student.admissionNumber,
        studentName: `${student.firstName} ${student.lastName}`,
        session: student.session,
        branch: "Main Campus",
        classCode: student.class?.code || '',
        programme: student.programme?.name || '',
        department: student.department?.name || '',
        studentId: student.id,
        reportedBy: input.reportedBy,
      },
    });

    return {
      success: true,
      message: "Student reported successfully!",
    };
  } catch (error) {
    console.error("Error creating student report:", error);
    return {
      success: false,
      error: "Failed to create student report",
    };
  }
}

// Export data interface with index signature for iteration
export interface StudentExportData {
  [key: string]: string | number;
  'Admission Number': string;
  'First Name': string;
  'Last Name': string;
  'Gender': string;
  'Class': string;
  'Programme': string;
  'Department': string;
  'Session': string;
  'Academic Year': string;
  'Status': string;
  'Total Reports': number;
  'Last Reported': string;
}

// Get student reports for export
export async function getStudentReportsForExport(
  filters: ReportingFilters
): Promise<{
  success: boolean;
  data: StudentExportData[];
  error?: string;
}> {
  try {
    // Build where clause
    const where: Prisma.StudentWhereInput = {};

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.session) {
      where.session = filters.session as Session;
    }

    if (filters?.academicYear) {
      where.academicYear = filters.academicYear;
    }

    if (filters?.academicStatus) {
      where.academicStatus = filters.academicStatus as AcademicStatus;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
        programme: true,
        department: true,
        studentReports: {
          orderBy: {
            reportedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            studentReports: true,
          },
        },
      },
      orderBy: {
        admissionNumber: 'asc',
      },
    });

    const data: StudentExportData[] = students.map((student) => ({
      'Admission Number': student.admissionNumber,
      'First Name': student.firstName,
      'Last Name': student.lastName,
      'Gender': student.gender,
      'Class': student.class?.code || 'N/A',
      'Programme': student.programme?.name || 'N/A',
      'Department': student.department?.name || 'N/A',
      'Session': student.session.replace(/_/g, '-'),
      'Academic Year': student.academicYear,
      'Status': student.academicStatus,
      'Total Reports': student._count.studentReports,
      'Last Reported': student.studentReports[0]?.reportedAt 
        ? new Date(student.studentReports[0].reportedAt).toLocaleDateString()
        : 'Never',
    }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching reports for export:", error);
    return {
      success: false,
      data: [],
      error: "Failed to fetch reports for export",
    };
  }
}

// Get academic years for filtering
export async function getAcademicYears(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const years = await prisma.student.findMany({
      distinct: ['academicYear'],
      select: {
        academicYear: true,
      },
      orderBy: {
        academicYear: 'desc',
      },
    });

    return {
      success: true,
      data: years.map((y) => y.academicYear),
    };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return {
      success: false,
      error: "Failed to fetch academic years",
    };
  }
}
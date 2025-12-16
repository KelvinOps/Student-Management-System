// src/actions/attendance.ts
'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface AttendanceData {
  date: Date;
  studentId: string;
  classId: string;
  subjectId?: string;
  stage?: string;
  room?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  recordedBy: string;
}

export async function recordAttendance(data: AttendanceData) {
  try {
    const attendance = await prisma.attendanceRecord.create({
      data,
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    revalidatePath('/academics/attendance/lesson');
    return { success: true, data: attendance };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return { success: false, error: 'Failed to record attendance' };
  }
}

export async function bulkRecordAttendance(records: AttendanceData[]) {
  try {
    const created = await prisma.attendanceRecord.createMany({
      data: records,
      skipDuplicates: true,
    });

    revalidatePath('/academics/attendance/lesson');
    return { success: true, data: created };
  } catch (error) {
    console.error('Error bulk recording attendance:', error);
    return { success: false, error: 'Failed to record attendance' };
  }
}

export async function updateAttendance(
  id: string,
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
) {
  try {
    const attendance = await prisma.attendanceRecord.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    revalidatePath('/academics/attendance/lesson');
    return { success: true, data: attendance };
  } catch (error) {
    console.error('Error updating attendance:', error);
    return { success: false, error: 'Failed to update attendance' };
  }
}

export async function getAttendanceRecords(filters?: {
  date?: Date;
  classId?: string;
  studentId?: string;
  subjectId?: string;
  stage?: string;
  room?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  try {
    const {
      date,
      classId,
      studentId,
      subjectId,
      stage,
      room,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters || {};

    const where: Prisma.AttendanceRecordWhereInput = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;
    if (stage) where.stage = stage;
    if (room) where.room = room;

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
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
          class: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ date: 'desc' }, { student: { admissionNumber: 'asc' } }],
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    return {
      success: true,
      data: records,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return {
      success: false,
      error: 'Failed to fetch attendance records',
      data: [],
    };
  }
}

export async function getStudentAttendance(
  studentId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const where: Prisma.AttendanceRecordWhereInput = { studentId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where,
      include: {
        class: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'PRESENT').length;
    const absent = attendance.filter((a) => a.status === 'ABSENT').length;
    const late = attendance.filter((a) => a.status === 'LATE').length;
    const excused = attendance.filter((a) => a.status === 'EXCUSED').length;

    const attendanceRate =
      total > 0 ? ((present + late) / total) * 100 : 0;

    return {
      success: true,
      data: {
        records: attendance,
        statistics: {
          total,
          present,
          absent,
          late,
          excused,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return {
      success: false,
      error: 'Failed to fetch student attendance',
      data: { records: [], statistics: {} },
    };
  }
}

export async function getClassAttendance(
  classId: string,
  date: Date
) {
  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
      },
      orderBy: { admissionNumber: 'asc' },
    });

    // Get attendance records for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        classId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Map students with their attendance status
    const attendanceData = students.map((student) => {
      const record = records.find((r) => r.studentId === student.id);
      return {
        ...student,
        status: record?.status || 'NOT_MARKED',
        attendanceId: record?.id,
      };
    });

    return { success: true, data: attendanceData };
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    return {
      success: false,
      error: 'Failed to fetch class attendance',
      data: [],
    };
  }
}

interface StudentAttendanceData {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    class: {
      code: string;
    };
  };
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export async function getAttendanceReport(filters: {
  classId?: string;
  startDate: Date;
  endDate: Date;
}) {
  try {
    const { classId, startDate, endDate } = filters;

    const where: Prisma.AttendanceRecordWhereInput = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (classId) {
      where.classId = classId;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            class: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    // Group by student
    const studentAttendance = records.reduce((acc, record) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.student,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      acc[studentId].total++;
      if (record.status === 'PRESENT') acc[studentId].present++;
      if (record.status === 'ABSENT') acc[studentId].absent++;
      if (record.status === 'LATE') acc[studentId].late++;
      if (record.status === 'EXCUSED') acc[studentId].excused++;

      return acc;
    }, {} as Record<string, StudentAttendanceData>);

    // Calculate attendance rates
    const reportData = Object.values(studentAttendance).map((data) => ({
      ...data,
      attendanceRate: ((data.present + data.late) / data.total) * 100,
    }));

    return { success: true, data: reportData };
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return {
      success: false,
      error: 'Failed to generate attendance report',
      data: [],
    };
  }
}

export async function deleteAttendanceRecord(id: string) {
  try {
    await prisma.attendanceRecord.delete({
      where: { id },
    });

    revalidatePath('/academics/attendance/lesson');
    return { success: true };
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return { success: false, error: 'Failed to delete attendance record' };
  }
}
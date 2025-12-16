// app/lib/validations/student.ts
import { z } from 'zod';

export const createStudentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.date().or(z.string().transform((str) => new Date(str))),
  nationality: z.string().default('Kenyan'),
  idNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  
  // Academic Info
  cohort: z.string().min(1, 'Cohort is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  session: z.enum(['SEPT_DEC', 'JAN_APRIL', 'MAY_AUGUST']),
  classId: z.string().min(1, 'Class is required'),
  programmeId: z.string().min(1, 'Programme is required'),
  departmentId: z.string().min(1, 'Department is required'),
  sportsHouse: z.string().optional().nullable(),
  stream: z.string().optional().nullable(),
  previousSchool: z.string().optional().nullable(),
  kcpeScore: z.number().int().min(0).max(500).optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  academicStatus: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'SUSPENDED', 'EXPELLED', 'WITHDRAWN']).default('ACTIVE'),
  
  // Personnel Assignment
  personnelId: z.string().optional().nullable(),
  
  // Address
  address: z.string().optional().nullable(),
  county: z.string().optional().nullable(),
  subCounty: z.string().optional().nullable(),
  ward: z.string().optional().nullable(),
  village: z.string().optional().nullable(),
  
  // Parent/Guardian Info
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianEmail: z.string().email().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  guardianOccupation: z.string().optional().nullable(),
  guardianIdNumber: z.string().optional().nullable(),
  guardianAddress: z.string().optional().nullable(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().min(1, 'Student ID is required'),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
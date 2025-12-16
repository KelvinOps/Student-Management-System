// src\types\student.ts"

import { Gender, Session, AcademicStatus } from '@prisma/client';

export interface CreateStudentDTO {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
  dateOfBirth: Date | string;
  nationality?: string;
  idNumber?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  religion?: string;
  address?: string;
  county?: string;
  subCounty?: string;
  ward?: string;
  village?: string;

  // Academic Information
  admissionNumber: string;
  cohort: string;
  academicYear: string;
  session: Session;
  classId: string;
  programmeId: string;
  departmentId: string;
  stream?: string;
  previousSchool?: string;
  kcpeScore?: number;
  specialNeeds?: string;
  sportsHouse?: string;
  personnelId?: string;

  // Guardian Information
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  guardianOccupation?: string;
  guardianIdNumber?: string;
  guardianAddress?: string;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: string;
  academicStatus?: AcademicStatus;
}

export interface StudentFilter {
  search?: string;
  gender?: Gender;
  classId?: string;
  programmeId?: string;
  departmentId?: string;
  academicStatus?: AcademicStatus;
  session?: Session;
  cohort?: string;
  page?: number;
  limit?: number;
}

export interface StudentWithRelations {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender: Gender;
  class: {
    id: string;
    code: string;
    name: string;
  };
  programme: {
    id: string;
    code: string;
    name: string;
  };
  department: {
    id: string;
    code: string;
    name: string;
  };
  session: Session;
  cohort: string;
  county?: string | null;
  academicStatus: AcademicStatus;
}
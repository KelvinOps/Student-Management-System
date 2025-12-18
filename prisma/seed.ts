// Add this at the very top of prisma/seed.ts
if (process.env.NODE_ENV === 'production') {
  console.log('Skipping seed script in production build');
  process.exit(0);
}

// prisma/seed.ts - COMPLETE CORRECTED VERSION
import { prisma } from '@/app/lib/prisma';
import * as bcrypt from 'bcryptjs';


async function main() {
  console.log('🌱 Starting seed...');

  // ==================== USERS ====================
  console.log('\n👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ktyc.ac.ke' },
    update: {},
    create: {
      email: 'admin@ktyc.ac.ke',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+254700000000',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create additional staff users
  const staffUsers = [
    {
      email: 'registrar@ktyc.ac.ke',
      role: 'ADMIN' as const,
      firstName: 'James',
      lastName: 'Kiprotich',
      phoneNumber: '+254712345678',
    },
    {
      email: 'hod.engineering@ktyc.ac.ke',
      role: 'STAFF' as const,
      firstName: 'Mary',
      lastName: 'Wanjiru',
      phoneNumber: '+254723456789',
    },
    {
      email: 'hod.ict@ktyc.ac.ke',
      role: 'STAFF' as const,
      firstName: 'Peter',
      lastName: 'Otieno',
      phoneNumber: '+254734567890',
    },
    {
      email: 'lecturer.ict@ktyc.ac.ke',
      role: 'TEACHER' as const,
      firstName: 'Sarah',
      lastName: 'Muthoni',
      phoneNumber: '+254745678901',
    },
    {
      email: 'lecturer.eng@ktyc.ac.ke',
      role: 'TEACHER' as const,
      firstName: 'David',
      lastName: 'Kimani',
      phoneNumber: '+254756789012',
    },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        ...staff,
        password: hashedPassword,
        isActive: true,
      },
    });
    console.log('✅ Staff user created:', staff.email);
  }

  // ==================== DEPARTMENTS ====================
  console.log('\n🏢 Creating departments...');
  
  const departments = [
    { 
      code: 'ENG', 
      name: 'Engineering', 
      description: 'Engineering and Construction Department',
      isActive: true,
    },
    { 
      code: 'ICT', 
      name: 'Information Technology', 
      description: 'Information and Communication Technology Department',
      isActive: true,
    },
    { 
      code: 'AGR', 
      name: 'Agriculture', 
      description: 'Agriculture and Environmental Studies Department',
      isActive: true,
    },
    { 
      code: 'BSM', 
      name: 'Business Management', 
      description: 'Business and Entrepreneurship Department',
      isActive: true,
    },
    { 
      code: 'HSM', 
      name: 'Hospitality & Tourism', 
      description: 'Hospitality and Tourism Management Department',
      isActive: true,
    },
  ];

  const createdDepartments = [];
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    createdDepartments.push(department);
    console.log('✅ Department created:', department.name);
  }

  // ==================== PROGRAMMES ====================
  console.log('\n📚 Creating programmes...');
  
  const programmes = [
    // Engineering Programmes
    {
      code: 'A-AM-L3',
      name: 'Artisan In Automotive Mechanic L3',
      departmentId: createdDepartments[0].id,
      level: 'ARTISAN' as const,
      duration: 1,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'CBT-L5',
      name: 'Certificate Building Technician L5',
      departmentId: createdDepartments[0].id,
      level: 'CERTIFICATE' as const,
      duration: 1,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'DME-L6',
      name: 'Diploma in Mechanical Engineering',
      departmentId: createdDepartments[0].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'DEE-L6',
      name: 'Diploma in Electrical Engineering',
      departmentId: createdDepartments[0].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },

    // ICT Programmes
    {
      code: 'ICT-L6',
      name: 'Diploma in Information Technology',
      departmentId: createdDepartments[1].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'CS-L6',
      name: 'Diploma in Computer Science',
      departmentId: createdDepartments[1].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'SE-L7',
      name: 'Higher Diploma in Software Engineering',
      departmentId: createdDepartments[1].id,
      level: 'HIGHER_DIPLOMA' as const,
      duration: 1,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },

    // Agriculture Programmes
    {
      code: 'SARD-L5',
      name: 'Sustainable Agriculture for Rural Development Level 5',
      departmentId: createdDepartments[2].id,
      level: 'CERTIFICATE' as const,
      duration: 1,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'AGR-L6',
      name: 'Diploma in Agriculture',
      departmentId: createdDepartments[2].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },

    // Business Programmes
    {
      code: 'BBM-L6',
      name: 'Diploma in Business Management',
      departmentId: createdDepartments[3].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
    {
      code: 'ACC-L6',
      name: 'Diploma in Accounting',
      departmentId: createdDepartments[3].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },

    // Hospitality Programmes
    {
      code: 'HM-L6',
      name: 'Diploma in Hotel Management',
      departmentId: createdDepartments[4].id,
      level: 'DIPLOMA' as const,
      duration: 2,
      awardScheme: 'General',
      effectiveDate: new Date('2024-01-01'),
      endDate: new Date('2030-12-31'),
      isActive: true,
    },
  ];

  const createdProgrammes = [];
  for (const prog of programmes) {
    const programme = await prisma.programme.upsert({
      where: { code: prog.code },
      update: {},
      create: prog,
    });
    createdProgrammes.push(programme);
    console.log('✅ Programme created:', programme.code, '-', programme.name);
  }

  // ==================== CLASSES ====================
  console.log('\n🎓 Creating classes...');
  
  const classes = [
    // 2025 January Intake
    {
      code: 'ICT(L6)/2025/J',
      name: 'ICT Diploma 2025 Jan',
      programmeId: createdProgrammes.find(p => p.code === 'ICT-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-05-30'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'BBM(L6)/2025/J',
      name: 'Business Management 2025 Jan',
      programmeId: createdProgrammes.find(p => p.code === 'BBM-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-05-30'),
      numberOfTeachers: 0,
      status: 'Active',
    },

    // 2025 May Intake
    {
      code: 'CS(L6)/2025/M',
      name: 'Computer Science 2025 May',
      programmeId: createdProgrammes.find(p => p.code === 'CS-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-05-15'),
      endDate: new Date('2025-09-30'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'DME(L6)/2025/M',
      name: 'Mechanical Engineering 2025 May',
      programmeId: createdProgrammes.find(p => p.code === 'DME-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-05-15'),
      endDate: new Date('2025-09-30'),
      numberOfTeachers: 0,
      status: 'Active',
    },

    // 2025 September Intake
    {
      code: 'A(L3)/2025/S',
      name: 'Artisan Automotive L3 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'A-AM-L3')!.id,
      branch: 'Main Campus',
      sessionType: 'Term',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'SARD(L5)/2025/S',
      name: 'SARD L5 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'SARD-L5')!.id,
      branch: 'Main Campus',
      sessionType: 'Term',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'CBT(L5)/2025/S',
      name: 'Building Tech L5 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'CBT-L5')!.id,
      branch: 'Main Campus',
      sessionType: 'Term',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'DEE(L6)/2025/S',
      name: 'Electrical Engineering 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'DEE-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'AGR(L6)/2025/S',
      name: 'Agriculture Diploma 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'AGR-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'HM(L6)/2025/S',
      name: 'Hotel Management 2025 Sept',
      programmeId: createdProgrammes.find(p => p.code === 'HM-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Full Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },

    // Evening/Part-time classes
    {
      code: 'ICT(L6)/2025/S-EVE',
      name: 'ICT Diploma 2025 Sept (Evening)',
      programmeId: createdProgrammes.find(p => p.code === 'ICT-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Part Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
    {
      code: 'ACC(L6)/2025/S-EVE',
      name: 'Accounting 2025 Sept (Evening)',
      programmeId: createdProgrammes.find(p => p.code === 'ACC-L6')!.id,
      branch: 'Main Campus',
      sessionType: 'Semester',
      modeOfStudy: 'Part Time',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-15'),
      numberOfTeachers: 0,
      status: 'Active',
    },
  ];

  const createdClasses = [];
  for (const cls of classes) {
    const classData = await prisma.class.upsert({
      where: { code: cls.code },
      update: {},
      create: cls,
    });
    createdClasses.push(classData);
    console.log('✅ Class created:', classData.code);
  }

  // ==================== SAMPLE STUDENTS ====================
  console.log('\n👨‍🎓 Creating sample students...');
  
  const sampleStudents = [
    {
      admissionNumber: 'KTYC/2025/001',
      firstName: 'John',
      lastName: 'Kamau',
      gender: 'MALE' as const,
      dateOfBirth: new Date('2005-03-15'),
      nationality: 'Kenyan',
      email: 'john.kamau@student.ktyc.ac.ke',
      phoneNumber: '+254710000001',
      idNumber: '12345678',
      cohort: '2025',
      academicYear: '2024/2025',
      session: 'JAN_APRIL' as const,
      classId: createdClasses.find(c => c.code === 'ICT(L6)/2025/J')!.id,
      programmeId: createdProgrammes.find(p => p.code === 'ICT-L6')!.id,
      departmentId: createdDepartments[1].id,
      academicStatus: 'ACTIVE' as const,
      guardianName: 'James Kamau',
      guardianPhone: '+254722000001',
      guardianRelation: 'Father',
    },
    {
      admissionNumber: 'KTYC/2025/002',
      firstName: 'Jane',
      lastName: 'Wanjiku',
      gender: 'FEMALE' as const,
      dateOfBirth: new Date('2004-07-22'),
      nationality: 'Kenyan',
      email: 'jane.wanjiku@student.ktyc.ac.ke',
      phoneNumber: '+254710000002',
      idNumber: '23456789',
      cohort: '2025',
      academicYear: '2024/2025',
      session: 'JAN_APRIL' as const,
      classId: createdClasses.find(c => c.code === 'ICT(L6)/2025/J')!.id,
      programmeId: createdProgrammes.find(p => p.code === 'ICT-L6')!.id,
      departmentId: createdDepartments[1].id,
      academicStatus: 'ACTIVE' as const,
      guardianName: 'Mary Wanjiku',
      guardianPhone: '+254722000002',
      guardianRelation: 'Mother',
    },
    {
      admissionNumber: 'KTYC/2025/003',
      firstName: 'David',
      lastName: 'Omondi',
      gender: 'MALE' as const,
      dateOfBirth: new Date('2005-11-08'),
      nationality: 'Kenyan',
      email: 'david.omondi@student.ktyc.ac.ke',
      phoneNumber: '+254710000003',
      idNumber: '34567890',
      cohort: '2025',
      academicYear: '2024/2025',
      session: 'JAN_APRIL' as const,
      classId: createdClasses.find(c => c.code === 'BBM(L6)/2025/J')!.id,
      programmeId: createdProgrammes.find(p => p.code === 'BBM-L6')!.id,
      departmentId: createdDepartments[3].id,
      academicStatus: 'ACTIVE' as const,
      guardianName: 'Peter Omondi',
      guardianPhone: '+254722000003',
      guardianRelation: 'Father',
    },
    {
      admissionNumber: 'KTYC/2025/004',
      firstName: 'Grace',
      lastName: 'Achieng',
      gender: 'FEMALE' as const,
      dateOfBirth: new Date('2006-02-14'),
      nationality: 'Kenyan',
      email: 'grace.achieng@student.ktyc.ac.ke',
      phoneNumber: '+254710000004',
      idNumber: '45678901',
      cohort: '2025',
      academicYear: '2024/2025',
      session: 'SEPT_DEC' as const,
      classId: createdClasses.find(c => c.code === 'SARD(L5)/2025/S')!.id,
      programmeId: createdProgrammes.find(p => p.code === 'SARD-L5')!.id,
      departmentId: createdDepartments[2].id,
      academicStatus: 'ACTIVE' as const,
      guardianName: 'Jane Achieng',
      guardianPhone: '+254722000004',
      guardianRelation: 'Mother',
    },
    {
      admissionNumber: 'KTYC/2025/005',
      firstName: 'Michael',
      lastName: 'Kipchoge',
      gender: 'MALE' as const,
      dateOfBirth: new Date('2004-09-30'),
      nationality: 'Kenyan',
      email: 'michael.kipchoge@student.ktyc.ac.ke',
      phoneNumber: '+254710000005',
      idNumber: '56789012',
      cohort: '2025',
      academicYear: '2024/2025',
      session: 'MAY_AUGUST' as const,
      classId: createdClasses.find(c => c.code === 'DME(L6)/2025/M')!.id,
      programmeId: createdProgrammes.find(p => p.code === 'DME-L6')!.id,
      departmentId: createdDepartments[0].id,
      academicStatus: 'ACTIVE' as const,
      guardianName: 'Daniel Kipchoge',
      guardianPhone: '+254722000005',
      guardianRelation: 'Father',
    },
  ];

  for (const student of sampleStudents) {
    await prisma.student.upsert({
      where: { admissionNumber: student.admissionNumber },
      update: {},
      create: student,
    });
    console.log('✅ Student created:', student.admissionNumber, '-', student.firstName, student.lastName);
  }

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${staffUsers.length + 1} (1 admin + ${staffUsers.length} staff)`);
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Programmes: ${programmes.length}`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Students: ${sampleStudents.length}`);
  console.log('\n🔐 Default Password: admin123');
  console.log('📧 Admin Email: admin@ktyc.ac.ke\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
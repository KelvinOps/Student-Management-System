// prisma/seed-fees.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fee structure based on the 2025/2026 fee structure image
const FEE_STRUCTURE_2025_2026 = {
  voteheads: {
    tuitionFees: { term1: 12215.0, term2: 12215.0, term3: 12211.0, total: 36641.0 },
    pteEnrolments: { term1: 4293.0, term2: 4293.0, term3: 4293.0, total: 12879.0 },
    ltAndT: { term1: 1316.0, term2: 1316.0, term3: 1317.0, total: 3949.0 },
    rmi: { term1: 1085.0, term2: 1085.0, term3: 1087.0, total: 3257.0 },
    ewc: { term1: 1316.0, term2: 1316.0, term3: 1317.0, total: 3949.0 },
    activity: { term1: 1505.0, term2: 1505.0, term3: 1504.0, total: 4514.0 },
    attachmentMedical: { term1: 670.0, term2: 670.0, term3: 660.0, total: 2000.0 },
  },
  termTotals: {
    term1: 22400.0,
    term2: 22400.0,
    term3: 22389.0,
    annual: 67189.0,
  },
  additionalFees: {
    studentId: 500.0, // New students only
    kuccpsRegistration: 1500.0,
    tvetaQualityAssurance: 500.0,
    studentUnionFee: 900.0, // Annually
    admissionFee: 500.0, // Payable on admission
    assessmentTools: 3000.0, // Per Module
    materialFee: 9600.0, // Per Module
    hostelFee: 4500.0, // Optional
  },
};

async function seedFeeStructures() {
  console.log('\n💰 Seeding fee structures for 2025/2026...');

  // Get all active programmes
  const programmes = await prisma.programme.findMany({
    where: { isActive: true },
    include: { department: true },
  });

  const academicYear = '2025/2026';
  const sessions = ['SEPT_DEC', 'JAN_APRIL', 'MAY_AUGUST'];

  for (const programme of programmes) {
    for (const session of sessions) {
      // Calculate total fees for the session (sum of all 3 terms)
      const tuitionFee = FEE_STRUCTURE_2025_2026.voteheads.tuitionFees.total;
      const examFee = FEE_STRUCTURE_2025_2026.voteheads.pteEnrolments.total;
      const libraryFee = FEE_STRUCTURE_2025_2026.voteheads.ltAndT.total;
      const activityFee =
        FEE_STRUCTURE_2025_2026.voteheads.activity.total +
        FEE_STRUCTURE_2025_2026.voteheads.ewc.total +
        FEE_STRUCTURE_2025_2026.voteheads.rmi.total +
        FEE_STRUCTURE_2025_2026.voteheads.attachmentMedical.total;

      const totalFee = FEE_STRUCTURE_2025_2026.termTotals.annual;

      try {
        const feeStructure = await prisma.feeStructure.upsert({
          where: {
            programmeId_academicYear_session: {
              programmeId: programme.id,
              academicYear,
              session,
            },
          },
          update: {
            tuitionFee,
            examFee,
            libraryFee,
            activityFee,
            totalFee,
            isActive: true,
          },
          create: {
            programmeId: programme.id,
            academicYear,
            session,
            tuitionFee,
            examFee,
            libraryFee,
            activityFee,
            totalFee,
            isActive: true,
          },
        });

        console.log(
          `✅ Fee structure: ${programme.code} - ${session} - KES ${totalFee.toLocaleString()}`
        );
      } catch (error) {
        console.error(`❌ Error creating fee structure for ${programme.code} - ${session}:`, error);
      }
    }
  }

  console.log('\n✨ Fee structure seeding completed!');
}

async function seedSamplePayments() {
  console.log('\n💳 Seeding sample payments...');

  // Get active students
  const students = await prisma.student.findMany({
    where: { academicStatus: 'ACTIVE' },
    take: 5,
  });

  const paymentMethods = ['MPESA', 'CASH', 'BANK_TRANSFER'] as const;

  for (const student of students) {
    // Create 1-3 random payments for each student
    const paymentCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < paymentCount; i++) {
      const amount = Math.floor(Math.random() * 15000) + 5000; // Random amount between 5000-20000
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const transactionRef = `${paymentMethod}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      try {
        await prisma.feePayment.create({
          data: {
            studentId: student.id,
            academicYear: student.academicYear,
            session: student.session,
            amountPaid: amount,
            paymentMethod,
            transactionRef,
            status: 'COMPLETED',
            paymentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          },
        });

        console.log(
          `✅ Payment: ${student.admissionNumber} - ${paymentMethod} - KES ${amount.toLocaleString()}`
        );
      } catch (error) {
        console.error(`❌ Error creating payment for ${student.admissionNumber}:`, error);
      }
    }
  }

  console.log('\n✨ Sample payments seeding completed!');
}

async function seedSampleProcurement() {
  console.log('\n📦 Seeding sample procurement requests...');

  const departments = [
    'Engineering',
    'Information Technology',
    'Agriculture',
    'Business Management',
    'Hospitality & Tourism',
  ];

  const sampleRequests = [
    {
      department: 'Engineering',
      description: 'Purchase of welding equipment and protective gear for workshop',
      estimatedCost: 150000,
      status: 'APPROVED' as const,
    },
    {
      department: 'Information Technology',
      description: 'Procurement of 30 desktop computers for computer lab',
      estimatedCost: 900000,
      status: 'PENDING' as const,
    },
    {
      department: 'Agriculture',
      description: 'Farm tools and fertilizers for practical sessions',
      estimatedCost: 75000,
      status: 'IN_PROGRESS' as const,
    },
    {
      department: 'Business Management',
      description: 'Office furniture and stationery supplies',
      estimatedCost: 45000,
      status: 'COMPLETED' as const,
    },
    {
      department: 'Hospitality & Tourism',
      description: 'Kitchen equipment and utensils for culinary training',
      estimatedCost: 200000,
      status: 'APPROVED' as const,
    },
    {
      department: 'Engineering',
      description: 'Electrical components and testing equipment',
      estimatedCost: 120000,
      status: 'REJECTED' as const,
    },
  ];

  // Get first user to use as requestedBy
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('❌ No user found for procurement requests');
    return;
  }

  for (const request of sampleRequests) {
    const year = new Date().getFullYear();
    const count = await prisma.procurementRequest.count();
    const requestNumber = `PR/${year}/${(count + 1).toString().padStart(4, '0')}`;

    try {
      await prisma.procurementRequest.create({
        data: {
          requestNumber,
          requestedBy: user.id,
          department: request.department,
          description: request.description,
          estimatedCost: request.estimatedCost,
          status: request.status,
          ...(request.status === 'APPROVED' && {
            approvedBy: user.id,
            approvedAt: new Date(),
          }),
        },
      });

      console.log(
        `✅ Procurement: ${requestNumber} - ${request.department} - KES ${request.estimatedCost.toLocaleString()}`
      );
    } catch (error) {
      console.error(`❌ Error creating procurement request:`, error);
    }
  }

  console.log('\n✨ Sample procurement seeding completed!');
}

async function main() {
  console.log('🌱 Starting finance data seeding...');

  try {
    await seedFeeStructures();
    await seedSamplePayments();
    await seedSampleProcurement();

    console.log('\n✅ All finance data seeded successfully!');
  } catch (error) {
    console.error('❌ Error during finance seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { FEE_STRUCTURE_2025_2026 };
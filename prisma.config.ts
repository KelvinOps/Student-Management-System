// prisma.config.ts
import 'dotenv/config'

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts && tsx prisma/seed-fees.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL || '',
  }
}
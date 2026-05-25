import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Evitar múltiples instancias en desarrollo debido a Fast Refresh
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

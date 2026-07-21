import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";



const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a Prisma client backed by the PostgreSQL adapter.
 *
 * @throws {Error} When `DATABASE_URL` is not set.
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}


/** Singleton Prisma client; reused in development to avoid hot-reload connection leaks. */

// Next.js dev me hot reload hota hai — file badalte hi module dobara execute hota hai. Har baar naya PrismaClient banega → har client apna connection pool kholega → kuch edits ke baad Postgres too many connections se mar jayega. Global par cache karne se hot reload ke baad bhi wahi purana client milta hai.

// Production me ye caching jaan-bujh kar nahi ki jaati, kyunki wahan module ek hi baar load hota hai — global pollute karne ka koi fayda nahi.


export const prisma = globalForPrisma.prisma ?? createPrismaClient();


if(process.env.NODE_ENV !== "production"){
    globalForPrisma.prisma = prisma;
}
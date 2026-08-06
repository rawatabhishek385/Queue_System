import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL ERROR: DATABASE_URL is missing in Vercel Environment Variables!");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;

const defaultSettings = {
  companyName: 'My Company',
  logoUrl: '',
  primaryColor: '#3b82f6',
  backgroundColor: '#f8fafc',
  textColor: '#0f172a',
  scrollingText: 'Welcome to our queue! Please wait for your number to be called. Thank you for your patience.',
  totalCounters: 5,
};

export async function getQueueData(companyId) {
  // Ensure company exists
  let company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { settings: true }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        id: companyId,
        settings: { create: defaultSettings }
      },
      include: { settings: true }
    });
  } else if (!company.settings) {
    company = await prisma.company.update({
      where: { id: companyId },
      data: { settings: { create: defaultSettings } },
      include: { settings: true }
    });
  }

  // Fetch tickets
  const waitingTickets = await prisma.ticket.findMany({
    where: { companyId, status: 'WAITING' },
    orderBy: { createdAt: 'asc' }
  });

  const calledTickets = await prisma.ticket.findMany({
    where: { companyId, status: 'CALLED' },
    orderBy: { createdAt: 'desc' }
  });

  const historyTickets = await prisma.ticket.findMany({
    where: { companyId, status: { in: ['CALLED', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const missedTickets = await prisma.ticket.findMany({
    where: { companyId, status: 'MISSED' },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  // Reconstruct activeCounters
  const activeCounters = {};
  let currentCustomer = null;
  let currentCounter = '';
  
  if (calledTickets.length > 0) {
    // The most recently called ticket overall
    currentCustomer = {
      ticket: calledTickets[0].ticketNumber,
      name: calledTickets[0].name,
      phone: calledTickets[0].phone,
      email: calledTickets[0].email,
      timestamp: Number(calledTickets[0].createdAt)
    };
    currentCounter = calledTickets[0].counter || '';
    
    // Populate activeCounters with the latest ticket for each counter
    for (const t of calledTickets) {
      if (t.counter && !activeCounters[t.counter]) {
        activeCounters[t.counter] = {
          ticket: t.ticketNumber,
          customer: {
            ticket: t.ticketNumber,
            name: t.name,
            phone: t.phone,
            email: t.email,
            timestamp: Number(t.createdAt)
          },
          timestamp: Number(t.createdAt)
        };
      }
    }
  }

  return {
    currentTicket: company.currentTicket,
    lastGeneratedTicket: company.lastGeneratedTicket,
    lastCallTime: Number(company.lastCallTime),
    history: historyTickets.map(t => ({ ticket: t.ticketNumber, counter: t.counter, customer: { name: t.name, phone: t.phone, email: t.email } })),
    missed: missedTickets.map(t => ({ ticket: t.ticketNumber, counter: t.counter, timestamp: Number(t.createdAt) })),
    waitingList: waitingTickets.map(t => ({
      ticket: t.ticketNumber,
      name: t.name,
      phone: t.phone,
      email: t.email,
      timestamp: Number(t.createdAt)
    })),
    currentCustomer,
    currentCounter,
    activeCounters,
    settings: {
      companyName: company.settings.companyName,
      logoUrl: company.settings.logoUrl,
      primaryColor: company.settings.primaryColor,
      backgroundColor: company.settings.backgroundColor,
      textColor: company.settings.textColor,
      scrollingText: company.settings.scrollingText,
      totalCounters: company.settings.totalCounters,
    }
  };
}

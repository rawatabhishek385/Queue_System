import { getQueueData, prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { companyId } = await params;
  const data = await getQueueData(companyId);
  return Response.json(data);
}

export async function POST(request, { params }) {
  const { companyId } = await params;
  const body = await request.json();
  const { action, payload } = body;
  
  // Ensure company exists
  let company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        id: companyId,
        settings: { create: {} }
      }
    });
  }

  if (action === 'call_next') {
    const counterId = payload?.counterNumber || '';
    
    // Mark previous ticket at this counter as completed
    if (counterId) {
      await prisma.ticket.updateMany({
        where: { companyId, counter: counterId, status: 'CALLED' },
        data: { status: 'COMPLETED' }
      });
    }

    const nextCustomer = await prisma.ticket.findFirst({
      where: { companyId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' }
    });
    
    if (nextCustomer) {
      await prisma.ticket.update({
        where: { id: nextCustomer.id },
        data: { status: 'CALLED', counter: counterId, createdAt: Date.now() }
      });
      await prisma.company.update({
        where: { id: companyId },
        data: { currentTicket: nextCustomer.ticketNumber, lastCallTime: Date.now() }
      });
    } else {
      const nextTicket = Math.max(company.lastGeneratedTicket, company.currentTicket) + 1;
      await prisma.company.update({
        where: { id: companyId },
        data: {
          lastGeneratedTicket: nextTicket,
          currentTicket: nextTicket,
          lastCallTime: Date.now()
        }
      });
      await prisma.ticket.create({
        data: {
          companyId,
          ticketNumber: nextTicket,
          status: 'CALLED',
          counter: counterId,
          createdAt: Date.now()
        }
      });
    }
  } else if (action === 'recall') {
    const counterId = payload?.counterNumber || '';
    // Flash the display by updating lastCallTime
    await prisma.company.update({
      where: { id: companyId },
      data: { lastCallTime: Date.now() }
    });
    if (counterId) {
       // Also bump the timestamp of the ticket so it appears newest
       await prisma.ticket.updateMany({
         where: { companyId, counter: counterId, status: 'CALLED' },
         data: { createdAt: Date.now() }
       });
    }
  } else if (action === 'override') {
    const overrideNumber = parseInt(payload.ticketNumber, 10);
    const counterId = payload?.counterNumber || '';
    if (!isNaN(overrideNumber)) {
      if (counterId) {
        await prisma.ticket.updateMany({
          where: { companyId, counter: counterId, status: 'CALLED' },
          data: { status: 'COMPLETED' }
        });
      }
      await prisma.ticket.create({
        data: {
          companyId,
          ticketNumber: overrideNumber,
          status: 'CALLED',
          counter: counterId,
          createdAt: Date.now()
        }
      });
      await prisma.company.update({
        where: { id: companyId },
        data: {
          currentTicket: overrideNumber,
          lastGeneratedTicket: Math.max(company.lastGeneratedTicket, overrideNumber),
          lastCallTime: Date.now()
        }
      });
    }
  } else if (action === 'mark_missed') {
    const counterId = payload?.counterNumber || '';
    if (counterId) {
      await prisma.ticket.updateMany({
        where: { companyId, counter: counterId, status: 'CALLED' },
        data: { status: 'MISSED', createdAt: Date.now() }
      });
    } else {
      // If no counter, mark all CALLED as missed? 
      // Safe fallback to just mark the current global ticket as missed
      if (company.currentTicket > 0) {
        await prisma.ticket.updateMany({
          where: { companyId, ticketNumber: company.currentTicket, status: 'CALLED' },
          data: { status: 'MISSED', createdAt: Date.now() }
        });
      }
    }
  } else if (action === 'remove_missed') {
    if (payload?.ticketNumber) {
      const tn = parseInt(payload.ticketNumber, 10);
      await prisma.ticket.deleteMany({
        where: { companyId, ticketNumber: tn, status: 'MISSED' }
      });
    }
  } else if (action === 'generate_token') {
    const { name, phone, email } = payload || {};
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { lastGeneratedTicket: { increment: 1 } }
    });
    await prisma.ticket.create({
      data: {
        companyId,
        ticketNumber: updated.lastGeneratedTicket,
        name: name || null,
        phone: phone || null,
        email: email || null,
        createdAt: Date.now()
      }
    });
  } else if (action === 'reset') {
    await prisma.ticket.deleteMany({ where: { companyId } });
    await prisma.company.update({
      where: { id: companyId },
      data: {
        currentTicket: 0,
        lastGeneratedTicket: 0,
        lastCallTime: Date.now()
      }
    });
  } else if (action === 'update_settings') {
    const totalCounters = parseInt(payload.totalCounters, 10);
    await prisma.settings.update({
      where: { companyId },
      data: {
        companyName: payload.companyName,
        logoUrl: payload.logoUrl,
        primaryColor: payload.primaryColor,
        backgroundColor: payload.backgroundColor,
        textColor: payload.textColor,
        scrollingText: payload.scrollingText,
        totalCounters: isNaN(totalCounters) ? 5 : totalCounters
      }
    });
  }
  
  const savedData = await getQueueData(companyId);
  return Response.json(savedData);
}

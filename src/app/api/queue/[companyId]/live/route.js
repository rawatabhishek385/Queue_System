import { getQueueData, queueEmitter } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { companyId } = await params;

  let streamClosed = false;
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial payload right away
      try {
        const initialData = await getQueueData(companyId);
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      } catch (err) {
        console.error("Error reading initial queue data", err);
      }

      // Memory Event Listener (0 database polling!)
      const listener = (data) => {
        if (streamClosed) return;
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Subscribe to this company's update events
      const eventName = `update-${companyId}`;
      queueEmitter.on(eventName, listener);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        streamClosed = true;
        queueEmitter.off(eventName, listener);
      });
    },
    cancel() {
      streamClosed = true;
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

import { getQueueData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { companyId } = await params;

  let streamClosed = false;
  
  const stream = new ReadableStream({
    async start(controller) {
      let previousDataString = '';

      // Send an initial payload right away
      try {
        const initialData = await getQueueData(companyId);
        previousDataString = JSON.stringify(initialData);
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${previousDataString}\n\n`));
      } catch (err) {
        console.error("Error reading initial queue data", err);
      }

      // Check for updates every 500ms
      const intervalId = setInterval(async () => {
        if (streamClosed) {
          clearInterval(intervalId);
          return;
        }

        try {
          const currentData = await getQueueData(companyId);
          const currentDataString = JSON.stringify(currentData);

          // Only send data to client if it actually changed
          if (currentDataString !== previousDataString) {
            previousDataString = currentDataString;
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${currentDataString}\n\n`));
          }
        } catch (error) {
          console.error("Error fetching live data", error);
        }
      }, 500);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        streamClosed = true;
        clearInterval(intervalId);
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

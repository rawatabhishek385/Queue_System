# Real-Time Queue Management System

A highly responsive, real-time queue management system built with Next.js 16, React 19, and Prisma. This system features an Admin Panel for queue operators, a Customer Kiosk for ticket generation, and a TV Display Board that updates instantly with zero-latency Server-Sent Events (SSE).

## 🚀 Features

- **Real-Time TV Display**: A visually stunning TV display board that instantly shows active counters, current tickets, and missed tickets without polling.
- **Admin Control Panel**: Manage multiple counters, call tickets (next or override), recall customers, and mark tickets as missed.
- **Customer Kiosk**: A self-service portal for customers to generate their queue tokens.
- **Customizable Settings**: Dynamically update company name, logo, primary/background colors, and scrolling ticker text directly from the Admin panel.
- **Zero-Latency SSE**: Uses Server-Sent Events coupled with an in-memory Node.js `EventEmitter` for instantaneous display updates without database polling.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Frontend**: React 19, Vanilla CSS Modules
- **Database**: PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Real-time Engine**: Server-Sent Events (SSE)

## 📁 Architecture & Project Structure

The codebase is organized into modular Next.js routes within `src/app/`:

- `/admin/[companyId]`: The operator dashboard for calling tickets and updating queue states.
- `/display/[companyId]`: The public-facing scoreboard designed for large TV screens.
- `/kiosk/[companyId]`: Self-service portal for ticket generation.
- `/portal`: Landing page for onboarding multiple companies/branches.
- `/api/queue/[companyId]`: RESTful API endpoints for CRUD operations.
- `/api/queue/[companyId]/live`: SSE streaming endpoint for real-time display updates.

## 🗄️ Database Schema

The system uses Prisma to interact with a PostgreSQL database. 

1. **Company**: Represents a branch or organization. Tracks the `currentTicket` and `lastGeneratedTicket` globally.
2. **Settings**: Belongs to a Company. Stores UI customizations like `totalCounters`, colors, and `scrollingText`.
3. **Ticket**: Represents a customer in the queue. 
   - **Statuses**: `WAITING` (In queue), `CALLED` (Currently at a counter), `COMPLETED` (Served), `MISSED` (Customer did not show up).

## ⚡ Real-Time SSE System

Unlike traditional polling (which hammers the database and has built-in delay), this project uses **Server-Sent Events (SSE)**. 
When an action occurs (e.g., calling a ticket via `/api/queue/[companyId]/route.js`), an event is emitted through a global Node.js `EventEmitter` (`queueEmitter`). The `/live` endpoint instantly pushes this event to the browser, which updates the TV display in `< 10ms`.

## ⚙️ Local Development Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/queue_db"
   ```

3. **Database Migration**:
   Push the schema to your database:
   ```bash
   npx prisma db push
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## 🌍 Deployment Guide (Render)

This application is designed to be easily deployed to a Node.js environment like **Render**.

### Deployment Steps:
1. Connect your GitHub repository to a new Render **Web Service**.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. Add your `DATABASE_URL` to the Environment Variables.

### Important Note on Vercel vs Render:
Because this application relies on a persistent in-memory `EventEmitter` for zero-latency SSE updates, it is **highly recommended** to deploy on a stateful platform like **Render** rather than a Serverless platform like Vercel. Serverless functions spin down and do not share memory across instances, which breaks the local event emitter pattern. Render guarantees that the API and the Event Emitter run in the same persistent Node.js process.

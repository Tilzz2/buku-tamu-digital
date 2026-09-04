# Buku Tamu Digital

A digital guest book and check-in system for an office reception desk. It runs locally on a LAN and does not require external internet access or third-party APIs for its core functions.

Visitors check in via a kiosk interface (tablet or monitor). When a visitor selects the staff member they intend to meet, the system sends a real-time notification to that staff member's browser. It includes an admin dashboard for the front desk to monitor visits, handle escalations, and manage a visitor watchlist.

## Stack

- Astro (SSR mode using the `@astrojs/node` adapter)
- SQLite (via `sql.js`)
- Vanilla CSS (no CSS frameworks)

## Setup

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Tilzz2/buku-tamu-digital.git
   cd buku-tamu-digital
   npm install
   ```

2. Initialize the database and populate it with seed data:
   ```bash
   npm run db:seed
   ```
   This creates the SQLite database in `data/guestbook.db` and sets up a default admin account (`admin` / `admin123`) along with some sample staff members.

3. Start the server:
   ```bash
   npm run dev
   ```
   By default, it listens on `0.0.0.0:4321` so it can be accessed by other devices on the local network.

## Usage

- **Kiosk Interface**: Accessible at `http://<server-ip>:4321/checkin`. This is the form visitors see when they arrive.
- **Admin Dashboard**: Accessible at `http://<server-ip>:4321/admin`. Requires login. Handles visitor logs, CSV exports, staff management, and watchlist settings.
- **Staff Notifications**: Each staff member has a dedicated URL (`/staff/[id]`) that they keep open in their browser. It uses Server-Sent Events (SSE) to receive real-time alerts when a visitor arrives, triggering a browser notification and sound without relying on external services like WhatsApp or email.

## State

The core features are built and functional:
- Visitor check-in form with QR code generation for returning visitors
- Real-time staff notifications via SSE and the browser Web Notifications API
- Automatic escalation to the admin dashboard if a staff member doesn't acknowledge a notification within 5 minutes
- Admin authentication and session management
- Dashboard for viewing visits, managing staff, and configuring the visitor watchlist
- Statistics and reporting charts
- Local database backup script (`npm run db:backup`)

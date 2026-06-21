# BloodHero: Real-Time Blood Donation & SOS Network

BloodHero is a real-time, event-driven platform designed to connect potential blood donors and recipients. It minimizes communication delays in critical situations by utilizing live geolocation compatibility matches, instant direct messaging, and interactive donor booking systems.

The codebase is structured as a decoupled monorepo:
1. **Backend**: Go (Golang) REST API & WebSocket server.
2. **Web Frontend**: Next.js (React) application.
3. **Mobile Client**: React Native (Expo) app.

---

## Key Features

1. **SOS Emergency Broadcasting**: Recipients can request blood matching compatible groups. The backend automatically calculates donor proximity using the Haversine distance formula.
2. **Digital Donor Card**: Mobile users present a verified digital card with a mock QR grid that clinics scan to instantly retrieve profile details and write donation logs.
3. **Smart Compatibility Matching**: Automatic filtering of donors based on red blood cell biological compatibility charts (e.g., O- universal donor, AB+ universal recipient).
4. **Appointment Booking & Scheduling**: Donors can book, view, and cancel slots for specific donation drives or hospitals.
5. **Gamification & Rewards**: Logged donations earn XP points. Accumulating points unlocks Bronze, Silver, Gold, or Platinum badges, allowing users to generate printable reward certificates (SVG).
6. **Real-time Live Chat**: Built using persistent TCP sockets (WebSockets) in Go and browser listeners, permitting instant communication without API polling overhead.

---

## Monorepo Directory Layout

```text
blood-donation-system/
├── backend/            # Go Backend REST & WebSocket Server
│   ├── cmd/            # Server entrypoint (main.go)
│   └── internal/       # Database config, models, handlers, and WS hubs
├── frontend/           # Next.js TypeScript Web App
│   ├── src/app/        # App Router client views (dashboard, bookings, chat, etc.)
│   └── src/lib/        # API wrapper library (api.ts)
└── mobile/             # React Native Expo Mobile App
    └── src/app/        # Tab navigator screens (SOS feed, Digital Card)
```

---

## Quick Start Guide

### 1. Pre-requisites
* Go (1.20+) installed.
* Node.js & npm installed (configured in WSL for frontend/mobile).
* A running **PostgreSQL** server instance.

---

### 2. Launch the Backend
1. Go to the `backend/` directory.
2. Copy `.env.example` to `.env` and fill in your PostgreSQL credentials and JWT secret:
   ```bash
   cp .env.example .env
   ```
3. Run the Go compiler:
   ```bash
   go run cmd/main.go
   ```
The backend initializes the connection, automatically runs migrations to build tables, and starts listening on port `8080`.

---

### 3. Launch the Web Client (Next.js)
Open your WSL terminal and execute:
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
Open `http://localhost:3000` in your web browser.

---

### 4. Launch the Mobile Client (React Native)
Open your WSL terminal and execute:
1. Navigate to the `mobile/` directory:
   ```bash
   cd mobile
   ```
2. Launch the Expo developer server:
   ```bash
   npm run start
   ```
Press `a` to boot Android Emulator, `i` for iOS Simulator, or scan the terminal QR code using the Expo Go mobile app to preview the application on a physical device.

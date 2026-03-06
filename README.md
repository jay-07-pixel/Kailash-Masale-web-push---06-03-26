# Kailash Masale Dashboard

A modern React.js dashboard UI built with Vite for Kailash Masale business management.

## Features

- **Sidebar Navigation** - Fixed sidebar with navigation menu and user profile
- **Dashboard Overview** - Key performance indicators (KPIs) cards
- **Charts** - Order volume trends (line chart) and task distribution (pie chart)
- **Employee Attendance** - Real-time check-in/out history table
- **Recent Orders** - Distributor orders management table
- **Pending Tasks** - Task tracking with ongoing/resolved tabs

## Tech Stack

- React.js 19
- Vite 7
- Recharts (for data visualization)
- CSS3 (custom styling)

## Getting Started

### Installation

```bash
npm install
```

### Environment variables

Create a `.env` file from the example (never commit `.env`):

```bash
cp .env.example .env
```

Fill in your Firebase values from [Firebase Console](https://console.firebase.google.com) → Project settings → Your apps.  
For **deploy** (Vercel, Netlify, etc.), set the same variables in the host’s dashboard — do not put real keys in the repo.

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Header.jsx           # Top header with search
│   ├── OverviewCards.jsx    # KPI cards
│   ├── Charts.jsx           # Line and pie charts
│   ├── EmployeeAttendance.jsx  # Attendance table
│   ├── RecentOrders.jsx     # Orders table
│   └── PendingTasks.jsx     # Tasks grid
├── App.jsx                  # Main app component
├── main.jsx                 # Entry point
└── index.css               # Global styles
```

## Components

All components are modular and self-contained with their own CSS files. The design follows a dark-themed sidebar with light content areas, matching modern dashboard UI patterns.

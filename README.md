# InnoVentory 📦

A modern, production-ready full-stack Inventory Management System built with the MERN stack (MongoDB, Express, React, Node.js) and Tailwind CSS.

## Features ✨
- **Role-Based Authentication**: Secure login with JWT (Admin, Manager, Staff).
- **Dashboard Analytics**: Real-time insights with interactive charts (Chart.js).
- **Product Management**: Track products, categories, cost, price, and stock levels.
- **Stock Alerts**: Automated low-stock indicators.
- **Orders & Operations**: Manage Purchase Orders (suppliers) and Sales Orders (customers).
- **Reporting**: Export inventory and sales reports to PDF and Excel.
- **Responsive UI**: Beautiful dark-themed interface built with Tailwind CSS.

## Tech Stack 🛠️
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS, Chart.js, Axios, React Hot Toast
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, JWT, bcryptjs, PDFKit, ExcelJS
- **Deployment**: Docker, Docker Compose

## Quick Start (Docker) 🐳
The easiest way to run the application is using Docker Compose.

1. Create a `.env` file in the `server` directory (copy from `.env.example`).
2. Run the application:
   ```bash
   docker-compose up --build -d
   ```
3. Access the app at `http://localhost:5173` (or port `80` depending on your mapping).

## Local Development (Manual) 💻

### 1. Backend Setup
```bash
cd server
npm install
# Ensure MongoDB is running locally
npm run seed # (Optional) Seed the database with demo data
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Demo Credentials
If you ran `npm run seed`, you can log in with:
- **Admin**: admin@innoventory.com / admin123
- **Manager**: manager@innoventory.com / manager123
- **Staff**: staff@innoventory.com / staff123

## Architecture Highlights
- **Rate Limiting & Helmet**: Built-in security protections on the API.
- **Express Validator**: Robust request body validation.
- **Transactions**: Inventory quantity automatically updates when purchase/sales orders change status.
- **Mongoose Virtuals**: Computed properties for profit margins and stock status.

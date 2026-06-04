# 🏨 Hotel Chain Booking System

Hệ thống quản lý đặt phòng chuỗi khách sạn — fullstack MERN.

## ⚙️ Tech stack

| Layer    | Stack                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | Node.js, Express, MongoDB (Mongoose), JWT, Stripe, Socket.io, Cloudinary, Nodemailer, PDFKit, XLSX, Winston                                  |
| Frontend | React 18 + Vite, React Router v6, Redux Toolkit + RTK Query, Tailwind CSS, Headless UI, Stripe Elements, Recharts, Leaflet, Socket.io client |

## 📁 Structure

```
hotel/
├── server/        # Express REST API + Socket.io
└── client/        # Vite + React + Redux Toolkit
```

## 🚀 Quickstart

### 1) Server

```powershell
cd server
copy .env.example .env       # then fill secrets
npm install
npm run seed                 # populate sample data (5 hotels, 20 rooms, 10 users, 30 bookings)
npm run dev                  # starts on http://localhost:5000
```

### 2) Client

```powershell
cd client
copy .env.example .env       # set VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev                  # opens http://localhost:5173
```

## 👥 Sample accounts (after `npm run seed`)

| Role     | Email                 | Password      |
| -------- | --------------------- | ------------- |
| Admin    | `admin@hotel.dev`     | `admin123`    |
| Manager  | `manager@hotel.dev`   | `manager123`  |
| Staff    | `staff@hotel.dev`     | `staff123`    |
| Customer | `customer1@hotel.dev` | `customer123` |

## 💳 Stripe testing

Use card `4242 4242 4242 4242`, any future expiry, any CVC.
Configure webhook locally with the Stripe CLI:

```powershell
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

## 🔌 Key endpoints (`/api/v1`)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token`
- `GET  /hotels`, `GET /hotels/:slug`, `GET /hotels/:id/rooms?checkIn=&checkOut=`
- `GET  /rooms/available?hotelId&checkIn&checkOut`
- `POST /bookings` (transactional availability check)
- `POST /payments/create-intent`, `POST /payments/confirm`, `POST /payments/webhook`
- `POST /reviews`, `PUT /reviews/:id/respond`
- `GET  /admin/dashboard`, `GET /admin/analytics/revenue?period=month`
- `GET  /admin/reports/export?type=excel`

## 🌟 Highlights

- **Race-condition-safe booking**: MongoDB transaction + overlap query in `services/availabilityService.js`.
- **Dynamic pricing engine**: weekend + seasonal overrides per room.
- **Realtime notifications**: Socket.io rooms `user:<id>`, `staff_room`, `admin_room`, `hotel:<id>`.
- **PDF invoices**: streamed with PDFKit at `GET /bookings/:id/invoice`.
- **Excel export**: `GET /admin/reports/export?type=excel`.
- **Code splitting**: lazy-loaded routes for fast TTI.
- **Security**: Helmet, HPP, XSS-clean, Mongo-sanitize, rate limiting, bcrypt 12 rounds, JWT access + refresh cookie.

## 🧪 Notes

- Transactions require MongoDB replica-set. The booking controller gracefully falls back to non-txn mode if you run a standalone instance.
- If Cloudinary creds are empty, image upload falls back to memory storage — UI works but URLs won't be persisted.
- If SMTP creds are empty, emails are logged to console only.

---

© 2026 Hotel Booking System

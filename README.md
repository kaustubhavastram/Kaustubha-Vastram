# Kaustubha Vastram — React E-Commerce Application

> A premium dress shop built with React, Supabase, and Razorpay.

![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green) ![Razorpay](https://img.shields.io/badge/Razorpay-Payments-orange)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Razorpay Setup](#razorpay-setup)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Features](#features)
- [Admin Panel](#admin-panel)
- [Authentication Flow](#authentication-flow)
- [Payment Flow](#payment-flow)
- [Deployment](#deployment)

---

## Overview

**Kaustubha Vastram** is a luxury dress e-commerce application featuring:

- A beautiful storefront with product browsing, filtering, and cart management
- User authentication via Supabase (email/password)
- Real payment processing via Razorpay
- A full admin dashboard for managing products, orders, and payments

The application was converted from a static HTML/CSS/JS site into a modern React SPA with real backend capabilities.

---

## Tech Stack

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| **React 19**       | UI framework                       |
| **Vite 6**         | Build tool and dev server          |
| **React Router 7** | Client-side routing                |
| **Supabase**       | Authentication, database, and RLS  |
| **Razorpay**       | Payment gateway                    |
| **Vanilla CSS**    | Styling (no utility frameworks)    |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   React App                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ AuthCtx  │  │ CartCtx  │  │  Router   │ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼─────┐ │
│  │              Pages & Components         │ │
│  │  Home | Checkout | Admin (Dashboard,   │ │
│  │  Orders, Products, ProductForm)        │ │
│  └────────────────┬───────────────────────┘ │
└───────────────────┼─────────────────────────┘
                    │
       ┌────────────▼────────────┐
       │       Supabase          │
       │  ┌─────┐  ┌──────────┐ │
       │  │Auth │  │PostgreSQL│ │
       │  └─────┘  │(profiles │ │
       │           │ products │ │
       │           │ orders   │ │
       │           │ items)   │ │
       │           └──────────┘ │
       └────────────┬───────────┘
                    │
       ┌────────────▼────────────┐
       │      Razorpay API       │
       │   (Payment Processing)  │
       └─────────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project ([supabase.com](https://supabase.com))
- A **Razorpay** account ([razorpay.com](https://razorpay.com))

### Installation

```bash
# Clone or navigate to the project
cd dress-shop

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Fill in your credentials in .env (see below)
```

---

## Environment Variables

Create a `.env` file in the project root with:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Razorpay
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
```

| Variable                  | Description                                  | Required |
| ------------------------- | -------------------------------------------- | -------- |
| `VITE_SUPABASE_URL`       | Your Supabase project URL                    | Yes      |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anon/public API key                 | Yes      |
| `VITE_RAZORPAY_KEY_ID`    | Razorpay Key ID (test or live)               | Yes*     |

> \* If Razorpay keys are missing, the app falls back to simulated payments for development.

---

## Supabase Setup

### 1. Create a Project

Go to [supabase.com](https://supabase.com) and create a new project. Note your **Project URL** and **Anon Key** from Settings → API.

### 2. Run the Migration

Execute the SQL in `supabase/migrations/001_initial_schema.sql` in the **Supabase SQL Editor**:

This creates:

| Table          | Description                              |
| -------------- | ---------------------------------------- |
| `profiles`     | User profiles with `role` field          |
| `products`     | Product catalog with availability        |
| `orders`       | Order records with payment status        |
| `order_items`  | Individual items within each order       |

It also:
- Sets up **Row Level Security (RLS)** policies
- Creates a trigger to auto-create profiles on user signup
- Seeds the database with 8 initial products
- Adds `updated_at` auto-update triggers

### 3. Create an Admin User

1. Sign up through the app normally
2. In the Supabase dashboard, go to **Table Editor → profiles**
3. Find your user and change `role` from `user` to `admin`

Alternatively, run this SQL:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

---

## Razorpay Setup

### 1. Get API Keys

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys**
3. Generate **Test Keys** for development
4. Copy the **Key ID** (starts with `rzp_test_`)

### 2. Configure

Add your Key ID to `.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
```

### Test Card Details

For testing payments, use:

- **Card:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits

---

## Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server starts at `http://localhost:5173`.

---

## Project Structure

```
dress-shop/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.jsx        # Login/signup modal
│   │   │   └── ProtectedRoute.jsx   # Route guard
│   │   ├── cart/
│   │   │   ├── CartDrawer.jsx       # Slide-in cart panel
│   │   │   └── CartItem.jsx         # Individual cart item
│   │   ├── layout/
│   │   │   ├── AnnouncementBar.jsx  # Top banner
│   │   │   ├── Footer.jsx           # Site footer
│   │   │   ├── Header.jsx           # Navigation header
│   │   │   ├── Hero.jsx             # Hero section
│   │   │   ├── Lookbook.jsx         # Image grid
│   │   │   ├── Marquee.jsx          # Scrolling text
│   │   │   ├── Newsletter.jsx       # Email signup
│   │   │   └── Story.jsx            # Brand story
│   │   └── product/
│   │       ├── Filters.jsx          # Category filters
│   │       ├── ProductCard.jsx      # Product display card
│   │       └── ProductGrid.jsx      # Grid with Supabase fetch
│   ├── context/
│   │   ├── AuthContext.jsx          # Authentication state
│   │   └── CartContext.jsx          # Cart state + localStorage
│   ├── lib/
│   │   ├── constants.js             # Product data, categories
│   │   ├── razorpay.js              # Razorpay SDK helper
│   │   └── supabase.js              # Supabase client init
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminLayout.jsx      # Sidebar + outlet
│   │   │   ├── Dashboard.jsx        # Stats overview
│   │   │   ├── Orders.jsx           # Order management
│   │   │   ├── ProductForm.jsx      # Create/edit product
│   │   │   └── Products.jsx         # Product list
│   │   ├── Checkout.jsx             # Payment page
│   │   └── Home.jsx                 # Main storefront
│   ├── styles/
│   │   ├── admin.css                # Admin panel styles
│   │   ├── auth.css                 # Auth modal styles
│   │   └── index.css                # Main storefront styles
│   ├── App.jsx                      # Root component + routes
│   └── main.jsx                     # Entry point
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema
├── .env.example                     # Environment template
├── index.html                       # HTML entry
├── package.json                     # Dependencies
├── vite.config.js                   # Vite config
└── README.md                        # This file
```

---

## Features

### Storefront

- **Hero Section** — Eye-catching banner with animated badge
- **Product Grid** — Fetches from Supabase with category filtering
- **Cart Drawer** — Slide-in panel with quantity controls
- **Responsive Design** — Mobile-first with hamburger menu
- **Scroll Animations** — Reveal-on-scroll effects
- **Newsletter Signup** — Email collection form
- **Image Fallbacks** — Graceful degradation for broken images

### Cart

- Add/remove items with instant UI feedback
- Quantity adjustment (+/−)
- Persistent via localStorage (survives page refresh)
- Subtotal calculation
- Smooth slide-in drawer animation

### Checkout

- Order summary with item details
- Shipping cost calculation (free over $150)
- Razorpay payment integration
- Auth-gated (must sign in to pay)
- Order recorded in Supabase on payment

---

## Admin Panel

Access the admin panel at `/admin` (requires admin role).

### Dashboard
- Total orders, revenue, product count, paid orders
- Recent orders list

### Orders Management
- View all orders with customer info
- Filter by status (pending, paid, failed, shipped, delivered, cancelled)
- Click to expand and see order items
- Update order status via dropdown

### Products Management
- View all products in a table
- **Add** new products with the form
- **Edit** existing product details
- **Delete** products with confirmation
- **Toggle availability** inline (switch control)
- Image preview on form

---

## Authentication Flow

```
User clicks "Sign In" → Auth Modal opens
  ├── Sign Up: email + password + name → Supabase creates user
  │   └── Trigger auto-creates profile (role: 'user')
  └── Sign In: email + password → Session stored in browser
      └── onAuthStateChange listener updates React context

Checkout requires auth → Modal prompts if not signed in
Admin routes check role → Redirect to home if not admin
```

---

## Payment Flow

```
1. User adds items to cart
2. Clicks "Checkout" → /checkout page
3. Clicks "Pay" →
   a. Order created in Supabase (status: 'pending')
   b. Order items inserted
   c. Razorpay modal opens
4. On success →
   a. Order updated (status: 'paid', payment_id stored)
   b. Cart cleared
   c. Success screen shown
5. On dismiss →
   a. Order updated (status: 'failed')
   b. Error message shown
```

---

## Deployment

Since this application is **full-stack** (Vite + React frontend and an Express Node.js backend for Razorpay integration), it needs to be hosted where both parts can run.

### Option 1: Render (Recommended — Simplest Full-Stack Deployment)

You can host both the frontend and backend together on **Render** (free/low-cost tier). Since our Express server (`server.js`) is configured to serve the built React files from the `dist/` directory, Render can build the React app and then run the Express server to serve everything on a single domain.

1. **Push your code to GitHub/GitLab**.
2. **Create a Render Account**: Sign up at [render.com](https://render.com).
3. **Create a New Web Service**:
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository.
4. **Configure the Web Service Settings**:
   - **Name**: `kaustubha-vastram` (or any name)
   - **Language**: `Node`
   - **Branch**: `main` (or your active development branch)
   - **Build Command**: `npm install && npm run build` (This installs dependencies and compiles the React app into the `dist/` folder)
   - **Start Command**: `npm run start` (Runs `node server.js` which serves both the API and the React files)
5. **Add Environment Variables**:
   Click on the **Environment** tab and add the following:
   - `PORT`: `10000` (Render binds this automatically, but you can define it)
   - `VITE_SUPABASE_URL`: (Your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase anon API key)
   - `VITE_RAZORPAY_KEY_ID`: (Your Razorpay test/live Key ID)
   - `RAZORPAY_KEY_SECRET`: (Your Razorpay test/live Key Secret - *Keep this secret, never prefix with VITE_*)
6. **Deploy**: Click **Create Web Service**. Render will build the app and deploy it. Once complete, you will receive a URL (e.g. `https://kaustubha-vastram.onrender.com`).

---

### Option 2: Split Deployments (Vercel Frontend + Render Backend)

If you prefer Vercel's fast CDN edge for your React frontend, you can deploy them separately.

#### Part A: Backend on Render (Web Service)
1. In Render, create a **Web Service** connecting to your repository.
2. **Build Command**: `npm install`
3. **Start Command**: `npm run start` (or `node server.js`)
4. **Environment Variables**:
   - `RAZORPAY_KEY_SECRET`: (Your Razorpay Key Secret)
   - `VITE_RAZORPAY_KEY_ID`: (Your Razorpay Key ID)
   - `PORT`: (Render will set this automatically)
5. Copy your deployed backend URL (e.g., `https://kaustubha-vastram-api.onrender.com`).

#### Part B: Frontend on Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New → Project**.
2. Import your GitHub repository.
3. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `dress-shop`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`: (Your Supabase project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase anon API key)
   - `VITE_RAZORPAY_KEY_ID`: (Your Razorpay Key ID)
5. **Proxy Setup**:
   Since the frontend code makes API requests to `/api/*`, you need to configure a rewrite in Vercel to route `/api/*` to your Render backend URL. Create a `vercel.json` file in the root of your frontend folder:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-backend-url.onrender.com/api/$1" }
     ]
   }
   ```
6. Click **Deploy**.

---

## License

© 2026 Kaustubha Vastram — All rights reserved.

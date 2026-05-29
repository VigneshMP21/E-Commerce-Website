# ECW Shop - Premium E-Commerce Platform

A modern, production-ready full-stack e-commerce platform built with React, Node.js, Express, and MySQL.

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS 3** for styling
- **React Router v6** for routing
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **React Icons** for iconography
- **Axios** for HTTP requests
- **Context API** for state management

### Backend
- **Node.js** with Express
- **MySQL** with mysql2 (prepared statements)
- **JWT** authentication with refresh tokens
- **bcryptjs** for password hashing
- **Stripe** payment integration
- **Nodemailer** for emails
- **Helmet** for security headers
- **express-rate-limit** for rate limiting
- **express-validator** for input validation
- **Multer** for file uploads

## Features

### Authentication & Security
- User registration/login with JWT
- Google OAuth support
- Password reset via email
- Role-based access (User/Admin)
- Rate limiting, Helmet, XSS protection

### Product Management
- CRUD operations (Admin)
- Multiple product images with gallery
- Product variants (size, color)
- Categories & subcategories
- Inventory management with low-stock alerts
- Featured products & deals
- Discount/compare price system

### Shopping Experience
- Advanced search with debouncing
- Category & price filtering
- Multiple sort options
- Product ratings & reviews
- Related products
- Image zoom effect
- Breadcrumb navigation

### Cart & Checkout
- Persistent cart (authenticated & guest)
- Quantity management
- Multi-step checkout (Shipping → Payment → Review)
- Coupon system
- Tax & shipping calculations

### Orders
- Order tracking with timeline
- Email confirmation
- Order history for users
- Full order management for Admin
- Invoice generation

### Admin Dashboard
- Revenue analytics
- Order statistics
- User management
- Product management
- Low-stock alerts
- Monthly revenue charts

### Premium UI/UX
- Dark/Light mode toggle
- Mobile-first responsive design
- Skeleton loaders
- Smooth animations
- Empty states
- Toast notifications
- Modern minimalist design

## Project Structure

```
ecw/
├── frontend/                    # React + Vite + Tailwind CSS
│   ├── public/
│   │   ├── robots.txt
│   │   └── vite.svg
│   └── src/
│       ├── components/
│       │   ├── layout/          # Navbar, Footer
│       │   ├── ui/              # Breadcrumb, Skeleton
│       │   └── product/         # ProductCard
│       ├── pages/               # All page components
│       ├── context/             # Auth, Cart, Theme contexts
│       ├── services/            # Axios API service
│       ├── utils/               # Helper functions
│       └── styles/              # Global CSS with Tailwind
│
├── backend/                     # Node.js + Express API
│   ├── config/                  # DB & app config
│   ├── controllers/             # Route handlers
│   ├── middleware/               # Auth, validation, upload
│   ├── models/                  # Database models
│   ├── routes/                  # API routes
│   ├── utils/                   # JWT, email, errors
│   ├── validators/              # Input validation
│   └── server.js                # Entry point
│
├── database/
│   └── schema.sql               # MySQL schema + seed data
│
├── .env.example
└── README.md
```

## Installation

### Prerequisites
- Node.js v18+
- MySQL 8+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ecw
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file in the backend directory (see `.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=ecw_database
   JWT_SECRET=your-secret-key
   ```

3. **Database Setup**
   - Create a MySQL database named `ecw_database`
   - Import the schema:
     ```bash
     mysql -u root -p ecw_database < database/schema.sql
     ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Run the Application**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/featured` | Featured products |
| GET | `/api/products/categories` | All categories |
| GET | `/api/products/:slug` | Product detail |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart` | Add to cart |
| PUT | `/api/cart/:id` | Update quantity |
| DELETE | `/api/cart/:id` | Remove item |
| DELETE | `/api/cart` | Clear cart |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| POST | `/api/orders/create-payment-intent` | Stripe payment intent |
| GET | `/api/orders` | User orders |
| GET | `/api/orders/all` | All orders (Admin) |
| GET | `/api/orders/:orderNumber` | Order detail |
| PUT | `/api/orders/:id/status` | Update status (Admin) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/wishlist` | Get wishlist |
| POST | `/api/users/wishlist` | Toggle wishlist |
| POST | `/api/users/reviews` | Add review |
| GET | `/api/users/addresses` | Get addresses |
| POST | `/api/users/addresses` | Add address |
| PUT | `/api/users/addresses/:id` | Update address |
| DELETE | `/api/users/addresses/:id` | Delete address |
| GET | `/api/users/banners` | Get banners |
| GET | `/api/users/dashboard` | Admin stats |

### Query Parameters (Products)
- `category` - Filter by category slug
- `search` - Search by name/description
- `minPrice`, `maxPrice` - Price range filter
- `rating` - Minimum rating filter
- `sort` - Sort order (price_asc, price_desc, newest, popular, rating)
- `page`, `limit` - Pagination
- `featured` - Featured products only

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set framework to Vite
4. Set environment variables in Vercel dashboard
5. Deploy

### Backend (Render)
1. Create a new Web Service in Render
2. Connect GitHub repository
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables in Render dashboard

### Database (PlanetScale)
1. Create a PlanetScale account
2. Create a new database
3. Get connection string
4. Import schema using PlanetScale CLI or dashboard
5. Update backend environment variables

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| DB_HOST | MySQL host |
| DB_USER | MySQL user |
| DB_PASSWORD | MySQL password |
| DB_NAME | Database name |
| JWT_SECRET | JWT signing secret |
| JWT_REFRESH_SECRET | Refresh token secret |
| GOOGLE_CLIENT_ID | Google OAuth client ID |
| STRIPE_SECRET_KEY | Stripe secret key |
| SMTP_HOST | Email SMTP host |
| SMTP_USER | Email user |
| FRONTEND_URL | Frontend URL for CORS |

## Security Measures
- Password hashing with bcrypt (12 rounds)
- JWT with short expiration + refresh tokens
- SQL injection prevention (prepared statements)
- Input validation with express-validator
- Rate limiting on API routes
- Helmet security headers
- CORS configuration
- File upload validation
- Secure HTTP-only cookies (configurable)

## Performance Optimizations
- Lazy loading images
- Code splitting with Vite
- API pagination
- Debounced search
- Skeleton loaders
- Optimized bundle with manual chunks
- Image optimization ready

## License
MIT

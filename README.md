# KoalaShop - Smoked Fish Order Management System

A modern, mobile-first order management system built with Next.js 15, React 19, and Amazon Aurora DSQL for managing smoked fish orders and customer relationships.

> **🚀 Successfully migrated from Supabase to Amazon Aurora DSQL with full AWS Amplify deployment!**

## 🚀 Features

### Core Functionality
- **Customer Management**: Search and manage customer information with contact details
- **Order Creation**: Create new orders with multiple products and custom quantities
- **Order Tracking**: View order details, status, and item breakdowns
- **Product Catalog**: Manage smoked fish products with pricing per ounce
- **Real-time Search**: Debounced customer search with instant results

### Technical Features
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **Modern UI Components**: Built with shadcn/ui and Radix UI primitives
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Database Integration**: Supabase PostgreSQL with real-time capabilities
- **Performance Optimized**: Server-side rendering with Next.js App Router

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Amazon Aurora DSQL** - Serverless PostgreSQL with IAM authentication
- **PostgreSQL** - Relational database with Aurora DSQL compatibility
- **Next.js API Routes** - Serverless API endpoints
- **AWS IAM** - Secure authentication and authorization
- **AWS CLI** - Aurora DSQL authentication token generation

### Development Tools
- **pnpm** - Fast package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel Analytics** - Performance monitoring

## 📁 Project Structure

```
koalashop/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── customers/            # Customer endpoints
│   │   │   ├── [id]/orders/      # Customer orders
│   │   │   └── search/           # Customer search
│   │   ├── orders/               # Order management
│   │   └── products/             # Product catalog
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── customer-search.tsx       # Customer search interface
│   ├── new-order-form.tsx        # Order creation form
│   ├── order-details.tsx         # Order details view
│   └── theme-provider.tsx        # Theme management
├── lib/                          # Utility libraries
│   ├── aurora/                   # Aurora DSQL configuration
│   │   ├── client.ts             # Aurora DSQL client
│   │   └── server.ts             # Server-side Aurora DSQL
│   ├── hybrid/                   # Hybrid database client
│   │   └── server.ts             # Supabase/Aurora DSQL hybrid
│   ├── supabase/                 # Supabase configuration (legacy)
│   │   ├── client.ts             # Client-side Supabase
│   │   └── server.ts             # Server-side Supabase
│   └── utils.ts                  # Utility functions
├── scripts/                      # Database scripts
│   ├── 01-create-tables.sql      # Database schema (Supabase - legacy)
│   ├── 02-seed-data.sql          # Sample data (Supabase - legacy)
│   ├── 01-create-aurora-dsql-tables.sql # Aurora DSQL schema
│   ├── 02-seed-aurora-dsql-data.sql   # Aurora DSQL sample data
│   └── migrate-to-aurora.ts      # Data migration script
├── types/                        # TypeScript definitions
│   └── database.ts               # Database types
└── public/                       # Static assets
```

## 🗄️ Database Schema

### Tables

#### `customers`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required)
- `email` (VARCHAR, Optional)
- `phone` (VARCHAR, Optional)
- `address` (TEXT, Optional)
- `created_at`, `updated_at` (Timestamps)

#### `products`
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required)
- `description` (TEXT, Optional)
- `unit_price` (DECIMAL, Required - price per ounce)
- `created_at` (Timestamp)

#### `orders`
- `id` (UUID, Primary Key)
- `customer_id` (UUID, Foreign Key)
- `order_name` (VARCHAR, Required)
- `total_amount` (DECIMAL, Calculated)
- `status` (VARCHAR, Default: 'pending')
- `created_at`, `updated_at` (Timestamps)

#### `order_items`
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key)
- `product_id` (UUID, Foreign Key)
- `quantity` (INTEGER, Required)
- `weight_oz` (DECIMAL, Required)
- `unit_price` (DECIMAL, Required)
- `total_price` (DECIMAL, Generated - quantity × weight × unit_price)
- `created_at` (Timestamp)

### Indexes
- Customer name and email for search optimization
- Order customer_id and created_at for performance
- Order items foreign keys for joins

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- AWS Account with Aurora DSQL access
- Aurora DSQL cluster (see [Migration Guide](./AURORA_MIGRATION_GUIDE.md))
- AWS CLI configured with appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd koalashop
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Aurora DSQL Configuration
   AURORA_DSQL_HOST=tfthqqgcj6tcmvrwthlasn2rm4.dsql.us-west-2.on.aws
   AURORA_DSQL_PORT=5432
   AURORA_DSQL_DATABASE=postgres
   AWS_REGION=us-west-2
   AURORA_DSQL_IAM_ROLE_ARN=admin
   
   # Migration Settings
   USE_AURORA_DSQL=true
   FALLBACK_TO_SUPABASE=false
   
   # Optional: Supabase fallback (if needed)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**
   The Aurora DSQL cluster is already configured and running. The database schema and sample data have been created.
   
   If you need to recreate the database:
   ```bash
   # Generate auth token for Aurora DSQL
   aws dsql generate-db-connect-auth-token \
     --identifier tfthqqgcj6tcmvrwthlasn2rm4 \
     --region us-west-2
   
   # Create schema (using the generated token as password)
   psql "host=tfthqqgcj6tcmvrwthlasn2rm4.dsql.us-west-2.on.aws port=5432 dbname=postgres user=admin sslmode=require" \
     -f scripts/01-create-aurora-dsql-tables.sql
   
   # Seed sample data
   psql "host=tfthqqgcj6tcmvrwthlasn2rm4.dsql.us-west-2.on.aws port=5432 dbname=postgres user=admin sslmode=require" \
     -f scripts/02-seed-aurora-dsql-data.sql
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001) (port 3000 may be in use)

## 🧪 Local Testing

### Testing the Application

1. **Start the development server**
   ```bash
   pnpm dev
   ```

2. **Test API endpoints**
   ```bash
   # Test products API
   curl http://localhost:3001/api/products
   
   # Test customer search
   curl "http://localhost:3001/api/customers/search?q=john"
   
   # Test customer orders
   curl http://localhost:3001/api/customers/550e8400-e29b-41d4-a716-446655440001/orders
   
   # Test order creation
   curl -X POST http://localhost:3001/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "customer_id": "550e8400-e29b-41d4-a716-446655440001",
       "order_name": "Test Order",
       "order_items": [
         {
           "product_id": "660e8400-e29b-41d4-a716-446655440001",
           "quantity": 1,
           "weight_oz": 8.0,
           "unit_price": 24.99
         }
       ]
     }'
   ```

3. **Test the frontend**
   - Open [http://localhost:3001](http://localhost:3001)
   - Search for customers (try "john", "jane", "smith")
   - Create new orders
   - View order details

### Troubleshooting

**If you see connection errors:**
- Ensure AWS CLI is configured: `aws configure`
- Check Aurora DSQL cluster status: `aws dsql get-cluster --identifier tfthqqgcj6tcmvrwthlasn2rm4 --region us-west-2`
- Verify environment variables in `.env.local`

**If you see "access denied" errors:**
- The application uses AWS CLI to generate auth tokens
- Ensure your AWS credentials have Aurora DSQL permissions
- Check that the Aurora DSQL cluster is active

## 🔄 Migration from Supabase

This application has been migrated from Supabase to Amazon Aurora DSQL. For detailed migration instructions, see the [Aurora Migration Guide](./AURORA_MIGRATION_GUIDE.md).

### Quick Migration Steps:
1. Set up Aurora DSQL cluster
2. Configure IAM roles and permissions
3. Run database schema scripts
4. Migrate data using the provided script
5. Update environment variables
6. Test the application

### Hybrid Mode
The application supports a hybrid mode where you can switch between Aurora DSQL and Supabase using environment variables:
- `USE_AURORA_DSQL=true` - Use Aurora DSQL
- `FALLBACK_TO_SUPABASE=true` - Fallback to Supabase if Aurora DSQL fails

## 📱 Usage

### Customer Search
1. Enter customer name, email, or phone number
2. Select from search results
3. View customer orders or create new orders

### Creating Orders
1. Select a customer
2. Click "New Order"
3. Enter order name
4. Add products with quantities and weights
5. Review total and save

### Order Management
1. View order history for each customer
2. Click on orders to see detailed breakdowns
3. Track order status (pending/completed)

## 🔧 API Endpoints

### Customers
- `GET /api/customers/search?q={query}` - Search customers
- `GET /api/customers/[id]/orders` - Get customer orders

### Orders
- `POST /api/orders` - Create new order
  ```json
  {
    "customer_id": "uuid",
    "order_name": "string",
    "order_items": [
      {
        "product_id": "uuid",
        "quantity": 1,
        "weight_oz": 8.0,
        "unit_price": 24.99
      }
    ]
  }
  ```

### Products
- `GET /api/products` - Get all products

## 🎨 UI Components

The application uses shadcn/ui components with a custom design system:

- **Cards**: Order and customer information display
- **Buttons**: Actions and navigation
- **Inputs**: Form fields and search
- **Select**: Product selection dropdowns
- **Separators**: Visual content division

### Theme Support
- Light/dark mode support via next-themes
- CSS variables for consistent theming
- Mobile-optimized responsive design

## 🔒 Security Features

- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Parameterized queries via Supabase
- **Environment Variables**: Secure configuration management
- **Type Safety**: TypeScript prevents runtime errors

## 🚀 Deployment

### AWS Amplify (Current Deployment)
The application is currently deployed to AWS Amplify with Aurora DSQL backend using Git-based deployment.

**Live Application:** https://d1ph18zqpzftga.amplifyapp.com  
**GitHub Repository:** https://github.com/iguana/koalashop

#### Git-Based Deployment (Recommended)
The application uses automatic Git-based deployment with AWS Amplify. Every push to the main branch triggers an automatic build and deployment.

#### Setup Process
1. **AWS Resources Created:**
   - IAM Policy: `AuroraDSQLAccess`
   - IAM Role: `AmplifyAuroraDSQLRole`
   - Amplify App: `koalashop` (ID: `d1ph18zqpzftga`)
   - GitHub Repository: Connected for auto-build

2. **Environment Variables Configured:**
   - `AURORA_DSQL_HOST`: Aurora DSQL cluster endpoint
   - `AURORA_DSQL_PORT`: 5432
   - `AURORA_DSQL_DATABASE`: postgres
   - `AURORA_DSQL_IAM_ROLE_ARN`: admin
   - `USE_AURORA_DSQL`: true
   - `FALLBACK_TO_SUPABASE`: false

3. **Build Configuration (`amplify.yml`):**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install --legacy-peer-deps
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

#### Deployment Workflow
1. **Make changes** to your code locally
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. **Automatic deployment** - Amplify detects the push and starts building
4. **Monitor progress** in AWS Amplify console or via CLI:
   ```bash
   # List recent deployments
   aws amplify list-jobs --app-id d1ph18zqpzftga --branch-name main --region us-west-1
   
   # Check specific deployment status
   aws amplify get-job --app-id d1ph18zqpzftga --branch-name main --job-id <job-id> --region us-west-1
   ```

#### Manual Deployment (Legacy - Not Recommended)
If you need to deploy manually (not recommended with Git setup):
```bash
# Build the application first
pnpm build

# Create deployment ZIP from built application
cd .next && zip -r ../koalashop-deployment.zip . && cd ..

# Create deployment
aws amplify create-deployment --app-id d1ph18zqpzftga --branch-name main --region us-west-1

# Upload ZIP to provided URL (from create-deployment response)
curl -X PUT -T koalashop-deployment.zip "https://aws-amplify-prod-us-west-1-artifacts.s3.us-west-1.amazonaws.com/..."

# Start deployment
aws amplify start-deployment --app-id d1ph18zqpzftga --branch-name main --job-id <job-id> --region us-west-1
```

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Vercel (with Aurora DSQL configuration)
- Netlify
- Railway
- DigitalOcean App Platform

## 🧪 Development

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)

### Database Management
- Use AWS CLI for Aurora DSQL management
- Run SQL scripts for schema changes
- Monitor performance with AWS CloudWatch
- Generate auth tokens: `aws dsql generate-db-connect-auth-token --identifier tfthqqgcj6tcmvrwthlasn2rm4 --region us-west-2`

### Testing
```bash
# Run linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📊 Performance Considerations

- **Database Indexes**: Optimized for common queries
- **Debounced Search**: Reduces API calls during typing
- **Server Components**: Reduced client-side JavaScript
- **Image Optimization**: Next.js automatic optimization
- **Aurora DSQL Caching**: Built-in query result caching
- **AWS IAM Authentication**: Secure token-based authentication

## 🔮 Future Enhancements

### Potential Features
- **User Authentication**: Customer login system
- **Order Status Updates**: Real-time status changes
- **Inventory Management**: Stock tracking
- **Payment Integration**: Stripe/PayPal support
- **Email Notifications**: Order confirmations
- **Analytics Dashboard**: Sales reporting
- **Mobile App**: React Native version

### Technical Improvements
- **Testing**: Unit and integration tests
- **Error Boundaries**: Better error handling
- **Offline Support**: PWA capabilities
- **Performance Monitoring**: Real-time metrics
- **Code Splitting**: Lazy loading optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the AWS Aurora DSQL documentation for database-related questions
- Check AWS CloudWatch for monitoring and logs

## 📋 Migration Summary

### What Was Accomplished
✅ **Complete Aurora DSQL Migration** - Migrated from Supabase to Amazon Aurora DSQL  
✅ **Git-Based Deployment** - Successfully set up automatic Git deployment with AWS Amplify  
✅ **GitHub Integration** - Connected repository for auto-build on push  
✅ **IAM Authentication** - Configured proper AWS IAM roles and policies  
✅ **Database Schema** - Created Aurora DSQL-compatible schema  
✅ **Sample Data** - Populated database with test data  
✅ **API Migration** - Updated all API routes to use Aurora DSQL  
✅ **Dependency Resolution** - Fixed React 19 compatibility issues  
✅ **Build Configuration** - Optimized amplify.yml for SSR deployment  
✅ **Local Testing** - Verified all functionality works locally  
✅ **Production Deployment** - Live application at https://d1ph18zqpzftga.amplifyapp.com  

### Key Technical Achievements
- **Aurora DSQL Client**: Custom client using AWS CLI for auth token generation
- **Database Compatibility**: Adapted PostgreSQL schema for Aurora DSQL limitations
- **Authentication**: AWS IAM-based authentication instead of traditional passwords
- **Git-Based Deployment**: Automatic deployment pipeline with GitHub integration
- **Dependency Management**: Resolved React 19 compatibility with legacy packages
- **SSR Configuration**: Optimized Next.js SSR build for AWS Amplify
- **Error Handling**: Comprehensive error handling and fallback mechanisms
- **Auto-Build Pipeline**: Seamless CI/CD with automatic deployments on push

---

**Built with ❤️ using Next.js, React, and Amazon Aurora DSQL**

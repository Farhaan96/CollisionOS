# CollisionOS - Insurance Collision Repair Management System

## 🚗 Overview

CollisionOS is a specialized desktop application designed for collision repair shops that process insurance claims. It provides end-to-end workflow management from BMS ingestion through parts sourcing to job completion, with deep integration into the insurance repair ecosystem.

## ✨ Key Features

### 🎯 Core Collision Repair Workflow
- **BMS Integration**: Automated XML parsing and data ingestion from insurance systems
- **Claims Management**: 1:1 claim-to-repair-order relationship tracking
- **Parts Sourcing**: Multi-vendor parts ordering with status workflow (Needed → Ordered → Received → Installed)
- **Purchase Order Management**: Automated PO numbering and supplier integration
- **Search-First Interface**: Global search by RO#, Claim#, Plate, or VIN

### 🔧 Technical Capabilities
- **Multi-platform**: Electron desktop app with web access
- **Database**: PostgreSQL/Supabase with collision-specific schema
- **BMS Parsing**: Supabase Edge Functions for XML processing
- **Real-time Updates**: Live status tracking across repair workflow
- **Parts Workflow**: Status buckets with multi-select PO creation

### 📊 Collision Repair Intelligence
- **Vendor KPIs**: Lead time, fill rate, return rate tracking
- **Parts Analytics**: OEM vs Aftermarket vs Reman analysis
- **Claim Tracking**: Insurance-specific reporting and compliance
- **RO Performance**: Cycle time and profitability by repair order

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Electron + React with Material-UI
- **Backend**: Supabase with Edge Functions + Node.js Express APIs
- **Database**: PostgreSQL with collision repair schema
- **BMS Integration**: Supabase Edge Functions with fast-xml-parser
- **Authentication**: Supabase Auth with role-based access

### Database Schema - Collision Repair Specific

```sql
-- Core entities with insurance collision repair relationships
claims (claim_id PK, claim_number UNIQUE, insurer_name, customer_id, vehicle_id)
repair_orders (ro_id PK, ro_number UNIQUE, claim_id FK UNIQUE, stage, opened_at, delivered_at)
customers (customer_id PK, type, first_name, last_name, company_name, contact_info)
vehicles (vehicle_id PK, customer_id FK, vin UNIQUE, year, make, model, trim, plate, colour, odometer)
suppliers (supplier_id PK, name, site_code, account_number, terms, is_active)
purchase_orders (po_id PK, ro_id FK, supplier_id FK, po_number UNIQUE, status, dates, totals)
part_lines (part_line_id PK, ro_id FK, po_id FK, operation, oem_number, brand_type, status, quantities, pricing)
returns (return_id PK, part_line_id FK, supplier_id FK, rma_number, reason, amounts)
documents (bms_document_id PK, bms_version, document_type, created_at, provenance)
```

### System Requirements
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB available space
- **Network**: Broadband internet connection for BMS/Supabase
- **Display**: 1920x1080 minimum resolution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/collision-os.git
   cd collision-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase URL and keys
   ```

4. **Initialize collision repair database**
   ```bash
   npm run db:gen        # Generate and deploy schema
   npm run seed:bms      # Load sample BMS data
   ```

5. **Start development environment**
   ```bash
   npm run dev:electron  # Desktop app
   npm run dev:functions # Supabase edge functions
   ```

### Production Build

```bash
# Build the desktop application
npm run electron-pack

# Deploy Supabase functions
supabase functions deploy bms_ingest
```

## 📁 Project Structure

```
collision-os/
├── app-desktop/             # Electron + React frontend
│   ├── src/components/      # UI components (RO detail, Parts buckets)
│   ├── src/pages/          # Main app screens
│   └── src/services/       # API client services
├── supabase/
│   ├── functions/          # Edge functions
│   │   └── bms_ingest/     # BMS XML parsing
│   └── migrations/         # Database schema
├── api/                    # Express API routes (if needed)
│   └── routes/po.js        # Purchase order endpoints
├── scripts/                # Development utilities
│   ├── db-gen.js          # Schema generation
│   └── seed-bms.js        # Sample data loading
└── samples/                # Sample BMS XML files
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (if using custom auth)
JWT_SECRET=your-secret-key

# Development
NODE_ENV=development
ELECTRON_DEV_PORT=3000
API_PORT=3001
```

## 🎯 Core Workflows

### 1. BMS Ingestion Pipeline
- Receive BMS XML files via upload or API
- Parse with fast-xml-parser (removeNSPrefix: true)
- Upsert data in order: documents → customers → vehicles → claims → repair_orders → part_lines
- Set initial part_lines status to "needed"
- Return ingestion summary with counts

### 2. RO Detail & Parts Management
- **Search Interface**: Global search by RO#, Claim#, Plate, VIN last 6
- **RO Header**: Display claim#, RO#, customer, vehicle as chips
- **Parts Buckets**: Needed | Ordered | Backordered | Received | Installed | Returned
- **Multi-select PO Creation**: Choose parts → select vendor → generate PO

### 3. Purchase Order Workflow
- **PO Numbering**: `${ro_number}-${YYMM}-${vendorCode}-${seq}`
- **Vendor Code**: 4 chars uppercase from supplier name
- **Status Updates**: ordered → received (with quantities) → installed
- **Returns Handling**: Create return records for quantity mismatches

### 4. Vendor Management
- **Per-vendor PO views**: Open POs by supplier
- **KPI Tracking**: Lead time, fill rate, return rate
- **Inline Receiving**: Partial quantity updates per line item

## 🔌 BMS Integration

### Supported Operations Mapping
```
BMS Operation → part_lines fields:
- Replace → operation: "Replace", brand_type based on part source
- R&I → operation: "R&I", condition: "Reuse"  
- Repair → operation: "Repair", condition: "Repair"
- Sublet → operation: "Sublet", supplier_id if specified
```

### API Endpoints

```bash
# BMS ingestion
POST /bms_ingest
Content-Type: multipart/form-data or text/xml
Returns: {documents: 1, customers: 1, vehicles: 1, claims: 1, repair_orders: 1, part_lines: 15}

# Purchase orders
POST /api/pos
Body: {ro_id, supplier_id, line_ids[]}
Returns: {po_id, po_number}

# Receive parts  
POST /api/pos/:id/receive
Body: {line_items: [{part_line_id, qty_received}]}
Returns: {updated_lines, returns_created}

# Install parts
POST /api/part-lines/:id/install
Returns: {installed_date, status: "installed"}
```

## 📊 Reporting & Analytics

### Collision Repair Specific Reports
- **Claim Cycle Time**: Days from BMS ingestion to delivery
- **Parts Profitability**: Markup analysis by brand type (OEM/AM/LKQ)
- **Vendor Performance**: Lead times and fill rates by supplier
- **RO Status**: Current pipeline and bottlenecks

### Search & Filtering
- **Global Search**: RO#, Claim#, Plate, VIN last 6 digits
- **Parts Status**: Filter by needed/ordered/received/installed
- **Date Ranges**: Order dates, ETA dates, received dates
- **Vendor Analysis**: Performance metrics by supplier

## 🧪 Development Scripts

```bash
# Database management
npm run db:gen          # Generate SQL schema and deploy to Supabase
npm run db:migrate      # Run pending migrations
npm run db:seed         # Load sample collision repair data

# Development environment  
npm run dev:electron    # Start desktop app in development
npm run dev:functions   # Start Supabase edge functions locally
npm run dev:api        # Start Express API server

# BMS testing
npm run seed:bms       # Process sample BMS files from /samples
npm run test:bms       # Test BMS ingestion pipeline

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run Playwright collision repair workflow tests
```

## 🚀 Implementation Roadmap

### Task 1: Foundation (Week 1)
- [x] Monorepo scaffolding with app-desktop, supabase, api packages
- [x] Supabase project setup and configuration
- [x] Development script framework

### Task 2: Database Schema (Week 1)  
- [ ] Collision repair PostgreSQL schema design
- [ ] Migration scripts and indexes
- [ ] Enum definitions (part status, brand types)

### Task 3: BMS Integration (Week 2)
- [ ] Supabase Edge Function for XML parsing
- [ ] BMS-to-database mapping implementation
- [ ] Sample BMS file processing

### Task 4: PO APIs (Week 2)
- [ ] Purchase order creation endpoints
- [ ] PO numbering system implementation  
- [ ] Parts receiving workflow APIs

### Task 5: RO Interface (Week 3)
- [ ] Search-first navigation design
- [ ] RO detail page with claim/customer/vehicle chips
- [ ] Parts status buckets with drag-and-drop

### Task 6: PO Management (Week 3)
- [ ] Multi-select PO creation workflow
- [ ] Vendor-specific PO views
- [ ] Inline parts receiving interface

### Task 7: Testing & Validation (Week 4)
- [ ] Collision repair workflow testing
- [ ] BMS ingestion validation
- [ ] Performance testing with sample data

### Task 8: Performance Optimization (Week 4)
- [ ] Database indexing verification
- [ ] Query optimization for large part datasets
- [ ] UI performance testing

---

**CollisionOS** - Specialized Insurance Collision Repair Management
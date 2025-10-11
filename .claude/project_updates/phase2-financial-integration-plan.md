# Phase 2: Financial Integration - Implementation Plan

**Start Date**: October 10, 2025
**Duration**: 2 weeks (Weeks 3-4)
**Priority**: High - Critical for business operations
**Status**: 🚀 In Progress

---

## 🎯 Phase 2 Objectives

Implement complete financial management system for collision repair shops:
1. **Payment Processing** - Accept and record multiple payment types
2. **Expense Tracking** - Track job-level and operating expenses
3. **Accounting Integration** - Sync with QuickBooks Online
4. **Financial Reporting** - Real-time financial insights

---

## 📊 Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CollisionOS Financial System              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payment    │  │   Expense    │  │  QuickBooks  │      │
│  │  Processing  │  │   Tracking   │  │     Sync     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼──────┐      │
│  │           Financial Database Layer                 │      │
│  │  (Payments, Expenses, Transactions, Accounts)     │      │
│  └────────────────────────────────────────────────────┘      │
│         │                                                     │
│  ┌──────▼─────────────────────────────────────────────┐      │
│  │        Financial Dashboard & Reporting             │      │
│  │   (P&L, Cash Flow, AR/AP, Revenue Analysis)       │      │
│  └────────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Design

### New Tables Required

#### 1. Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  repair_order_id UUID REFERENCES repair_orders(id),
  invoice_id UUID REFERENCES invoices(id),

  -- Payment Details
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'cash', 'credit_card', 'check', 'insurance', 'debit_card', 'wire_transfer'
  payment_method VARCHAR(50), -- 'stripe', 'square', 'manual'
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'

  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  processing_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Payment Gateway Details
  gateway_transaction_id VARCHAR(255),
  gateway_reference VARCHAR(255),
  gateway_response JSONB,

  -- Check Details (if applicable)
  check_number VARCHAR(50),
  check_date DATE,
  bank_name VARCHAR(255),

  -- Credit Card Details (tokenized)
  card_last_four VARCHAR(4),
  card_brand VARCHAR(50),
  card_token VARCHAR(255),

  -- Insurance Payment Details
  insurance_company_id UUID REFERENCES insurance_companies(id),
  claim_number VARCHAR(100),
  eob_reference VARCHAR(100), -- Explanation of Benefits

  -- Metadata
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  applied_date TIMESTAMP,
  notes TEXT,
  receipt_url VARCHAR(500),

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_ro ON payments(repair_order_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_type ON payments(payment_type);
```

#### 2. Expenses Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),

  -- Expense Classification
  expense_type VARCHAR(50) NOT NULL, -- 'job_cost', 'operating', 'payroll', 'overhead'
  category VARCHAR(100) NOT NULL, -- 'sublet', 'materials', 'rent', 'utilities', 'insurance', 'supplies'

  -- Job-Related (if applicable)
  repair_order_id UUID REFERENCES repair_orders(id),
  is_billable BOOLEAN DEFAULT false,
  markup_percentage DECIMAL(5,2),

  -- Expense Details
  expense_number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Vendor Information
  vendor_id UUID REFERENCES vendors(id),
  vendor_name VARCHAR(255),
  vendor_invoice_number VARCHAR(100),

  -- Payment Details
  payment_method VARCHAR(50), -- 'cash', 'credit_card', 'check', 'ach'
  payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'partial', 'overdue'
  paid_amount DECIMAL(10,2) DEFAULT 0,

  -- Dates
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,

  -- Approval Workflow
  approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Accounting Integration
  qbo_expense_id VARCHAR(100), -- QuickBooks Online ID
  qbo_synced_at TIMESTAMP,
  account_code VARCHAR(50),

  -- Attachments
  receipt_url VARCHAR(500),
  attachments JSONB,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount >= 0)
);

CREATE INDEX idx_expenses_ro ON expenses(repair_order_id);
CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_status ON expenses(payment_status);
```

#### 3. Invoices Table (Enhanced)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),
  repair_order_id UUID REFERENCES repair_orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'supplement', 'final'
  invoice_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) NOT NULL,

  -- Breakdown
  labor_total DECIMAL(10,2) DEFAULT 0,
  parts_total DECIMAL(10,2) DEFAULT 0,
  sublet_total DECIMAL(10,2) DEFAULT 0,
  misc_total DECIMAL(10,2) DEFAULT 0,

  -- Insurance Details
  insurance_company_id UUID REFERENCES insurance_companies(id),
  claim_number VARCHAR(100),
  deductible_amount DECIMAL(10,2) DEFAULT 0,
  insurance_paid DECIMAL(10,2) DEFAULT 0,
  customer_responsibility DECIMAL(10,2),

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,

  -- Terms
  payment_terms VARCHAR(50) DEFAULT 'net30', -- 'due_on_receipt', 'net15', 'net30', 'net60'

  -- Notes
  notes TEXT,
  terms_conditions TEXT,

  -- QuickBooks Integration
  qbo_invoice_id VARCHAR(100),
  qbo_synced_at TIMESTAMP,

  -- Audit
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_ro ON invoices(repair_order_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(invoice_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
```

#### 4. Financial Transactions Table (Double-Entry Ledger)
```sql
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),

  -- Transaction Details
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'expense', 'refund', 'adjustment'
  transaction_date TIMESTAMP NOT NULL,

  -- Related Records
  payment_id UUID REFERENCES payments(id),
  expense_id UUID REFERENCES expenses(id),
  invoice_id UUID REFERENCES invoices(id),
  repair_order_id UUID REFERENCES repair_orders(id),

  -- Double-Entry Bookkeeping
  debit_account VARCHAR(100) NOT NULL,
  credit_account VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  -- Description
  description TEXT,
  notes TEXT,

  -- QuickBooks Sync
  qbo_transaction_id VARCHAR(100),
  qbo_synced_at TIMESTAMP,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX idx_transactions_payment ON financial_transactions(payment_id);
CREATE INDEX idx_transactions_expense ON financial_transactions(expense_id);
```

#### 5. QuickBooks Sync Log
```sql
CREATE TABLE quickbooks_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id),

  -- Sync Details
  sync_type VARCHAR(50) NOT NULL, -- 'invoice', 'payment', 'expense', 'customer', 'vendor'
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- QuickBooks Reference
  qbo_id VARCHAR(100),
  qbo_sync_token VARCHAR(50),

  -- Status
  sync_status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed', 'conflict'
  sync_direction VARCHAR(20) NOT NULL, -- 'to_qbo', 'from_qbo', 'bidirectional'

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,

  -- Audit
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qbo_sync_entity ON quickbooks_sync_log(entity_type, entity_id);
CREATE INDEX idx_qbo_sync_status ON quickbooks_sync_log(sync_status);
```

---

## 🔧 Implementation Roadmap

### Week 3: Payment Processing & Expense Tracking

#### Day 1-2: Payment Processing Backend
- [ ] Set up Stripe API integration
- [ ] Create payment processing service
- [ ] Implement payment methods (cash, card, check, insurance)
- [ ] Build payment recording endpoints
- [ ] Add payment validation and error handling
- [ ] Create receipt generation service

#### Day 3-4: Payment UI
- [ ] Build payment recording dialog
- [ ] Create payment type selector
- [ ] Add credit card payment form (Stripe Elements)
- [ ] Implement cash/check payment forms
- [ ] Add insurance payment form
- [ ] Build payment history view
- [ ] Create receipt download/email functionality

#### Day 5-6: Expense Tracking
- [ ] Create expense recording backend
- [ ] Build expense categorization system
- [ ] Implement job-cost vs operating expense logic
- [ ] Add vendor bill management
- [ ] Create expense approval workflow
- [ ] Build expense tracking UI

#### Day 7: Testing & Refinement
- [ ] Test payment processing end-to-end
- [ ] Test expense recording and approval
- [ ] Test receipt generation
- [ ] Fix any bugs or issues

### Week 4: QuickBooks Integration & Reporting

#### Day 8-9: QuickBooks OAuth & Setup
- [ ] Set up QuickBooks Online developer account
- [ ] Implement OAuth 2.0 authentication flow
- [ ] Create QuickBooks connection UI
- [ ] Build account mapping interface
- [ ] Test authentication and refresh tokens

#### Day 10-11: QuickBooks Sync Engine
- [ ] Build bidirectional sync service
- [ ] Implement invoice sync (CollisionOS → QBO)
- [ ] Implement payment sync (CollisionOS → QBO)
- [ ] Implement expense sync (CollisionOS → QBO)
- [ ] Add customer/vendor sync
- [ ] Create sync conflict resolution
- [ ] Build sync status dashboard

#### Day 12-13: Financial Reporting
- [ ] Create financial dashboard UI
- [ ] Build Profit & Loss report
- [ ] Build Cash Flow statement
- [ ] Create Accounts Receivable aging report
- [ ] Add Revenue analysis charts
- [ ] Build Expense breakdown reports
- [ ] Create daily sales summary

#### Day 14: Testing & Documentation
- [ ] Comprehensive testing of all financial features
- [ ] QuickBooks integration testing
- [ ] Create user documentation
- [ ] Create API documentation
- [ ] Performance testing with large datasets

---

## 💳 Payment Processing Implementation

### Stripe Integration Architecture

```javascript
// Payment Flow
1. User initiates payment → Frontend
2. Create payment intent → Backend → Stripe API
3. Collect payment details → Stripe Elements (PCI compliant)
4. Confirm payment → Stripe API
5. Record payment → Database
6. Generate receipt → PDF service
7. Send receipt → Email service
8. Update invoice status → Database
9. Sync to QuickBooks → QBO API
```

### Payment Types Support

1. **Credit Card** (via Stripe)
   - Visa, Mastercard, Amex, Discover
   - Store tokenized card info
   - Support recurring/saved cards
   - PCI DSS compliant

2. **Cash**
   - Manual entry
   - Cash drawer tracking
   - Receipt printing

3. **Check**
   - Check number tracking
   - Bank information
   - Check clearing status

4. **Insurance Payment**
   - EOB (Explanation of Benefits) tracking
   - Claim number reference
   - Insurance company tracking
   - Partial payment handling

5. **ACH/Wire Transfer**
   - Bank transfer tracking
   - Reference number
   - Clearing dates

### Partial Payments & Deposits
- Support multiple payments per invoice
- Track payment application (which invoice line items paid)
- Handle deposits and final payments
- Automatic balance calculation

---

## 📊 Expense Tracking Features

### Job-Level Expenses (Direct Costs)
- **Sublet Repairs**: Outsourced work (frame, glass, upholstery)
- **Materials**: Consumables used on specific jobs
- **Specialized Labor**: Contract technicians
- **Towing**: Vehicle recovery costs
- **Rentals**: Equipment rentals for specific repairs

### Operating Expenses (Indirect Costs)
- **Rent/Lease**: Facility costs
- **Utilities**: Electric, water, gas, internet
- **Insurance**: Liability, property, workers comp
- **Supplies**: Office supplies, shop supplies
- **Marketing**: Advertising, website, promotions
- **Equipment**: Tool purchases, equipment maintenance
- **Professional Services**: Accounting, legal, consulting
- **Payroll**: Salaries and wages (separate tracking)

### Expense Approval Workflow
```
1. Employee creates expense → [Draft]
2. Manager reviews → [Pending Approval]
3. Manager approves/rejects → [Approved/Rejected]
4. Accounting processes payment → [Paid]
5. Sync to QuickBooks → [Synced]
```

---

## 🔄 QuickBooks Online Integration

### Sync Strategy

#### Push to QuickBooks (CollisionOS → QBO)
- **Invoices**: Create/update invoices when finalized
- **Payments**: Record payments received
- **Expenses**: Record vendor bills and expenses
- **Customers**: Create new customers
- **Vendors**: Create new vendors

#### Pull from QuickBooks (QBO → CollisionOS)
- **Chart of Accounts**: Import account structure
- **Payment Terms**: Sync payment terms
- **Tax Rates**: Import sales tax rates
- **Existing Customers**: Optional initial import

### Data Mapping

| CollisionOS Entity | QuickBooks Entity | Sync Direction |
|-------------------|-------------------|----------------|
| Invoice | Invoice | → |
| Payment | Payment | → |
| Expense | Bill / Expense | → |
| Customer | Customer | ↔ |
| Vendor | Vendor | ↔ |
| Tax Rate | TaxRate | ← |
| Account | Account | ← |

### Conflict Resolution
- **Timestamp-based**: Use updated_at timestamps
- **Manual Review**: Flag conflicts for user review
- **QBO as Source of Truth**: For chart of accounts
- **CollisionOS as Source**: For invoices and payments

---

## 📈 Financial Reporting

### Dashboard Metrics
- **Today's Revenue**: Cash received today
- **Outstanding AR**: Total accounts receivable
- **This Month Revenue**: MTD sales
- **This Month Expenses**: MTD costs
- **Net Profit**: Revenue - Expenses
- **Cash Balance**: Current cash position

### Reports

#### 1. Profit & Loss Statement
- Revenue (by category: labor, parts, sublet, misc)
- Cost of Goods Sold (parts cost, sublet cost)
- Gross Profit
- Operating Expenses (by category)
- Net Income

#### 2. Cash Flow Statement
- Operating Activities (payments in/out)
- Investing Activities (equipment purchases)
- Financing Activities (loans, draws)
- Net Cash Flow

#### 3. Accounts Receivable Aging
- Current (0-30 days)
- 31-60 days
- 61-90 days
- Over 90 days
- Total AR

#### 4. Revenue Analysis
- Revenue by month/quarter/year
- Revenue by service type
- Revenue by insurance company
- Top customers by revenue

#### 5. Expense Analysis
- Expenses by category
- Expense trends over time
- Job cost vs operating cost ratio
- Vendor spending analysis

---

## 🔒 Security Considerations

### Payment Security
- **PCI DSS Compliance**: Use Stripe Elements (no card data touches our server)
- **Tokenization**: Store only tokenized card references
- **Encryption**: Encrypt sensitive payment data at rest
- **Audit Trail**: Log all payment transactions
- **Access Control**: Restrict payment processing to authorized users

### QuickBooks Security
- **OAuth 2.0**: Secure authentication
- **Token Management**: Secure storage of refresh tokens
- **Encryption**: Encrypt QBO credentials
- **Scope Limitation**: Request minimum required permissions
- **Auto-Refresh**: Handle token expiration gracefully

---

## 🧪 Testing Strategy

### Unit Tests
- Payment processing logic
- Expense calculation logic
- Invoice total calculations
- QuickBooks data mapping
- Receipt generation

### Integration Tests
- Stripe API integration
- QuickBooks API integration
- Payment recording flow
- Expense approval workflow
- Sync operations

### E2E Tests
- Complete payment flow (card, cash, check)
- Invoice payment and balance updates
- Expense creation and approval
- QuickBooks sync end-to-end
- Financial report generation

---

## 📦 Dependencies Required

### Payment Processing
```json
{
  "stripe": "^14.0.0",
  "@stripe/stripe-js": "^2.0.0",
  "@stripe/react-stripe-js": "^2.0.0"
}
```

### QuickBooks Integration
```json
{
  "intuit-oauth": "^4.0.0",
  "node-quickbooks": "^2.0.0"
}
```

### PDF Generation (Receipts/Invoices)
```json
{
  "pdfkit": "^0.14.0",
  "html-pdf-node": "^1.0.0"
}
```

### Financial Calculations
```json
{
  "decimal.js": "^10.4.0" // Already installed
}
```

---

## 📝 API Endpoints to Create

### Payment Endpoints
```
POST   /api/payments                 - Create payment
GET    /api/payments                 - List payments
GET    /api/payments/:id             - Get payment details
PUT    /api/payments/:id             - Update payment
DELETE /api/payments/:id             - Void payment
POST   /api/payments/:id/refund      - Process refund
GET    /api/payments/:id/receipt     - Generate receipt PDF
POST   /api/payments/stripe/intent   - Create Stripe payment intent
POST   /api/payments/stripe/confirm  - Confirm Stripe payment
```

### Expense Endpoints
```
POST   /api/expenses                 - Create expense
GET    /api/expenses                 - List expenses
GET    /api/expenses/:id             - Get expense details
PUT    /api/expenses/:id             - Update expense
DELETE /api/expenses/:id             - Delete expense
POST   /api/expenses/:id/approve     - Approve expense
POST   /api/expenses/:id/reject      - Reject expense
POST   /api/expenses/:id/pay         - Record payment
```

### Invoice Endpoints (Enhanced)
```
POST   /api/invoices                 - Create invoice
GET    /api/invoices                 - List invoices
GET    /api/invoices/:id             - Get invoice details
PUT    /api/invoices/:id             - Update invoice
POST   /api/invoices/:id/send        - Send invoice to customer
POST   /api/invoices/:id/pay         - Record payment
GET    /api/invoices/:id/pdf         - Generate invoice PDF
```

### QuickBooks Endpoints
```
GET    /api/quickbooks/auth          - Get OAuth URL
POST   /api/quickbooks/callback      - OAuth callback
GET    /api/quickbooks/status        - Get connection status
POST   /api/quickbooks/disconnect    - Disconnect QBO
GET    /api/quickbooks/accounts      - Get chart of accounts
POST   /api/quickbooks/sync          - Trigger manual sync
GET    /api/quickbooks/sync/status   - Get sync status
POST   /api/quickbooks/sync/invoice  - Sync specific invoice
POST   /api/quickbooks/sync/payment  - Sync specific payment
```

### Financial Reporting Endpoints
```
GET    /api/reports/dashboard        - Financial dashboard metrics
GET    /api/reports/profit-loss      - P&L statement
GET    /api/reports/cash-flow        - Cash flow statement
GET    /api/reports/ar-aging         - AR aging report
GET    /api/reports/revenue          - Revenue analysis
GET    /api/reports/expenses         - Expense analysis
```

---

## 🎯 Success Criteria

Phase 2 is complete when:
- ✅ All payment types can be processed successfully
- ✅ Stripe credit card payments work end-to-end
- ✅ Expenses can be created, approved, and tracked
- ✅ QuickBooks OAuth connection established
- ✅ Invoices sync to QuickBooks automatically
- ✅ Payments sync to QuickBooks automatically
- ✅ Expenses sync to QuickBooks automatically
- ✅ Financial dashboard displays accurate metrics
- ✅ All financial reports generate correctly
- ✅ Receipt generation works for all payment types
- ✅ Comprehensive test suite passes (90%+ coverage)
- ✅ Documentation complete for all features

---

**Next**: Begin database schema creation and Stripe integration setup

**Status**: 🚀 Ready to implement
**Estimated Completion**: 2 weeks from start
**Phase 2 Progress**: 0% → 100%

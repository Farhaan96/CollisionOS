# CollisionOS Financial System Guide for Auto Body Shops

## 📊 Overview

The CollisionOS financial system provides comprehensive invoicing, payment processing, expense tracking, and financial reporting specifically designed for collision repair shops. This guide will help you maximize the system's value for your business.

---

## 🎯 Key Features

### 1. **Invoice Management**
- **Automated Invoice Generation** from completed repair orders
- **Multiple Invoice Types**: Standard, Insurance, Warranty, Supplement, Final
- **Payment Terms**: Due on receipt, Net 15/30/60 days
- **Tax Calculation**: Automatic tax calculation based on your state/province
- **Customer & Insurance Split Billing**: Separate deductible and insurance portions

### 2. **Payment Processing**
- **Multiple Payment Methods**:
  - Cash
  - Check (with check number tracking)
  - Credit/Debit Cards (Stripe integration)
  - ACH/Wire Transfer
  - Insurance Direct Payment
- **Partial Payments**: Track multiple payments against single invoice
- **Processing Fee Tracking**: Automatic credit card fee calculation
- **Payment Receipts**: Automatic receipt generation

### 3. **Expense Tracking**
- **Job-Level Expenses**: Track costs per repair order (sublet, materials)
- **Operating Expenses**: Rent, utilities, insurance, supplies
- **Vendor Management**: Link expenses to vendors
- **Approval Workflow**: Multi-level expense approval
- **Billable vs Non-Billable**: Mark expenses for customer billing

### 4. **Financial Analytics**
- **Real-time Dashboard**: Revenue, expenses, profit metrics
- **Job Cost Reconciliation**: Compare estimated vs actual costs
- **Profit Analysis**: Per-job and overall profitability
- **Aging Reports**: Track overdue invoices
- **Cash Flow Tracking**: Monitor receivables and payables

---

## 🚀 Quick Start Guide

### Step 1: Create an Invoice

**From a Completed Repair Order:**
1. Navigate to the repair order detail page
2. Click "Generate Invoice" button
3. System auto-fills:
   - Customer information
   - Vehicle details
   - Labor costs (from time tracking)
   - Parts costs (from purchase orders)
4. Review and adjust:
   - Payment terms (default: Net 30)
   - Discounts (if any)
   - Additional charges (storage fees, etc.)
   - Tax rate (automatically set by state)
5. Click "Create Invoice"

**Invoice Number Format:** `INV-{YEAR}{MONTH}{DAY}-{SEQUENCE}`
Example: `INV-25102501-00042` (Created Oct 25, 2025, 42nd invoice)

### Step 2: Send Invoice to Customer

**Email Invoice:**
1. Open invoice detail page
2. Click "Send Invoice" → "Email"
3. System sends PDF invoice to customer email
4. Invoice status changes to "Sent"

**Print Invoice:**
1. Click "Print/PDF"
2. Professional PDF generated with:
   - Your shop logo and information
   - Itemized costs (labor, parts, materials)
   - Payment terms and instructions
   - QR code for online payment (if enabled)

### Step 3: Record Payment

**Cash/Check Payment:**
1. Click "Record Payment" on invoice
2. Select payment type: Cash or Check
3. Enter:
   - Amount
   - Payment date
   - Check number (if check)
4. System automatically:
   - Updates invoice balance
   - Changes status to Partial/Paid
   - Creates payment receipt

**Credit Card Payment (Stripe):**
1. Click "Process Card Payment"
2. Enter card information OR use saved payment method
3. System processes in real-time via Stripe
4. Automatic:
   - Payment confirmation
   - Receipt generation
   - Fee calculation (typically 2.9% + $0.30)
   - Invoice status update

**Partial Payments:**
- Accept multiple partial payments
- System tracks payment history
- Automatically updates remaining balance
- Sends email notification when paid in full

### Step 4: Track Expenses

**Job-Level Expenses (Billable):**
1. Navigate to repair order
2. Click "Add Expense"
3. Select type: Sublet, Materials, Towing, etc.
4. Enter:
   - Vendor name
   - Amount
   - Invoice number (vendor's)
   - Upload receipt (optional)
5. Mark as "Billable to Customer"
6. Set markup percentage (e.g., 10% for materials)
7. Expense appears on customer invoice

**Operating Expenses (Non-Billable):**
1. Financial Menu → "Expenses" → "Add Expense"
2. Select category:
   - Rent
   - Utilities
   - Insurance
   - Supplies
   - Payroll
   - Capital Equipment
3. Enter vendor and amount
4. Set due date
5. Submit for approval (if required)

### Step 5: Review Financial Dashboard

**Access Dashboard:**
- Main Menu → "Financial Dashboard"

**Key Metrics Displayed:**
- **Total Revenue**: All paid invoices (current period)
- **Total Expenses**: All paid expenses
- **Net Profit**: Revenue minus expenses
- **Outstanding A/R**: Unpaid invoice balance
- **Profit Margin %**: Net profit / revenue

**Date Range Filters:**
- Today
- Last 7 days
- This month
- Last 30 days
- This year
- Custom date range

**Charts & Visualizations:**
- Revenue trend (line chart)
- Expense breakdown (pie chart)
- Top customers by revenue
- Profit margin by job type

---

## 💡 Best Practices for Auto Body Shops

### Invoice Management

1. **Generate Invoices Promptly**
   - Create invoice when job status changes to "Ready for Pickup"
   - Don't wait for customer pickup - have invoice ready

2. **Use Payment Terms Wisely**
   - **Insurance Jobs**: Net 30 (standard for insurance companies)
   - **Cash Customers**: Due on Receipt or Net 15
   - **Fleet Accounts**: Net 30 or Net 45 (negotiated terms)

3. **Handle Supplements Properly**
   - Create "Supplement" invoice type when additional damage found
   - Link to original invoice
   - Send to insurance adjuster AND customer

4. **Split Billing for Insurance Jobs**
   - Customer portion (deductible): Mark "Due on Pickup"
   - Insurance portion: Mark "Net 30"
   - Track separately in system

### Payment Processing

1. **Accept Multiple Payment Methods**
   - Enable Stripe for credit card convenience
   - Accept checks for fleet customers (lower fees)
   - Cash for walk-in customers
   - Insurance checks deposited separately

2. **Record Payments Immediately**
   - Don't batch - record as received
   - Maintains accurate cash flow
   - Prevents disputes

3. **Partial Payment Strategy**
   - **Large Jobs ($5,000+)**: Require 50% deposit before starting
   - **Final Payment**: Due on pickup
   - Record each payment separately in system

4. **Fee Management**
   - Credit card fees (2.9%): Build into pricing OR charge separately
   - Late fees: Configure in system (e.g., 1.5% per month)
   - NSF fees: $35 per returned check

### Expense Tracking

1. **Categorize Correctly**
   - **Job Costs** (billable):
     - Sublet work (frame straightening, glass, upholstery)
     - Materials (sandpaper, masking tape, etc.)
     - Towing
     - Rental car
   - **Operating Expenses** (non-billable):
     - Shop rent/mortgage
     - Utilities
     - Insurance
     - General supplies
     - Marketing

2. **Always Upload Receipts**
   - Take photo of paper receipt
   - Upload to expense record
   - Essential for audits and insurance

3. **Track Vendor Invoices**
   - Enter vendor invoice number
   - Set due date
   - Mark when paid
   - Avoid duplicate payments

4. **Approval Workflow**
   - **Under $100**: Auto-approved
   - **$100-$500**: Manager approval
   - **Over $500**: Owner approval
   - Configure in system settings

### Financial Reporting

1. **Daily Review**
   - Check dashboard each morning
   - Review yesterday's payments
   - Check for overdue invoices

2. **Weekly Tasks**
   - Review aging report (invoices 30+ days old)
   - Follow up on unpaid invoices
   - Check cash flow forecast

3. **Monthly Close**
   - Run profit/loss report
   - Compare to previous month
   - Review expense categories
   - Adjust budget as needed
   - Export to QuickBooks (if integrated)

4. **Job Cost Analysis**
   - Compare estimated vs actual costs
   - Identify jobs with low margins
   - Adjust labor rates or parts markup
   - Improve estimation accuracy

---

## 🔧 Common Scenarios & Solutions

### Scenario 1: Customer Wants to Split Payment

**Situation:** Customer has $5,000 invoice, wants to pay $2,500 now and $2,500 next month.

**Solution:**
1. Accept first payment of $2,500
   - Invoice status: "Partial"
   - Balance due: $2,500
2. System automatically sends reminder email
3. When second payment received:
   - Record $2,500 payment
   - Invoice status: "Paid"
   - System sends "Paid in Full" receipt

### Scenario 2: Insurance Company Short Payment

**Situation:** Insurance approved $10,000, but only paid $9,200 (unexplained deduction).

**Solution:**
1. Record $9,200 insurance payment
2. Invoice status shows $800 balance
3. Create expense record: "Insurance Deduction - Claim #12345" ($800)
4. Follow up with insurance adjuster
5. If resolved: Record supplemental payment
6. If denied: Write off $800 (create adjustment invoice)

### Scenario 3: Supplement Needed Mid-Repair

**Situation:** During teardown, found hidden frame damage ($2,500 additional).

**Solution:**
1. Take photos of damage
2. Create supplement estimate
3. Get insurance approval
4. Create "Supplement" invoice linked to original RO
5. Update original invoice OR create separate supplement invoice
6. Both invoices show in customer account

### Scenario 4: Customer Disputes Charge

**Situation:** Customer questions $150 "Shop Supplies" charge.

**Solution:**
1. Pull up invoice detail
2. Show itemized breakdown:
   - Sandpaper: $25
   - Masking materials: $40
   - Paint additives: $35
   - Cleanup chemicals: $50
3. Show shop supplies policy (10% of parts/labor)
4. If valid dispute: Issue credit memo
5. If not: Document conversation in invoice notes

### Scenario 5: Vendor Bill Overdue

**Situation:** Parts supplier invoice due yesterday, haven't paid yet.

**Solution:**
1. Financial Dashboard shows "Overdue Expenses" alert
2. Click expense record
3. Check:
   - Parts received? ✓
   - Invoice matches PO? ✓
4. Process payment immediately:
   - Record check number
   - Mark expense as "Paid"
   - System updates vendor account

---

## 📈 Key Performance Indicators (KPIs)

### Monitor These Weekly:

1. **Average Job Value**
   - Target: $3,500-$5,000 (varies by market)
   - Formula: Total Revenue / Number of Jobs
   - Track trend over time

2. **Profit Margin %**
   - Target: 35-45% (healthy collision shop)
   - Formula: (Revenue - Costs) / Revenue × 100
   - Industry average: 38%

3. **Days Sales Outstanding (DSO)**
   - Target: 15-30 days (collision repair)
   - Formula: (Accounts Receivable / Revenue) × Days in Period
   - Lower is better (faster payment collection)

4. **Accounts Receivable Aging**
   - Current (0-30 days): 70%+
   - 31-60 days: 20%
   - 61-90 days: 5%
   - Over 90 days: <5% (red flag if higher)

5. **Payment Collection Rate**
   - Target: 95%+ (very high)
   - Formula: Collected Amount / Total Invoiced
   - Track monthly

---

## 🔐 Security & Compliance

### Financial Data Protection:
- All payment data encrypted (PCI DSS compliant via Stripe)
- User role-based access:
  - **Owner**: Full financial access
  - **Manager**: View all, approve expenses
  - **Receptionist**: Create invoices, record payments
  - **Technician**: View assigned jobs only
- Audit log tracks all financial transactions
- Automatic backups (daily)

### Tax Compliance:
- Sales tax automatically calculated by jurisdiction
- Export reports for accountant/CPA
- 1099 vendor tracking (coming soon)
- QuickBooks integration for seamless accounting

---

## 🛠️ Integration with QuickBooks

### Automatic Sync (if enabled):
- **Invoices**: Sync to QuickBooks as Sales Invoices
- **Payments**: Sync as Customer Payments
- **Expenses**: Sync as Bills or Expenses
- **Vendors**: Sync vendor list
- **Chart of Accounts**: Map to your existing accounts

### Sync Frequency:
- Real-time (recommended): Immediate sync
- Daily batch: Overnight sync
- Manual: Sync on-demand

### Setup:
1. Financial Settings → "Integrations"
2. Click "Connect QuickBooks"
3. Authorize access
4. Map accounts (one-time)
5. Enable auto-sync

---

## 📞 Support & Training

### Getting Help:
- **In-App Help**: Click ? icon on any page
- **Video Tutorials**: Help Menu → "Training Videos"
- **Knowledge Base**: docs.collisionos.com/financial
- **Live Chat**: Bottom right corner (business hours)
- **Phone Support**: 1-800-COLLISION (for premium accounts)

### Recommended Training Path:
1. **Week 1**: Invoice creation and payment recording
2. **Week 2**: Expense tracking and vendor management
3. **Week 3**: Financial reporting and analytics
4. **Week 4**: Advanced features (QuickBooks, batch operations)

---

## ✅ Daily Checklist for Shop Owners

### Morning (5 minutes):
- [ ] Review financial dashboard
- [ ] Check overnight payments
- [ ] Review jobs ready for invoicing

### Afternoon (10 minutes):
- [ ] Generate invoices for completed jobs
- [ ] Record any payments received
- [ ] Approve pending expenses

### End of Day (5 minutes):
- [ ] Quick cash reconciliation
- [ ] Review tomorrow's schedule
- [ ] Check overdue invoices (follow up if needed)

---

## 🎯 Maximizing Profitability

### Tips from Successful Shops:

1. **Invoice Immediately**
   - Don't delay billing
   - Faster invoicing = faster payment

2. **Follow Up on Overdue Accounts**
   - Day 31: Friendly email reminder
   - Day 45: Phone call
   - Day 60: Final notice
   - Day 75: Collections agency

3. **Require Deposits on Large Jobs**
   - 50% down on jobs over $5,000
   - Reduces risk, improves cash flow

4. **Track Every Expense**
   - Small expenses add up
   - Tax deduction opportunities
   - Accurate job costing

5. **Review Profit Margins Weekly**
   - Identify unprofitable job types
   - Adjust pricing accordingly
   - Negotiate better parts pricing

6. **Minimize Credit Card Fees**
   - Offer 2% discount for cash/check
   - Use ACH for large payments
   - Build fees into pricing

7. **Maintain Good Vendor Relationships**
   - Pay on time
   - Get early payment discounts
   - Negotiate better terms

---

## 🚨 Red Flags to Watch For

### Warning Signs of Financial Issues:

1. **DSO Increasing**
   - Collections slowing down
   - Need better follow-up process

2. **Profit Margin Declining**
   - Costs rising faster than revenue
   - Need to adjust pricing or reduce costs

3. **High % of Overdue Invoices**
   - Collections problem
   - Consider requiring deposits

4. **Frequent Supplements**
   - Estimating accuracy issue
   - More thorough initial estimates needed

5. **Low Parts Margin**
   - Parts supplier pricing too high
   - Negotiate better rates or switch suppliers

---

## 📊 Sample Financial Reports

### Available Reports:

1. **Profit & Loss Statement**
   - Revenue by category
   - Expenses by category
   - Net profit
   - Month-over-month comparison

2. **Accounts Receivable Aging**
   - Outstanding invoices by age
   - Customer payment history
   - Collection priority list

3. **Job Cost Summary**
   - Estimated vs actual costs
   - Profit margin by job
   - Labor efficiency
   - Parts markup analysis

4. **Cash Flow Forecast**
   - Expected cash in (next 30 days)
   - Expected cash out (bills due)
   - Net cash position
   - Runway analysis

5. **Vendor Spend Analysis**
   - Total spend by vendor
   - Payment terms compliance
   - Discount opportunities

---

## 🎓 Glossary of Financial Terms

- **Accounts Receivable (A/R)**: Money owed to your shop by customers
- **Accounts Payable (A/P)**: Money your shop owes to vendors
- **Deductible**: Customer's out-of-pocket portion (insurance jobs)
- **DSO (Days Sales Outstanding)**: Average days to collect payment
- **FIFO (First In, First Out)**: Inventory valuation method
- **Gross Profit**: Revenue minus cost of goods sold
- **Net Profit**: Revenue minus all expenses
- **Profit Margin**: Net profit as percentage of revenue
- **Sublet**: Work sent to another shop (frame, glass, etc.)
- **Supplement**: Additional repair costs discovered during teardown

---

## 📧 Sample Communication Templates

### Invoice Email Template:
```
Subject: Invoice #INV-25102501-00042 for [CUSTOMER NAME] - [VEHICLE]

Dear [CUSTOMER NAME],

Thank you for choosing [YOUR SHOP NAME] for your collision repair needs!

Your [YEAR] [MAKE] [MODEL] is now ready for pickup.

Invoice Total: $[AMOUNT]
Payment Due: [DUE DATE]

View and pay your invoice online: [INVOICE LINK]

We accept:
- Cash or Check
- Credit/Debit Cards
- Insurance Direct Payment

Questions? Call us at [PHONE] or reply to this email.

Best regards,
[YOUR SHOP NAME] Team
```

### Payment Reminder (Friendly):
```
Subject: Friendly Reminder: Invoice #[NUMBER] Due [DATE]

Hi [CUSTOMER NAME],

Just a friendly reminder that invoice #[NUMBER] for $[AMOUNT] was due on [DATE].

We understand things can slip through the cracks! If you've already sent payment, please disregard this reminder.

Pay online: [INVOICE LINK]

Questions? We're here to help!
[CONTACT INFO]
```

### Payment Reminder (Firm):
```
Subject: URGENT: Overdue Invoice #[NUMBER] - Immediate Action Required

Dear [CUSTOMER NAME],

Our records show invoice #[NUMBER] for $[AMOUNT] is now [DAYS] days overdue.

Please remit payment immediately to avoid:
- Late fees ($[FEE] applied after [DATE])
- Referral to collections agency
- Impact on your credit

Pay now: [INVOICE LINK]

If there's an issue preventing payment, please contact us immediately at [PHONE].

[SHOP NAME] Accounts Receivable
```

---

## ✨ Conclusion

The CollisionOS financial system is designed to streamline your shop's invoicing, payment processing, and financial tracking. By following the best practices in this guide, you'll:

- ✅ Get paid faster
- ✅ Reduce accounting errors
- ✅ Improve cash flow
- ✅ Increase profitability
- ✅ Save time on bookkeeping
- ✅ Make data-driven business decisions

**Need Help?** Contact our support team or schedule a one-on-one training session.

---

*Last Updated: October 25, 2025*
*CollisionOS Version: 1.0*

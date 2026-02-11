# 🏗️ Suraksha Walls - Complete Project Documentation

**Project Name:** Suraksha Walls Management System  
**Version:** 1.0.0  
**Last Updated:** February 10, 2026  
**Tech Stack:** Angular 19, Supabase (PostgreSQL), TypeScript, Ionic Framework

---

## 📑 Table of Contents

1. [Project Overview](#project-overview)
2. [Database Schema](#database-schema)
3. [Supabase Configuration](#supabase-configuration)
4. [Application Architecture](#application-architecture)
5. [Deployment Details](#deployment-details)
6. [Setup Instructions](#setup-instructions)
7. [Feature Modules](#feature-modules)
8. [API Reference](#api-reference)
9. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

Suraksha Walls is a comprehensive business management system that handles:
- **Library Management** - Student enrollment, seat allocation, attendance, fee collection
- **Production Management** - Manufacturing tracking, material usage, worker wages
- **Inventory Management** - Raw materials, finished goods, stock audits
- **Sales & Client Management** - Order processing, invoicing, client ledger
- **Financial Management** - Cash flow, partner settlements, profit/loss reports
- **Worker Management** - Attendance, wage calculation, cumulative balances

### **Key Features:**
- 📚 Library seat booking & attendance tracking
- 🏭 Production entry with automatic material deduction
- 📦 Real-time inventory management
- 💰 Financial reporting & analytics
- 👥 Multi-partner business management
- 📱 WhatsApp integration for receipts
- 🔐 Secure authentication & role-based access

---

## 🗄️ Database Schema

### **Connection Details**

```typescript
Supabase URL: https://lcwjtwidxihclizliksd.supabase.co
Supabase Anon Key: sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh
Database Type: PostgreSQL 15
```

### **Complete Database Structure**

#### **1. Client Management**

##### `client_ledger`
Manages all client information and financial tracking.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Unique client identifier |
| client_name | varchar(200) | NO | - | - | Client's full name |
| phone | varchar(15) | YES | - | - | Contact number |
| address | text | YES | - | - | Full address |
| total_billed | numeric | YES | 0 | - | Total amount billed |
| total_paid | numeric | YES | 0 | - | Total amount paid |
| outstanding | numeric | YES | - | GENERATED | total_billed - total_paid |
| credit_days | integer | YES | 30 | - | Payment credit period |
| credit_limit | numeric | YES | 100000 | - | Maximum credit allowed |
| last_purchase_date | date | YES | - | - | Last order date |
| last_payment_date | date | YES | - | - | Last payment received |
| active | boolean | YES | true | - | Is client active? |
| created_at | timestamp | YES | now() | - | Record creation time |
| updated_at | timestamp | YES | now() | - | Last update time |

---

#### **2. Inventory Management**

##### `finished_goods_inventory`
Tracks all finished products ready for sale.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Product record ID |
| product_name | varchar(100) | NO | - | - | Product name |
| product_variant | varchar(50) | YES | - | - | Product variant/size |
| current_stock | integer | YES | 0 | - | Available quantity |
| unit_cost | numeric | YES | 0 | - | Manufacturing cost per unit |
| unit_price | numeric | YES | 0 | - | Selling price per unit |
| low_stock_alert | integer | YES | 50 | - | Minimum stock threshold |
| total_produced | integer | YES | 0 | - | Total units manufactured |
| total_sold | integer | YES | 0 | - | Total units sold |
| total_wasted | integer | YES | 0 | - | Total units wasted/damaged |
| last_production_date | date | YES | - | - | Last production date |
| last_sale_date | date | YES | - | - | Last sale date |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

##### `raw_materials_master`
Manages all raw materials inventory.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Material ID |
| material_name | varchar(100) | NO | - | UNIQUE | Material name |
| unit | varchar(20) | NO | - | - | Unit of measurement |
| current_stock | numeric | YES | 0 | - | Available stock |
| unit_cost | numeric | YES | 0 | - | Cost per unit |
| low_stock_alert | numeric | YES | 100 | - | Reorder level |
| last_purchase_date | date | YES | - | - | Last purchase date |
| last_purchase_rate | numeric | YES | - | - | Last purchase price |
| active | boolean | YES | true | - | Is material active? |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

---

#### **3. Library Management**

##### `library_students`
All library student records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Student ID |
| name | text | NO | - | - | Student name |
| mobile | text | NO | - | UNIQUE | Mobile number (10 digits) |
| emergency_contact | text | NO | - | - | Emergency contact number |
| emergency_contact_name | text | YES | - | - | Emergency contact person |
| address | text | NO | - | - | Full address |
| dob | date | YES | - | - | Date of birth |
| gender | text | YES | - | - | Male/Female/Other |
| photo_url | text | YES | - | - | Profile photo URL |
| joining_date | date | YES | CURRENT_DATE | - | Registration date |
| registration_fee_paid | integer | YES | 0 | - | One-time registration fee |
| status | text | YES | 'active' | - | active/inactive/suspended |
| notes | text | YES | - | - | Additional notes |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

##### `library_seats`
Seat allocation and tracking.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| seat_no | integer | NO | - | PRIMARY KEY | Seat number (1-100) |
| full_time_student_id | uuid | YES | - | FOREIGN KEY | Full-time student (6AM-10PM) |
| full_time_expiry | date | YES | - | - | Full-time subscription expiry |
| first_half_student_id | uuid | YES | - | FOREIGN KEY | First half student (6AM-2PM) |
| first_half_expiry | date | YES | - | - | First half expiry |
| second_half_student_id | uuid | YES | - | FOREIGN KEY | Second half student (2PM-10PM) |
| second_half_expiry | date | YES | - | - | Second half expiry |
| updated_at | timestamp | YES | now() | - | Last allocation change |

##### `library_fee_payments`
All fee payment transactions.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Payment ID |
| student_id | uuid | YES | - | FOREIGN KEY | Student reference |
| seat_no | integer | YES | - | FOREIGN KEY | Seat reference |
| shift_type | text | NO | - | - | full_time/first_half/second_half/registration |
| amount_paid | integer | NO | - | - | Payment amount (₹) |
| payment_date | date | YES | CURRENT_DATE | - | Payment date |
| valid_from | date | NO | - | - | Subscription start date |
| valid_until | date | NO | - | - | Subscription end date |
| payment_mode | text | YES | 'cash' | - | cash/upi/card |
| transaction_reference | text | YES | - | - | UPI transaction ID |
| notes | text | YES | - | - | Additional notes |
| created_at | timestamp | YES | now() | - | Record creation |

##### `library_attendance`
Daily student attendance records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY | Attendance ID |
| student_id | uuid | NO | - | FOREIGN KEY | Student reference |
| date | date | NO | - | - | Attendance date |
| check_in_time | time | NO | - | - | Check-in time |
| check_out_time | time | YES | - | - | Check-out time |
| status | varchar(20) | NO | - | - | present/late/absent |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | - | Record creation |

**Unique Constraint:** One attendance record per student per day  
**Late Entry Rule:** Check-in after 9:00 AM = 'late' status

##### `library_expenses`
Library operational expenses.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Expense ID |
| date | date | YES | CURRENT_DATE | - | Expense date |
| category | text | NO | - | - | electricity/wifi/water/cleaning/maintenance/stationery/other |
| amount | integer | NO | - | - | Expense amount (₹) |
| vendor_name | text | YES | - | - | Vendor/supplier name |
| description | text | YES | - | - | Expense description |
| payment_mode | text | YES | 'cash' | - | Payment method |
| created_at | timestamp | YES | now() | - | Record creation |

##### `library_cash_ledger`
Complete cash flow tracking for library.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Ledger entry ID |
| date | date | YES | CURRENT_DATE | - | Transaction date |
| type | text | NO | - | - | income/expense |
| category | text | NO | - | - | Transaction category |
| amount | integer | NO | - | - | Amount (₹) |
| description | text | YES | - | - | Transaction details |
| payment_mode | text | YES | - | - | Payment method |
| reference_id | uuid | YES | - | - | Links to payment/expense record |
| created_at | timestamp | YES | now() | - | Record creation |

---

#### **4. Production Management**

##### `production_entries`
Manufacturing/production records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Production entry ID |
| date | date | NO | - | - | Production date |
| product_name | varchar(100) | NO | - | - | Product manufactured |
| product_variant | varchar(50) | YES | - | - | Product variant |
| success_quantity | integer | NO | - | - | Successfully produced units |
| rejected_quantity | integer | NO | - | - | Rejected/defective units |
| total_quantity | integer | YES | - | GENERATED | success + rejected |
| cement_used | numeric | NO | - | - | Cement used (bags) |
| aggregates_used | numeric | NO | - | - | Aggregates used (cft) |
| sariya_used | numeric | NO | - | - | Sariya used (kg) |
| total_material_cost | numeric | YES | - | - | Total material cost |
| labor_cost | numeric | YES | - | - | Total labor wages |
| cost_per_unit | numeric | YES | - | GENERATED | (material + labor) / success_qty |
| is_job_work | boolean | YES | false | - | Is this job work? |
| job_work_client | varchar(100) | YES | - | - | Job work client name |
| notes | text | YES | - | - | Production notes |
| created_by | varchar(100) | YES | - | - | Entry created by |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

##### `product_recipes`
Product manufacturing recipes/BOMs.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Recipe ID |
| product_name | varchar(100) | NO | - | - | Product name |
| product_variant | varchar(50) | YES | - | - | Variant/size |
| mold_volume_cuft | numeric | NO | - | - | Mold volume in cubic feet |
| dry_volume_cuft | numeric | YES | - | GENERATED | mold_volume × 1.7 |
| cement_bags_per_unit | numeric | NO | - | - | Cement required per unit |
| aggregates_cft_per_unit | numeric | NO | - | - | Aggregates required (cft) |
| sariya_kg_per_unit | numeric | NO | - | - | Sariya required (kg) |
| active | boolean | YES | true | - | Is recipe active? |
| notes | text | YES | - | - | Recipe notes |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

**Unique Constraint:** (product_name, product_variant)

##### `material_usage_log`
Tracks material consumption in production.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Log entry ID |
| production_entry_id | uuid | NO | - | FOREIGN KEY | Production reference |
| material_name | varchar(100) | NO | - | - | Material consumed |
| quantity_used | numeric | NO | - | - | Quantity consumed |
| unit_cost | numeric | NO | - | - | Cost per unit |
| total_cost | numeric | YES | - | GENERATED | quantity × unit_cost |
| created_at | timestamp | YES | now() | - | Record creation |

##### `raw_materials_purchase`
Material purchase records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Purchase ID |
| date | date | NO | - | - | Purchase date |
| material_name | varchar(100) | NO | - | - | Material purchased |
| quantity | numeric | NO | - | - | Quantity purchased |
| unit_cost | numeric | NO | - | - | Price per unit |
| total_amount | numeric | YES | - | GENERATED | quantity × unit_cost |
| vendor_name | varchar(200) | YES | - | - | Vendor/supplier name |
| partner_id | uuid | YES | - | FOREIGN KEY | Partner who purchased |
| paid_from | varchar(20) | NO | - | - | office_cash/partner_pocket |
| invoice_number | varchar(50) | YES | - | - | Invoice/bill number |
| notes | text | YES | - | - | Purchase notes |
| created_at | timestamp | YES | now() | - | Record creation |

---

#### **5. Sales Management**

##### `sales_transactions`
All sales/order records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Sale ID |
| date | date | NO | - | - | Sale date |
| client_id | uuid | NO | - | FOREIGN KEY | Client reference |
| product_name | varchar(100) | NO | - | - | Product sold |
| product_variant | varchar(50) | YES | - | - | Product variant |
| quantity | integer | NO | - | - | Units sold |
| rate_per_unit | numeric | NO | - | - | Selling price per unit |
| total_amount | numeric | YES | - | GENERATED | quantity × rate |
| payment_type | varchar(20) | NO | - | - | full/partial/credit |
| paid_amount | numeric | NO | - | - | Amount paid |
| due_amount | numeric | YES | - | GENERATED | total - paid |
| collected_by_partner_id | uuid | YES | - | FOREIGN KEY | Partner who collected |
| deposited_to_firm | boolean | YES | true | - | Money deposited in office? |
| invoice_number | varchar(50) | YES | - | - | Invoice number |
| delivery_status | varchar(20) | YES | 'pending' | - | pending/delivered/cancelled |
| notes | text | YES | - | - | Sale notes |
| created_at | timestamp | YES | now() | - | Record creation |

---

#### **6. Worker Management**

##### `workers_master`
All worker/labor records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Worker ID |
| name | varchar(100) | NO | - | - | Worker name |
| phone | varchar(15) | YES | - | - | Contact number |
| cumulative_balance | numeric | YES | 0 | - | Total amount owed to worker |
| total_days_worked | integer | YES | 0 | - | Total working days |
| total_earned | numeric | YES | 0 | - | Total wages earned |
| total_paid | numeric | YES | 0 | - | Total amount paid |
| active | boolean | YES | true | - | Is worker active? |
| joined_date | date | YES | - | - | Joining date |
| notes | text | YES | - | - | Worker notes |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

##### `wage_entries`
Daily wage records.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Wage entry ID |
| date | date | NO | - | - | Work date |
| worker_id | uuid | NO | - | FOREIGN KEY | Worker reference |
| production_entry_id | uuid | YES | - | FOREIGN KEY | Production reference |
| attendance_type | varchar(20) | NO | - | - | Full Day/Half Day/Outdoor/Custom |
| wage_earned | numeric | NO | - | - | Wage amount earned |
| paid_today | numeric | YES | 0 | - | Amount paid today |
| balance | numeric | YES | - | GENERATED | earned - paid |
| payment_mode | varchar(20) | YES | 'unpaid' | - | cash/unpaid |
| notes | text | YES | - | - | Wage notes |
| created_at | timestamp | YES | now() | - | Record creation |

**Wage Rates:**
- Full Day: ₹400
- Half Day: ₹200
- Outdoor: ₹450
- Custom: Variable

---

#### **7. Financial Management**

##### `firm_cash_ledger`
Company-wide cash flow ledger.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Ledger entry ID |
| date | date | NO | CURRENT_DATE | - | Transaction date |
| type | varchar(20) | NO | - | - | receipt/payment/deposit/withdrawal |
| amount | numeric | NO | - | - | Transaction amount |
| category | varchar(50) | NO | - | - | sales/investment/purchase/wage/operational/partner_withdrawal/adjustment |
| partner_id | uuid | YES | - | FOREIGN KEY | Partner reference |
| deposited_to_firm | boolean | YES | true | - | Is money in firm account? |
| description | text | NO | - | - | Transaction description |
| reference_id | uuid | YES | - | - | Links to source transaction |
| balance_after | numeric | YES | - | - | Balance after transaction |
| created_by | varchar(100) | YES | - | - | Entry created by |
| created_at | timestamp | YES | now() | - | Record creation |

##### `partner_master`
Business partner information.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Partner ID |
| partner_name | varchar(100) | NO | - | - | Partner name |
| share_percentage | numeric | NO | - | - | Profit share % |
| role | varchar(50) | YES | - | - | Partner's role |
| phone | varchar(15) | YES | - | - | Contact number |
| email | varchar(100) | YES | - | - | Email address |
| active | boolean | YES | true | - | Is partner active? |
| joined_date | date | YES | - | - | Partnership start date |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

##### `partner_settlements`
Partner profit/loss settlements.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Settlement ID |
| month | date | NO | - | - | Settlement month |
| partner_id | uuid | NO | - | FOREIGN KEY | Partner reference |
| total_investment | numeric | YES | 0 | - | Total money invested |
| investment_reimbursed | numeric | YES | 0 | - | Investment returned |
| profit_share_percentage | numeric | NO | - | - | Profit share % |
| profit_share_amount | numeric | YES | 0 | - | Calculated profit share |
| total_due | numeric | YES | - | GENERATED | Total amount due |
| amount_paid | numeric | YES | 0 | - | Amount paid |
| balance | numeric | YES | - | GENERATED | due - paid |
| settlement_date | date | YES | - | - | Settlement date |
| status | varchar(20) | YES | 'pending' | - | pending/partial/settled |
| notes | text | YES | - | - | Settlement notes |
| created_at | timestamp | YES | now() | - | Record creation |
| updated_at | timestamp | YES | now() | - | Last update |

---

#### **8. Quality & Audit**

##### `yard_loss`
Tracks product damage/wastage.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Loss record ID |
| date | date | NO | - | - | Loss date |
| product_name | varchar(100) | NO | - | - | Product wasted |
| product_variant | varchar(50) | YES | - | - | Product variant |
| quantity | integer | NO | - | - | Units wasted |
| stage | varchar(20) | NO | - | - | stacking/loading/transport |
| reason | text | YES | - | - | Reason for loss |
| client_name | varchar(200) | YES | - | - | Client (if transport loss) |
| sale_id | uuid | YES | - | FOREIGN KEY | Related sale |
| estimated_loss | numeric | YES | - | - | Financial impact |
| logged_by | varchar(100) | YES | - | - | Who logged the loss |
| created_at | timestamp | YES | now() | - | Record creation |

##### `stock_audit_log`
Physical vs digital stock reconciliation.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | uuid_generate_v4() | PRIMARY KEY | Audit ID |
| date | date | NO | - | - | Audit date |
| material_name | varchar(100) | NO | - | - | Material audited |
| digital_stock | numeric | NO | - | - | System stock |
| physical_count | numeric | NO | - | - | Actual physical count |
| variance | numeric | YES | - | GENERATED | physical - digital |
| variance_percentage | numeric | YES | - | GENERATED | (variance / digital) × 100 |
| reason | text | NO | - | - | Reason for variance |
| approved_by | varchar(100) | NO | - | - | Audit approver |
| partners_notified | boolean | YES | false | - | Partners informed? |
| financial_impact | numeric | YES | - | - | Variance value |
| created_at | timestamp | YES | now() | - | Record creation |

---

## 🔧 Supabase Configuration

### **Database Connection**

```typescript
// src/app/services/supabase.service.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcwjtwidxihclizliksd.supabase.co';
const supabaseAnonKey = 'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

### **Environment Variables (Production)**

For production, store these in Vercel environment variables:

```env
VITE_SUPABASE_URL=https://lcwjtwidxihclizliksd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh
```

### **Database Functions**

#### **Helper Functions Created:**

1. **`get_firm_cash_balance()`** - Returns total firm cash
2. **`get_library_cash_balance()`** - Returns library cash balance
3. **`increment_material_stock(p_material_name, p_quantity)`** - Adds to material stock
4. **`deduct_material_stock(p_material_name, p_quantity)`** - Deducts from material stock
5. **`increment_finished_goods(p_product_name, p_product_variant, p_quantity)`** - Adds/removes finished goods
6. **`update_worker_balance(p_worker_id, p_balance_change, p_earned, p_paid)`** - Updates worker balance
7. **`get_worker_statement(p_worker_id, p_start_date, p_end_date)`** - Worker ledger statement
8. **`get_expiring_seats(days_ahead)`** - Library seats expiring soon

### **Row Level Security (RLS)**

Currently, RLS is set to allow all authenticated users. For production, implement role-based policies:

```sql
-- Example: Restrict access by role
CREATE POLICY "Admin full access" ON production_entries
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Partner view only" ON production_entries
  FOR SELECT USING (auth.jwt() ->> 'role' = 'partner');
```

---

## 🏛️ Application Architecture

### **Application Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN                              │
│                   (Login Component)                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MAIN DASHBOARD                            │
│   ┌──────────────┬──────────────┬──────────────────────┐   │
│   │   Library    │  Production  │  Sales & Clients     │   │
│   │  Management  │  Management  │    Management        │   │
│   └──────┬───────┴──────┬───────┴──────────┬───────────┘   │
└──────────┼──────────────┼──────────────────┼───────────────┘
           │              │                  │
           ▼              ▼                  ▼
     ┌─────────┐    ┌─────────┐      ┌──────────┐
     │ Library │    │Production│      │  Sales   │
     │  Grid   │    │  Entry   │      │  Entry   │
     └────┬────┘    └────┬─────┘      └────┬─────┘
          │              │                  │
          ▼              ▼                  ▼
    ┌─────────────────────────────────────────────┐
    │         SUPABASE DATABASE                   │
    │   (PostgreSQL with Real-time Sync)          │
    └─────────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   ANALYTICS    │
              │   & REPORTS    │
              └────────────────┘
```

### **Service Architecture**

```
Frontend (Angular Components)
    ↓
Service Layer (TypeScript Services)
    ↓
Supabase Client (Database Operations)
    ↓
PostgreSQL Database (Supabase)
```

### **Key Services:**

1. **`library.service.ts`** - Library operations (students, seats, attendance, fees)
2. **`production.service.ts`** - Production entries, material consumption
3. **`inventory.service.ts`** - Stock management
4. **`sales.service.ts`** - Sales transactions
5. **`worker.service.ts`** - Worker wages & management
6. **`client.service.ts`** - Client ledger
7. **`recipe.service.ts`** - Product recipes/BOMs
8. **`reports-new.service.ts`** - Financial reports & analytics
9. **`supabase.service.ts`** - Base database service

### **Component Structure**

```
src/app/
├── guards/
│   └── auth.guard.ts                 # Route protection
├── services/                          # Business logic
│   ├── library.service.ts
│   ├── production.service.ts
│   ├── inventory.service.ts
│   ├── sales.service.ts
│   ├── worker.service.ts
│   └── ...
└── pages/                             # UI Components
    ├── library-grid/                  # Seat management
    ├── library-dashboard/             # Library analytics
    ├── production-entry/              # Production form
    ├── sales-entry/                   # Sales form
    ├── worker-management/             # Worker management
    ├── reports-dashboard/             # Financial reports
    └── ...
```

---

## 🚀 Deployment Details

### **GitHub Repository**

```
Repository URL: https://github.com/surakshawalls-rgb/surakshawalls.git
Branch: master
Access: Private repository
```

**Clone Command:**
```bash
git clone https://github.com/surakshawalls-rgb/surakshawalls.git
cd surakshawalls
npm install
```

### **Vercel Deployment**

```
Project Name: surakshawalls
Framework: Angular
Build Command: npm run build
Output Directory: dist/suraksha-report/browser
```

**Live URLs:**
- **Production:** https://www.surakshawalls.space
- **Vercel URL:** https://surakshawalls.vercel.app

**Deployment Steps:**
1. Push code to GitHub: `git push origin master`
2. Vercel automatically detects changes
3. Builds and deploys within 1-2 minutes
4. Available at both URLs instantly

**Vercel Configuration:**
- Auto-deploy on push to `master` branch
- Environment: Node.js 18.x
- Angular CLI: Latest
- Build time: ~2-3 minutes

### **Domain Configuration (Hostinger)**

```
Domain: surakshawalls.space
Provider: Hostinger
Registrar: Domain purchased from Hostinger
```

**DNS Settings:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Automatic

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**SSL Certificate:** Automatically provided by Vercel (Let's Encrypt)

---

## 📦 Setup Instructions

### **1. Prerequisites**

```bash
Node.js: v18.x or higher
npm: v9.x or higher
Angular CLI: v19.x
Git: Latest version
```

### **2. Local Development Setup**

```bash
# Clone repository
git clone https://github.com/surakshawalls-rgb/surakshawalls.git
cd surakshawalls

# Install dependencies
npm install

# Start development server
ng serve

# Open browser
http://localhost:4200
```

### **3. Build for Production**

```bash
# Build the application
npm run build

# Output will be in dist/suraksha-report/browser/
```

### **4. Database Setup**

Run these SQL scripts in Supabase SQL Editor:

1. **Create all tables** (already done)
2. **Run attendance setup:**
   ```sql
   -- See LIBRARY_ATTENDANCE_SETUP.sql
   ```
3. **Create database functions** (already created)
4. **Set up RLS policies** (optional for security)

### **5. Environment Configuration**

Create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://lcwjtwidxihclizliksd.supabase.co',
  supabaseKey: 'sb_publishable_h161nq_O9ZsC30WbVTaxNg_x9DhrYIh'
};
```

### **6. Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or deploy via **Vercel Dashboard**:
1. Import GitHub repository
2. Configure build settings (auto-detected)
3. Deploy

---

## 🎨 Feature Modules

### **1. Library Management Module**

**Features:**
- 📊 Grid view of all 100 seats (10×10 layout)
- 👥 Student registration & management
- 💺 Seat allocation (Full-time, First Half, Second Half)
- 💰 Fee collection with receipt generation
- ✅ Daily attendance (Check-in/Check-out)
- 📱 WhatsApp receipt sharing
- 📈 Dashboard with analytics
- 📊 Financial reports (revenue, expenses, P&L)
- 📋 Bulk operations (release seats, send messages)

**Components:**
- `library-grid` - Seat grid & allocation
- `library-dashboard` - Analytics & reports
- `library-students` - Student management
- `library-expenses` - Expense tracking

**Routes:**
- `/library-grid` - Main seat management
- `/library-dashboard` - Analytics dashboard
- `/library-students` - Student list
- `/library-expenses` - Expense management

---

### **2. Production Management Module**

**Features:**
- 🏭 Production entry with material auto-deduction
- 📊 Recipe-based material calculation (BOM)
- 👷 Worker wage calculation & tracking
- 📦 Success/rejection tracking
- 💰 Cost per unit calculation
- 📈 Production reports

**Components:**
- `production-entry` - New production form
- `production` - Legacy production view

**Routes:**
- `/production-entry` - Add production
- `/production` - View production history

**Production Flow:**
1. Select product & variant
2. Enter quantities (success + rejected)
3. Select workers & attendance
4. System calculates materials from recipe
5. Deducts materials from stock
6. Records worker wages
7. Updates finished goods inventory

---

### **3. Inventory Management Module**

**Features:**
- 📦 Finished goods tracking
- 🧱 Raw materials management
- 🔔 Low stock alerts
- 📊 Stock valuation reports
- 📈 Material purchase history

**Components:**
- `inventory-view` - Stock overview
- `raw-materials` - Material management
- `material-purchase` - Purchase entry

**Routes:**
- `/inventory-view` - Current inventory
- `/raw-materials` - Material master
- `/material-purchase` - Purchase entry

---

### **4. Sales & Client Module**

**Features:**
- 💼 Client ledger management
- 📝 Sales order entry
- 💰 Payment tracking
- 📊 Outstanding reports
- 📈 Client-wise analytics

**Components:**
- `sales-entry` - Create sales order
- `client-ledger` - Client accounts
- `client-master` - Client management

**Routes:**
- `/sales-entry` - New sale
- `/client-ledger` - Client view
- `/client-master` - Client list

---

### **5. Worker Management Module**

**Features:**
- 👷 Worker master data
- 💰 Wage calculation (Full/Half/Outdoor/Custom)
- 📊 Cumulative balance tracking
- 💸 Payment entries
- 📈 Worker ledger statements

**Components:**
- `worker-management` - Worker CRUD & payments

**Routes:**
- `/worker-management` - Worker management

**Wage Rates:**
- Full Day: ₹400
- Half Day: ₹200
- Outdoor: ₹450
- Custom: Variable

---

### **6. Financial Reports Module**

**Features:**
- 📊 Daily summary
- 📈 Monthly P&L statement
- 💰 Partner settlements
- 👷 Worker ledger
- 📦 Material stock reports
- 💼 Client outstanding
- 📊 Inventory valuation

**Components:**
- `reports-dashboard` - Central reports hub
- `reports` - Legacy reports

**Routes:**
- `/reports-dashboard` - All reports
- `/reports` - Old reports view

---

### **7. Partner Management Module**

**Features:**
- 👥 Partner master
- 💰 Investment tracking
- 📊 Profit/loss calculations
- 💸 Withdrawal management
- 📈 Settlement reports

**Components:**
- `partner-dashboard` - Partner view
- `partner` - Partner expenses
- `partner-withdraw` - Withdrawal entry

**Routes:**
- `/partner-dashboard` - Partner analytics
- `/partner` - Partner expenses
- `/partner-withdraw` - Withdrawals

---

## 📱 API Reference

### **Library Service APIs**

```typescript
// Student Management
getAllStudents(status?: 'active' | 'inactive'): Promise<LibraryStudent[]>
getStudentById(id: string): Promise<LibraryStudent | null>
addStudent(student: Partial<LibraryStudent>): Promise<{success, student?, error?}>
updateStudent(id: string, updates: Partial<LibraryStudent>): Promise<{success, error?}>
deleteStudent(id: string): Promise<{success, error?}>

// Seat Management
getAllSeats(useCache?: boolean): Promise<LibrarySeat[]>
assignSeat(seatNo, studentId, shiftType, validUntil): Promise<{success, error?}>
releaseSeat(seatNo, shiftType?): Promise<{success, error?}>
changeSeat(studentId, oldSeatNo, newSeatNo, shiftType, expiryDate): Promise<{success, error?}>

// Fee Collection
recordFeePayment(payment: Partial<LibraryFeePayment>): Promise<{success, payment?, error?}>
getPaymentHistory(studentId?: string): Promise<LibraryFeePayment[]>
generateReceiptData(payment, student): ReceiptData

// Attendance
checkInStudent(studentId, bypassTimeRestriction?): Promise<{success, attendance?, error?}>
checkOutStudent(studentId, bypassTimeRestriction?): Promise<{success, error?}>
getTodayAttendanceStatus(studentId): Promise<LibraryAttendance | null>
getAttendanceRecords(studentId?, startDate?, endDate?): Promise<LibraryAttendance[]>
getAllTodayAttendance(): Promise<LibraryAttendance[]>

// Reports
getMonthlyRevenueBreakdown(year, month): Promise<RevenueBreakdown[]>
getStudentWisePaymentReport(): Promise<StudentPaymentReport[]>
getExpenseCategoryReport(year, month): Promise<ExpenseReport[]>
getProfitLossStatement(year, month): Promise<PLStatement>
getDashboardStats(): Promise<DashboardStats>
```

### **Production Service APIs**

```typescript
// Production Entry
saveProduction(productionData: ProductionData): Promise<{success, production?, error?}>
deleteProduction(productionId: string): Promise<{success, error?}>
getProduction(from: number, to: number): Promise<ProductionEntry[]>
filterByDate(date: string): Promise<ProductionEntry[]>
getProductionSummary(date: string): Promise<ProductionSummary>
```

### **Inventory Service APIs**

```typescript
// Finished Goods
getInventory(): Promise<FinishedGood[]>
getProductStock(productName, variant?): Promise<FinishedGood | null>
getLowStockAlerts(): Promise<FinishedGood[]>
getInventorySummary(): Promise<InventorySummary>

// Raw Materials
getMaterialsStock(): Promise<MaterialStock[]>
getMaterialStock(materialName): Promise<MaterialStock | null>
getMaterialsLowStockAlerts(): Promise<MaterialStock[]>
```

### **Sales Service APIs**

```typescript
// Sales Management
createSale(saleData: SaleData): Promise<{success, sale?, error?}>
getSales(startDate?, endDate?): Promise<SaleTransaction[]>
updateDeliveryStatus(saleId, status): Promise<{success, error?}>
recordPayment(saleId, amount, date, depositedToFirm): Promise<{success, error?}>
getSalesSummary(startDate, endDate): Promise<SalesSummary>
```

### **Worker Service APIs**

```typescript
// Worker Management
getWorkers(): Promise<Worker[]>
getWorker(workerId): Promise<Worker | null>
addWorker(name, phone?, notes?): Promise<{success, worker?, error?}>
updateWorker(workerId, updates): Promise<{success, error?}>
payWorker(workerId, amount, date, notes?): Promise<{success, error?}>
getWorkerStatement(workerId, startDate?, endDate?): Promise<WorkerStatement[]>
getWorkersWithOutstanding(): Promise<Worker[]>
getTotalLaborLiability(): Promise<number>
```

---

## 🔮 Future Enhancements

### **Phase 1: User Experience (Priority: High)**

1. **Mobile App (Capacitor)**
   - Already configured for Android
   - Build iOS version
   - Push notifications for:
     - Seat expiring alerts
     - Payment reminders
     - Attendance notifications

2. **Dashboard Enhancements**
   - Real-time charts (Chart.js/ApexCharts)
   - KPI widgets
   - Customizable dashboard

3. **Advanced Search & Filters**
   - Global search across all modules
   - Advanced filters on all grids
   - Saved filter presets

### **Phase 2: Automation (Priority: High)**

4. **Automated Notifications**
   - WhatsApp Business API integration
   - Automated fee reminders (3 days before expiry)
   - Birthday wishes to students
   - Low stock alerts
   - Attendance defaulter alerts

5. **Scheduled Reports**
   - Daily EOD report email
   - Weekly summary
   - Monthly P&L statement
   - Partner profit share calculation

6. **Recurring Payments**
   - Auto-generate fee payment links
   - Subscription-based payments
   - UPI autopay integration

### **Phase 3: Advanced Features (Priority: Medium)**

7. **QR Code Integration**
   - Student ID cards with QR
   - QR-based attendance
   - QR-based payments

8. **Multi-Branch Support**
   - Multiple library locations
   - Centralized reporting
   - Branch-wise analytics

9. **Student Portal**
   - Self-service portal for students
   - View attendance history
   - Download receipts
   - Check seat validity
   - Pay fees online

10. **Biometric Integration**
    - Fingerprint attendance
    - Face recognition check-in

### **Phase 4: Business Intelligence (Priority: Medium)**

11. **Advanced Analytics**
    - Predictive analytics (seat demand forecasting)
    - Student retention analysis
    - Revenue trend analysis
    - Seasonal patterns

12. **AI-Powered Insights**
    - Optimal pricing recommendations
    - Student churn prediction
    - Inventory optimization
    - Profitability analysis

13. **Data Export & Integration**
    - Excel export with formatting
    - PDF reports generation
    - Tally integration
    - GST filing assistance

### **Phase 5: Security & Compliance (Priority: High)**

14. **Role-Based Access Control (RBAC)**
    - Admin: Full access
    - Manager: Operations access
    - Accountant: Financial access
    - Staff: Limited access
    - Partner: View-only + reports

15. **Audit Trail**
    - Track all changes (who, what, when)
    - Change history for critical data
    - Rollback capabilities

16. **Data Backup & Recovery**
    - Automated daily backups
    - Point-in-time recovery
    - Disaster recovery plan

17. **Compliance Management**
    - GST invoice generation
    - TDS calculations
    - Professional tax
    - Income tax reports

### **Phase 6: Additional Modules (Priority: Low)**

18. **Inventory Optimization**
    - Reorder point calculation
    - Economic Order Quantity (EOQ)
    - Supplier management
    - Purchase order automation

19. **CRM Features**
    - Lead management
    - Follow-up reminders
    - Email marketing
    - Customer feedback

20. **HR Management**
    - Leave management
    - Payroll integration
    - Performance tracking
    - Staff attendance

### **Technical Improvements**

21. **Performance Optimization**
    - Implement lazy loading
    - Add service workers (PWA)
    - Optimize database queries
    - Image compression

22. **Testing & Quality**
    - Unit tests (Jest)
    - E2E tests (Cypress)
    - Load testing
    - Security audits

23. **DevOps**
    - CI/CD pipeline (GitHub Actions)
    - Automated testing on push
    - Staging environment
    - Database migration scripts

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **1. Database Connection Errors**

**Issue:** Cannot connect to Supabase  
**Solution:**
- Check Supabase URL and API key
- Verify network connection
- Check Supabase dashboard for service status
- Ensure RLS policies allow access

#### **2. Build Errors**

**Issue:** `ng build` fails  
**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
rm -rf .angular
```

#### **3. Routing Issues (404 on refresh)**

**Issue:** Page refreshes show 404  
**Solution:** Check [`vercel.json`](vercel.json ) has proper rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### **4. CORS Errors**

**Issue:** API requests blocked by CORS  
**Solution:**
- Add domain to Supabase allowed origins
- Go to Supabase Dashboard → Settings → API
- Add: `https://www.surakshawalls.space`

---

## 📞 Support & Contact

**Project Maintainer:** Suraksha Walls Team  
**Email:** (Add your email)  
**GitHub:** https://github.com/surakshawalls-rgb  
**Live Site:** https://www.surakshawalls.space

---

## 📄 License

Proprietary - All rights reserved by Suraksha Walls

---

## 📚 Additional Resources

- **Angular Documentation:** https://angular.dev
- **Supabase Documentation:** https://supabase.com/docs
- **Ionic Framework:** https://ionicframework.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

---

**Last Updated:** February 10, 2026  
**Documentation Version:** 1.0.0  
**Application Version:** 1.0.0

---

*This documentation is a living document and should be updated as the project evolves.*

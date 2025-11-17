# Malabar Finance MVP

A personal finance application focused on three core capabilities:

1. **Billing Cycle Cash Flow Tracking** - Track credit card billing cycles by actual statement dates, not calendar months
2. **Credit Card Rewards Optimization** - Get real-time recommendations for which card to use for maximum rewards
3. **Tax Deduction Automation** - Automatically categorize business expenses for tax purposes with ML-driven accuracy

## 🏗️ Current Implementation Status

### ✅ Completed (Phase 1)

- **Project Setup**
  - Next.js 15+ with TypeScript and App Router
  - Tailwind CSS for styling
  - PostgreSQL database with Prisma ORM
  - Comprehensive database schema for all features

- **Plaid Integration**
  - Plaid SDK configuration
  - Link token generation API (`/api/plaid/create-link-token`)
  - Public token exchange API (`/api/plaid/exchange-token`)
  - Liabilities data sync (`/api/plaid/sync-liabilities`)
  - Webhook handler for real-time updates (`/api/webhooks/plaid`)

- **Billing Cycle Detection Algorithm**
  - Pattern analysis from historical data
  - Future cycle projections (6 months ahead)
  - Confidence scoring system
  - Month-end edge case handling
  - Statistical analysis utilities

### 🚧 In Progress

- User authentication with NextAuth.js
- Billing cycle tracking UI with calendar view
- Dashboard components

### 📋 Planned (Phase 2-3)

- Transaction enrichment and categorization
- Rewards card database (top 100 cards)
- Rewards recommendation engine
- Tax categorization ML pipeline
- Browser extension for merchant recommendations
- Receipt OCR integration
- Mobile app

## 🗄️ Database Schema

### Core Models

- **User** - User accounts and preferences
- **PlaidItem** - Plaid connection management
- **CreditCard** - Credit card accounts with pattern metadata
- **BillingCycle** - Individual billing cycles (historical and projected)
- **Transaction** - Transaction records with enrichment data
- **RewardsCard** - Manual card portfolio with rewards structures
- **TaxCategoryRule** - User-defined tax categorization rules

### Key Features

- Pattern-based billing cycle detection
- Confidence scoring for data quality
- Transaction enrichment with Plaid
- Rewards category tracking with spending caps
- Tax categorization with ML feedback loop
- Comprehensive sync and webhook logging

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Plaid API account (sandbox mode for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd malabar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**

   Using Docker (recommended):
   ```bash
   docker-compose up -d
   ```

   Or install PostgreSQL locally and create a database:
   ```bash
   createdb malabar_finance
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   - `DATABASE_URL` - PostgreSQL connection string
   - `PLAID_CLIENT_ID` and `PLAID_SECRET` - From Plaid Dashboard
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

5. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
malabar/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── plaid/            # Plaid integration endpoints
│   │   │   ├── create-link-token/
│   │   │   ├── exchange-token/
│   │   │   └── sync-liabilities/
│   │   └── webhooks/         # Webhook handlers
│   │       └── plaid/
│   ├── dashboard/            # Dashboard pages (TODO)
│   └── page.tsx              # Home page
├── lib/                      # Utilities and configurations
│   ├── prisma.ts             # Prisma client singleton
│   ├── plaid.ts              # Plaid client configuration
│   └── utils/                # Utility functions
│       └── billing-cycle-detector.ts  # Cycle pattern detection
├── types/                    # TypeScript type definitions
│   └── index.ts              # Shared types
├── prisma/                   # Database schema
│   └── schema.prisma
├── components/               # React components (TODO)
└── public/                   # Static assets
```

## 🔧 API Endpoints

### Plaid Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plaid/create-link-token` | POST | Generate Plaid Link token |
| `/api/plaid/exchange-token` | POST | Exchange public token for access token |
| `/api/plaid/sync-liabilities` | POST | Sync credit card billing data |
| `/api/webhooks/plaid` | POST | Handle Plaid webhook events |

### Request Examples

**Create Link Token**
```bash
curl -X POST http://localhost:3000/api/plaid/create-link-token \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..."
```

**Exchange Public Token**
```bash
curl -X POST http://localhost:3000/api/plaid/exchange-token \
  -H "Content-Type: application/json" \
  -d '{"publicToken": "public-sandbox-xxx"}'
```

**Sync Liabilities**
```bash
curl -X POST http://localhost:3000/api/plaid/sync-liabilities \
  -H "Content-Type: application/json" \
  -d '{"plaidItemId": "clx..."}'
```

## 🧮 Billing Cycle Detection Algorithm

### How It Works

1. **Pattern Analysis** - Analyzes 6-12 months of historical data
   - Calculate cycle lengths (days between statements)
   - Detect consistent statement day-of-month
   - Determine due date offset

2. **Confidence Scoring** - Multi-factor confidence calculation
   - Data quantity (more history = higher confidence)
   - Pattern consistency (consistent cycles = higher confidence)
   - Data freshness (recent syncs = higher confidence)

3. **Future Projections** - Project 6 months of future cycles
   - Use detected pattern to predict statement dates
   - Handle month-end edge cases (e.g., Jan 31 → Feb 28)
   - Degrade confidence for distant projections

### Confidence Levels

| Score | Message | Meaning |
|-------|---------|---------|
| 0.85+ | "Updated today from your bank" | High confidence, fresh Plaid data |
| 0.65-0.85 | "Estimated based on your typical cycle pattern" | Medium confidence, inferred |
| 0.45-0.65 | "Projection based on limited data" | Low confidence, needs more history |
| <0.45 | "Unable to sync. Please verify manually" | Very low confidence, manual input needed |

## 🎯 Key Design Decisions

### Why Billing Cycle Tracking?

**Problem**: Most finance apps track by calendar month, but credit card billing cycles don't align with calendar boundaries. This creates cash flow timing mismatches.

**Solution**: Track by actual billing cycle dates, showing exactly when statement closes and payment is due.

**Market Gap**: Surprisingly few products do this despite genuine user need.

### Why Manual Rewards Card Entry?

**Problem**: No comprehensive API exists for credit card rewards data.

**Solution**: Let users manually enter their cards (CardPointers model) instead of attempting to scrape or maintain a 5,000+ card database.

**Trade-off**: More user effort but higher accuracy and no maintenance burden.

### Why Hybrid Tax Categorization?

**Problem**: 100% automated tax categorization violates IRS requirements for business purpose documentation.

**Solution**: ML-driven suggestions (83-96% accuracy) with human-in-the-loop confirmation.

**Compliance**: Maintains IRS audit trail while saving 80%+ of manual categorization time.

## 📊 Technical Architecture

### Data Flow

```
User → Plaid Link → Exchange Token → Create PlaidItem
                                    ↓
                              Fetch Liabilities
                                    ↓
                              Analyze Pattern
                                    ↓
                        Create/Update BillingCycles
                                    ↓
                          Project Future Cycles
```

### Sync Strategy

1. **Initial Sync** - When user connects account via Plaid Link
2. **Webhook-Driven** - Plaid sends `DEFAULT_UPDATE` when new data available
3. **Scheduled Backup** - Daily sync at 6 AM as fallback
4. **On-Demand** - User can manually trigger refresh

### Data Quality Assurance

- Track data source for every field (Plaid vs. inferred vs. manual)
- Calculate confidence scores based on multiple factors
- Display transparency indicators to users
- Allow manual overrides when data is incorrect

## 🔐 Security Considerations

- Plaid access tokens encrypted at rest (TODO: implement encryption)
- NextAuth.js for secure session management
- API routes protected with authentication middleware
- Webhook signature verification (TODO: implement)
- No storage of sensitive PII beyond what's required

## 🧪 Testing Strategy (TODO)

- Unit tests for billing cycle detection algorithm
- Integration tests for Plaid API endpoints
- E2E tests for user flows (Playwright)
- Mock Plaid sandbox data for CI/CD

## 📈 Performance Optimization

- Aggressive caching of Plaid responses (24-hour TTL for liabilities)
- Batch API requests when possible
- Database indexes on frequently queried fields
- Webhook-driven updates instead of polling

## 🐛 Known Issues & Limitations

1. **Plaid Sandbox Limitations**
   - Limited field availability for some institutions
   - Mock data doesn't perfectly represent production

2. **Pattern Detection**
   - Requires 2+ historical cycles for basic pattern
   - 6+ cycles recommended for high confidence
   - Anniversary-based cycles harder to detect

3. **Month-End Edge Cases**
   - Accounts opened on Jan 31 may shift to Feb 28/29
   - Some issuers use inconsistent logic

## 📝 Environment Variables

See `.env.example` for complete list. Key variables:

```bash
# Required
DATABASE_URL="postgresql://..."
PLAID_CLIENT_ID="..."
PLAID_SECRET="..."
NEXTAUTH_SECRET="..."

# Optional
PLAID_WEBHOOK_URL="https://yourdomain.com/api/webhooks/plaid"
OPENAI_API_KEY="sk-..."  # For tax categorization ML
```

## 🤝 Contributing

This is currently a private MVP project. Contribution guidelines will be added when open-sourced.

## 📄 License

Proprietary - All rights reserved

## 🔮 Roadmap

### Phase 1 (Current) - Core Infrastructure
- [x] Database schema
- [x] Plaid integration
- [x] Billing cycle detection
- [ ] Basic UI components
- [ ] User authentication

### Phase 2 (3-6 months) - MVP Features
- [ ] Transaction enrichment
- [ ] Rewards card database (top 100)
- [ ] Basic rewards recommendations
- [ ] Tax categorization (rule-based)
- [ ] Browser extension v1

### Phase 3 (6-12 months) - Advanced Features
- [ ] ML-driven tax categorization
- [ ] Rotating category intelligence
- [ ] Affiliate network integration
- [ ] Receipt OCR
- [ ] Native mobile apps

## 📚 Additional Resources

- [Plaid API Documentation](https://plaid.com/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## 💬 Support

For questions or issues, please contact the development team.

---

**Built with:** Next.js, TypeScript, PostgreSQL, Prisma, Plaid API, Tailwind CSS

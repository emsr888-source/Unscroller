# Creator Mode - Quick Fix Checklist

**Status:** Issues identified, ready to fix  
**Estimated Time:** 2-3 days for critical items

---

## 🔴 CRITICAL - Fix Immediately (2-3 Days)

### 1. Environment Configuration
- [ ] Create `apps/backend/.env.example` with all required variables
- [ ] Document each environment variable
- [ ] Add validation for required env vars on startup
- [ ] Update README with setup instructions

```bash
# Required variables:
DATABASE_URL=postgresql://user:pass@host:port/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_JWT_SECRET=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
OPENAI_API_KEY=sk-xxx  # Optional
POLICY_PRIVATE_KEY_PATH=./keys/policy-private.pem
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:19006
ENABLE_DATABASE=true
ENABLE_AI_SCHEDULER=false  # Prevent accidental OpenAI costs
```

### 2. Policy Key Management
- [ ] Create `apps/backend/keys/` directory
- [ ] Generate RSA key pair
- [ ] Add to .gitignore
- [ ] Create key generation script
- [ ] Document in deployment guide

```bash
#!/bin/bash
# scripts/generate-policy-keys.sh
mkdir -p apps/backend/keys
openssl genrsa -out apps/backend/keys/policy-private.pem 2048
openssl rsa -in apps/backend/keys/policy-private.pem \
  -pubout -out apps/backend/keys/policy-public.pem
echo "✅ Policy keys generated"
```

### 3. Fix CORS Security
- [ ] Replace `origin: true` with whitelist
- [ ] Add ALLOWED_ORIGINS env var
- [ ] Document security implications

```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
});
```

### 4. Mobile Backend URL Configuration
- [ ] Create environment config file
- [ ] Support dev/staging/prod URLs
- [ ] Fix localhost issue on physical devices

```typescript
// apps/mobile/src/config/index.ts
import { Platform } from 'react-native';

export const CONFIG = {
  API_URL: __DEV__
    ? Platform.OS === 'ios' 
      ? 'http://localhost:3000'  // iOS simulator
      : 'http://10.0.2.2:3000'   // Android emulator
    : process.env.REACT_APP_API_URL || 'https://api.creatormode.app',
  
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
  SUPABASE_KEY: process.env.REACT_APP_SUPABASE_KEY,
};
```

### 5. Add Basic Tests
- [ ] Policy engine: validation tests
- [ ] Policy engine: compilation tests  
- [ ] Backend: API endpoint tests
- [ ] Backend: policy signing tests

```bash
# Create test files
touch packages/policy-engine/src/__tests__/parser.test.ts
touch packages/policy-engine/src/__tests__/compiler.test.ts
touch apps/backend/src/policy/__tests__/policy.service.test.ts
```

---

## ⚠️ HIGH PRIORITY - Fix This Week (3-5 Days)

### 6. Database Conditional Logic
- [ ] Simplify app.module.ts database loading
- [ ] Use simple boolean flag instead of complex conditions
- [ ] Allow local PostgreSQL development

```typescript
// apps/backend/src/app.module.ts
const enableDatabase = process.env.ENABLE_DATABASE === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PolicyModule,  // Always available
    AIModule,      // Always available
    ...(enableDatabase ? [
      TypeOrmModule.forRoot({...}),
      AuthModule,
      SubscriptionModule,
      AnalyticsModule,
    ] : []),
  ],
})
```

### 7. Puppeteer Lifecycle Management
- [ ] Fix browser initialization (move out of constructor)
- [ ] Implement proper cleanup (OnModuleDestroy)
- [ ] Add error handling
- [ ] Use browser pooling for performance

```typescript
// apps/backend/src/ai/url-discovery.service.ts
@Injectable()
export class URLDiscoveryService implements OnModuleDestroy {
  private browser: Browser | null = null;

  async onModuleInit() {
    try {
      this.browser = await puppeteer.launch({...});
    } catch (error) {
      this.logger.error('Failed to launch browser:', error);
    }
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

### 8. AI Cost Controls
- [ ] Add OpenAI budget tracking
- [ ] Add request limits per day
- [ ] Make scheduler opt-in (env var)
- [ ] Add dry-run mode by default

```typescript
// apps/backend/src/ai/openai.service.ts
private dailyBudget = parseFloat(process.env.OPENAI_DAILY_BUDGET || '10');
private requestsToday = 0;
private costToday = 0;

async checkBudget() {
  if (this.costToday >= this.dailyBudget) {
    throw new Error('Daily OpenAI budget exceeded');
  }
}

async analyzeURL(...) {
  await this.checkBudget();
  // ... rest of code
  this.costToday += estimatedCost;
  this.requestsToday++;
}
```

### 9. Stripe Webhook Verification
- [ ] Add signature verification
- [ ] Validate webhook source
- [ ] Add error handling

```typescript
// apps/backend/src/subscription/subscription.controller.ts
@Post('webhooks/stripe')
async stripeWebhook(@Req() req: Request, @Res() res: Response) {
  const signature = req.headers['stripe-signature'];
  
  try {
    const event = this.stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await this.subscriptionService.handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    this.logger.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
```

### 10. Mobile Build Scripts
- [ ] Add build script for iOS
- [ ] Add build script for Android
- [ ] Update CI/CD documentation

```json
// apps/mobile/package.json
{
  "scripts": {
    "build": "npm run build:ios && npm run build:android",
    "build:ios": "react-native bundle --platform ios --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios",
    "build:android": "cd android && ./gradlew assembleRelease"
  }
}
```

---

## 💡 MEDIUM PRIORITY - Fix This Month (1-2 Weeks)

### 11. Policy Version Consistency
- [ ] Standardize version format (use semver everywhere)
- [ ] Update policy.json version to match
- [ ] Add version validation

### 12. YouTube Aggressive Mode
- [ ] Switch default to "safe" mode
- [ ] Refine aggressive mode patterns
- [ ] Document trade-offs

### 13. Instagram CDN Coverage
- [ ] Add missing CDN patterns
- [ ] Test image loading in DMs
- [ ] Update policy.json

### 14. Error Boundaries (Mobile)
- [ ] Add React error boundary wrapper
- [ ] Show user-friendly error screen
- [ ] Log errors to analytics

### 15. API Rate Limiting
- [ ] Add express-rate-limit to backend
- [ ] Protect AI endpoints (expensive)
- [ ] Protect auth endpoints (security)

```typescript
import rateLimit from 'express-rate-limit';

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 min
});

app.use('/api/ai', aiLimiter);
```

---

## 📋 NICE TO HAVE - Future Enhancements

### Developer Experience
- [ ] Add Docker Compose for local development
- [ ] Create setup script (one-command setup)
- [ ] Add VS Code launch configurations
- [ ] Add API documentation (Swagger)

### Monitoring & Observability
- [ ] Add Sentry for error tracking
- [ ] Add performance monitoring
- [ ] Add uptime checks
- [ ] Create metrics dashboard

### Testing
- [ ] Unit tests (80% coverage goal)
- [ ] Integration tests
- [ ] E2E tests (Cypress/Detox)
- [ ] Performance tests

### CI/CD
- [ ] GitHub Actions workflows
- [ ] Automated testing
- [ ] Automated deployments
- [ ] Version bumping automation

---

## 🚀 Implementation Order

### Day 1: Environment & Security
1. Create .env.example ✅
2. Generate policy keys ✅
3. Fix CORS ✅
4. Document setup process ✅

### Day 2: Configuration & Fixes
5. Mobile backend URL config ✅
6. Database conditional logic ✅
7. Puppeteer lifecycle ✅
8. AI cost controls ✅

### Day 3: Security & Testing
9. Stripe webhook verification ✅
10. Mobile build scripts ✅
11. Write initial tests ✅
12. Test full flow ✅

### Week 2: Polish & Features
- Policy improvements
- Error handling
- Rate limiting
- Documentation updates

### Week 3-4: Production Prep
- Full test coverage
- Monitoring setup
- CI/CD pipelines
- Security audit

---

## ✅ Success Criteria

**Before deploying to production:**

- [ ] All critical issues fixed
- [ ] Environment fully documented
- [ ] Keys properly managed (not ephemeral)
- [ ] CORS properly configured
- [ ] Core functionality tested
- [ ] Security vulnerabilities addressed
- [ ] AI costs controlled
- [ ] Mobile app connects to backend
- [ ] Policy updates work correctly
- [ ] Stripe webhooks verified
- [ ] Error handling in place
- [ ] Monitoring configured
- [ ] Documentation complete

---

**Last Updated:** October 16, 2025  
**Status:** Ready to implement  
**Priority:** Start with Critical section


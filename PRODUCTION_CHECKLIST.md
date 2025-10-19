# Production Deployment Checklist

Complete this checklist before launching Creator Mode to production.

## 🔐 Security

### Secrets & Keys
- [ ] Generate production RSA key pair for policy signing
- [ ] Store private key in secure vault (AWS KMS, HashiCorp Vault, etc.)
- [ ] Rotate all development API keys
- [ ] Set up environment variables in production (never commit secrets)
- [ ] Enable HTTPS on backend
- [ ] Configure CORS to production domains only
- [ ] Set secure cookie flags (`httpOnly`, `secure`, `sameSite`)

### Authentication
- [ ] Create production Supabase project
- [ ] Enable RLS (Row Level Security) on all tables
- [ ] Configure Supabase Auth providers (Apple, Google)
- [ ] Set up email templates for magic links
- [ ] Configure OAuth redirect URLs
- [ ] Set up rate limiting on auth endpoints

### Code Signing
- [ ] Purchase Apple Developer account ($99/year)
- [ ] Purchase Google Play Developer account ($25 one-time)
- [ ] Purchase Windows code signing certificate
- [ ] Set up macOS notarization
- [ ] Configure Android app signing key

## 💳 Subscriptions

### iOS (StoreKit2)
- [ ] Create App Store Connect account
- [ ] Set up in-app purchase products ($9.99/month)
- [ ] Configure subscription groups
- [ ] Set up RevenueCat or direct StoreKit2 integration
- [ ] Test with Sandbox accounts
- [ ] Set up App Store Server Notifications webhook

### Android (Play Billing)
- [ ] Create Google Play Console account
- [ ] Set up subscription products ($9.99/month)
- [ ] Configure billing permissions
- [ ] Test with test accounts
- [ ] Set up Real-time Developer Notifications (RTDN)

### Desktop (Stripe)
- [ ] Create Stripe account
- [ ] Set up Stripe Checkout
- [ ] Create subscription product ($9.99/month)
- [ ] Configure Stripe webhooks
- [ ] Test with Stripe test mode
- [ ] Enable 3D Secure (SCA compliance)
- [ ] Set up Stripe Customer Portal

## 📱 Mobile Apps

### iOS
- [ ] Configure bundle ID: `com.creatormode.app`
- [ ] Set up App Store Connect app listing
- [ ] Create screenshots (6.7", 6.5", 5.5" displays)
- [ ] Write App Store description (see README for copy)
- [ ] Set up privacy policy URL
- [ ] Set up support URL
- [ ] Fill out App Privacy details
- [ ] Enable In-App Purchase capability
- [ ] Add Supabase URL schemes to Info.plist
- [ ] Set minimum iOS version (14.0+)
- [ ] Build and upload to TestFlight
- [ ] Internal testing → External testing → Production
- [ ] Submit for App Review

### Android
- [ ] Configure applicationId: `com.creatormode.app`
- [ ] Set up Play Console app listing
- [ ] Create screenshots (phone, tablet)
- [ ] Write Play Store description
- [ ] Set up privacy policy URL
- [ ] Fill out Data safety section
- [ ] Configure app signing (Play App Signing)
- [ ] Set minimum SDK version (API 24+)
- [ ] Build signed APK/AAB
- [ ] Upload to Internal track
- [ ] Internal testing → Closed testing → Production
- [ ] Submit for review

## 💻 Desktop Apps

### macOS
- [ ] Set up Apple Developer ID certificate
- [ ] Configure app entitlements
- [ ] Enable hardened runtime
- [ ] Notarize the app
- [ ] Test on macOS 11+ (Big Sur and later)
- [ ] Set up auto-update server
- [ ] Create DMG installer
- [ ] Upload to website or Mac App Store

### Windows
- [ ] Purchase code signing certificate
- [ ] Sign executable with certificate
- [ ] Test on Windows 10/11
- [ ] Create NSIS installer
- [ ] Set up auto-update server
- [ ] Upload to website or Microsoft Store

### Linux
- [ ] Build AppImage
- [ ] Build .deb package
- [ ] Build .rpm package
- [ ] Test on Ubuntu, Fedora, Arch
- [ ] Upload to website

## 🖥️ Backend

### Database
- [ ] Set up production PostgreSQL database
- [ ] Enable SSL connections
- [ ] Configure connection pooling
- [ ] Set up automated backups
- [ ] Create read replicas (optional)
- [ ] Run database migrations
- [ ] Seed initial data (if needed)

### Hosting
- [ ] Deploy to production server (Railway, Render, Fly.io, AWS, etc.)
- [ ] Configure custom domain
- [ ] Enable HTTPS (Let's Encrypt or CloudFlare)
- [ ] Set up health check endpoint
- [ ] Configure auto-scaling (if needed)
- [ ] Set up logging (CloudWatch, Datadog, etc.)
- [ ] Set up error tracking (Sentry)

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
POLICY_PRIVATE_KEY_PATH=/secure/path/policy-private.pem
```

### Webhooks
- [ ] Configure Stripe webhook endpoint: `https://api.creatormode.com/api/webhooks/stripe`
- [ ] Test webhook delivery
- [ ] Set up retry logic for failed webhooks

## 📊 Monitoring

### Error Tracking
- [ ] Set up Sentry for backend
- [ ] Set up Sentry for mobile apps
- [ ] Set up Sentry for desktop app
- [ ] Configure error alerts

### Analytics
- [ ] Set up PostHog or similar (optional)
- [ ] Track key events: sign_up, subscription, provider_opened
- [ ] Set up conversion funnels
- [ ] Create dashboard

### Performance
- [ ] Set up APM (New Relic, Datadog)
- [ ] Monitor backend response times
- [ ] Monitor database query performance
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot)

### Alerts
- [ ] Backend downtime alert
- [ ] Database connection failures
- [ ] Failed payment alerts
- [ ] Policy signature verification failures
- [ ] High error rate alerts

## 🌐 Web & Marketing

### Website
- [ ] Create landing page
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Add support/contact page
- [ ] Set up custom domain: `creatormode.com`
- [ ] Enable HTTPS

### App Store Optimization (ASO)
- [ ] Research keywords
- [ ] Optimize app title and subtitle
- [ ] Create compelling screenshots
- [ ] Write engaging description
- [ ] Add preview videos (optional)

### Launch Materials
- [ ] Product Hunt submission
- [ ] Press release
- [ ] Social media posts
- [ ] Email announcement (if mailing list)

## 📝 Legal & Compliance

### Privacy
- [ ] Create privacy policy (GDPR, CCPA compliant)
- [ ] Implement data deletion request flow
- [ ] Implement data export request flow
- [ ] Add cookie consent (if web version)

### Terms
- [ ] Create terms of service
- [ ] Create refund policy
- [ ] Create acceptable use policy

### Compliance
- [ ] GDPR compliance (EU users)
- [ ] CCPA compliance (California users)
- [ ] App Store Review Guidelines compliance
- [ ] Play Store policies compliance
- [ ] Stripe terms compliance

## 🧪 Testing

### Pre-Launch Testing
- [ ] End-to-end testing on all platforms
- [ ] Subscription flows (purchase, restore, cancel)
- [ ] Policy enforcement on all 6 providers
- [ ] Navigation blocking verification
- [ ] Quick actions functionality
- [ ] Offline entitlement caching
- [ ] Remote policy updates
- [ ] Cross-device entitlement sync

### Load Testing
- [ ] Backend API load testing
- [ ] Database query optimization
- [ ] CDN caching for policy JSON

### Security Testing
- [ ] Penetration testing
- [ ] OWASP Top 10 verification
- [ ] JWT validation testing
- [ ] Policy signature verification

## 🚀 Launch Day

### Pre-Launch (T-1 day)
- [ ] Final code freeze
- [ ] Deploy backend to production
- [ ] Upload mobile apps to stores (pending review)
- [ ] Upload desktop apps to website
- [ ] Sign and upload production policy
- [ ] Send to beta testers for final check

### Launch (T-0)
- [ ] Submit iOS app for review
- [ ] Submit Android app for review
- [ ] Publish desktop apps
- [ ] Announce on social media
- [ ] Submit to Product Hunt
- [ ] Monitor error logs

### Post-Launch (T+1 week)
- [ ] Monitor conversion rates
- [ ] Address critical bugs
- [ ] Respond to user feedback
- [ ] Optimize based on metrics
- [ ] Plan first update

## 📈 Post-Launch Optimization

### Week 1
- [ ] Monitor crash reports
- [ ] Fix critical bugs
- [ ] Respond to app store reviews
- [ ] Track subscription metrics

### Month 1
- [ ] Analyze user retention
- [ ] Identify drop-off points
- [ ] A/B test paywall
- [ ] Optimize onboarding

### Month 3
- [ ] Evaluate provider usage
- [ ] Consider adding new providers
- [ ] Evaluate YouTube filter modes usage
- [ ] Plan feature updates

## ✅ Final Checklist

Before going live, verify:
- [ ] All secrets rotated and secured
- [ ] All platforms tested end-to-end
- [ ] Subscription flows work correctly
- [ ] Backend is deployed and healthy
- [ ] Monitoring and alerts configured
- [ ] Legal documents in place
- [ ] Support channels ready
- [ ] Launch materials prepared

---

**Production Launch Date**: _____________

**Sign-off**: _____________ (Engineering) _____________ (Product)

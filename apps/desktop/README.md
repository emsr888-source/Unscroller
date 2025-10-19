# Creator Mode Desktop

Electron-based desktop application with policy-enforced web browsing.

## ✅ Setup Complete!

The desktop app is ready to run!

## 🚀 Quick Start

```bash
# Run in development mode
npm run dev

# Or build and run separately
npm run build
npm start
```

## 🎯 What It Does

The desktop app provides:
- **Provider Grid**: Select Instagram, X, YouTube, TikTok, etc.
- **Policy Enforcement**: Blocks feeds, Reels, Shorts using web request filtering
- **WebView Isolation**: Each provider runs in its own sandboxed webview
- **Cross-Platform**: Works on macOS, Windows, and Linux

## 📁 Structure

```
src/
├── main/
│   ├── index.ts              # Main process (Electron)
│   ├── policy-manager.ts     # Policy fetching & caching
│   ├── web-request-filter.ts # URL blocking
│   └── auth-manager.ts       # Supabase auth
├── preload/
│   └── index.ts              # IPC bridge
└── renderer/
    ├── index.html            # UI
    └── app.ts                # Frontend logic
```

## 🔧 Configuration

### Backend URL

Set the backend URL via environment variable:

```bash
# Development (default)
BACKEND_URL=http://localhost:3000 npm run dev

# Production
BACKEND_URL=https://api.creatormode.com npm run dev
```

Or edit `src/main/policy-manager.ts`:
```typescript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
```

### Policy Caching

Policies are cached using `electron-store` at:
- **macOS**: `~/Library/Application Support/creator-mode-desktop/config.json`
- **Windows**: `%APPDATA%\creator-mode-desktop\config.json`
- **Linux**: `~/.config/creator-mode-desktop/config.json`

## 🌐 Features

### Policy Enforcement
- Fetches policy from backend API
- Validates and compiles rules per provider
- Blocks URLs matching `blockPatterns`
- Allows URLs matching `allowPatterns`

### WebView Management
- Chromium-based webviews for each provider
- Isolated sessions per provider
- Web request filtering before page load
- Navigation interception

### Authentication
- Supabase integration
- Secure credential storage via `keytar`
- Cross-platform keychain support

## 🐛 Troubleshooting

### "Failed to fetch policy"

**Cause**: Backend is not running or URL is wrong

**Solution**:
1. Start the backend:
   ```bash
   cd ../backend
   npm run start:dev
   ```
2. Or use a production backend URL

### Blank Screen

**Cause**: Renderer build failed

**Solution**:
```bash
npm run build
```

### WebView Not Loading

**Cause**: CSP or network restrictions

**Solution**: Check the console logs in DevTools (View → Toggle Developer Tools)

## 📦 Building for Production

### Development Build
```bash
npm run build
npm start
```

### Package for Distribution

```bash
# macOS
npm run package:mac

# Windows
npm run package:win

# Linux
npm run package:linux
```

Outputs will be in `release/` directory.

## 🔑 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:3000` | Policy backend API |
| `SUPABASE_URL` | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | - | Supabase anonymous key |

## 🎨 Customization

### Add New Provider

Edit `src/renderer/app.ts` to add provider cards dynamically from the policy.

### Modify UI

Edit `src/renderer/index.html` for styles and structure.

### Change Blocking Logic

Edit `src/main/web-request-filter.ts` to customize URL filtering.

## 📊 Dependencies

**Runtime:**
- `electron` - Desktop framework
- `electron-store` - Settings persistence
- `keytar` - Secure credential storage
- `@creator-mode/policy-engine` - Policy parsing/compilation
- `@supabase/supabase-js` - Auth & backend

**Development:**
- `typescript` - Type safety
- `webpack` - Renderer bundling
- `electron-builder` - Distribution packaging

## 🚀 What's Next?

1. **Start the backend** (optional):
   ```bash
   cd ../backend
   npm run start:dev
   ```

2. **Configure Supabase** (optional):
   - Add credentials to environment or code

3. **Test browsing**:
   - Click a provider
   - Navigate to allowed pages
   - Try accessing blocked pages (should be blocked)

4. **Package for distribution**:
   ```bash
   npm run package:mac
   ```

## ✅ Status

- [x] TypeScript compiled
- [x] Webpack bundled
- [x] Electron configured
- [x] Policy manager implemented
- [x] Web request filtering implemented
- [x] Auth manager implemented
- [x] UI built
- [x] Ready to run!

---

**Built successfully!** Run `npm run dev` to start the app. 🚀

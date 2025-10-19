# Get Your Supabase Database Connection String

## Quick Steps:

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/polfwrbkjbknivyuyrwf

2. **Click on "Project Settings"** (gear icon in left sidebar)

3. **Click on "Database"** in the settings menu

4. **Scroll down to "Connection String"**

5. **Select "URI"** tab

6. **Copy the connection string** - it will look like:
   ```
   postgresql://postgres.polfwrbkjbknivyuyrwf:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
   ```
   
   OR
   
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.polfwrbkjbknivyuyrwf.supabase.co:5432/postgres
   ```

7. **Replace `[YOUR-PASSWORD]` with your actual password**: `Iamrich8!`

8. **Paste into .env file**

## Common Formats:

### Session Mode (Port 5432) - Direct Connection
```
postgresql://postgres:[password]@db.polfwrbkjbknivyuyrwf.supabase.co:5432/postgres
```

### Transaction Mode (Port 6543) - Connection Pooler (Recommended for serverless)
```
postgresql://postgres.polfwrbkjbknivyuyrwf:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Session Mode (Port 5432) - Connection Pooler
```
postgresql://postgres.polfwrbkjbknivyuyrwf:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Which One to Use?

- **For local development**: Use Session Mode (port 5432) with direct connection
- **For production/serverless**: Use Transaction Mode (port 6543) with pooler

## If Direct Connection Doesn't Work:

The database might not be publicly accessible. In Supabase dashboard:

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection Pooling**
3. Copy the **Pooler Connection String** instead
4. Make sure **"Enable connection pooling"** is turned on

---

**After updating .env, restart the backend:**
```bash
# Press Ctrl+C to stop
npm run start:dev
```

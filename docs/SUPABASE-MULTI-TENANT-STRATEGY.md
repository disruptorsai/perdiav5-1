# Supabase Multi-Tenant Strategy for AI Content Engine

**Version:** 1.0
**Date:** December 9, 2025
**Purpose:** Cost-effective multi-tenant architecture using a single Supabase project

---

## Executive Summary

**The Problem:** Creating a separate Supabase project for each client would cost $25+/month per client (Pro plan), making the platform economically unviable at scale.

**The Solution:** Use a **single shared Supabase project** with **Row-Level Security (RLS)** for tenant isolation. This approach:
- **Costs:** $25/month base + usage (regardless of client count)
- **Security:** Database-level isolation prevents data leaks even if code has bugs
- **Scalability:** Can support hundreds of tenants on one project
- **Simplicity:** Single database, single migration path, single deployment

---

## Table of Contents

1. [Architecture Decision](#1-architecture-decision)
2. [Tenant Isolation via RLS](#2-tenant-isolation-via-rls)
3. [Authentication Strategy](#3-authentication-strategy)
4. [Database Schema](#4-database-schema)
5. [Storage Isolation](#5-storage-isolation)
6. [Edge Functions](#6-edge-functions)
7. [Realtime Subscriptions](#7-realtime-subscriptions)
8. [API Keys & Secrets](#8-api-keys--secrets)
9. [Migrations & Deployments](#9-migrations--deployments)
10. [Performance Optimization](#10-performance-optimization)
11. [Cost Analysis](#11-cost-analysis)
12. [Implementation Guide](#12-implementation-guide)

---

## 1. Architecture Decision

### Options Compared

| Approach | Cost (10 clients) | Cost (100 clients) | Isolation | Complexity |
|----------|-------------------|--------------------|-----------| -----------|
| **Separate Projects** | $250/month | $2,500/month | Strongest | High (100 projects) |
| **Schema-per-Tenant** | $25/month | $25/month | Strong | Medium |
| **Shared Tables + RLS** | $25/month | $25/month | Strong | Low |

### Recommendation: Shared Tables + RLS

**Why this wins for your use case:**

1. **Cost Efficiency:** Single $25/month Pro project supports all clients
2. **Security:** RLS provides database-level isolation - even buggy code can't leak data
3. **Simplicity:** One database schema, one migration path, one deployment
4. **Supabase Native:** This is the recommended pattern from Supabase for multi-tenancy
5. **Proven:** Used by companies with millions of users across thousands of tenants

### When You Might Need Separate Projects

Consider separate projects only if:
- Client requires **dedicated infrastructure** (compliance/legal)
- Client needs **custom Supabase configuration** (e.g., different regions)
- Client has **extreme scale** (millions of rows, dedicated compute)

For these cases, charge a premium and spin up dedicated projects.

---

## 2. Tenant Isolation via RLS

### How RLS Works

Row-Level Security adds an invisible `WHERE` clause to every query:

```sql
-- User queries:
SELECT * FROM articles;

-- Postgres actually executes:
SELECT * FROM articles WHERE tenant_id = 'users-tenant-id';
```

Even if your code forgets to filter by tenant, **the database enforces it**.

### Core RLS Pattern

```sql
-- 1. Enable RLS on every tenant-scoped table
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 2. Create policy that filters by tenant_id from JWT
CREATE POLICY "tenant_isolation" ON articles
FOR ALL
USING (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);

-- 3. Repeat for all tenant-scoped tables
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON content_ideas
FOR ALL USING (
  tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);
```

### Helper Function for Cleaner Policies

```sql
-- Create a reusable function to get current tenant
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  )
$$;

-- Now policies are simpler:
CREATE POLICY "tenant_isolation" ON articles
FOR ALL USING (tenant_id = auth.tenant_id());
```

### Admin Bypass for Platform Operations

```sql
-- Create admin role that bypasses RLS
CREATE ROLE platform_admin WITH BYPASSRLS;

-- Or use service role key (bypasses all RLS)
-- supabase.createClient(url, SERVICE_ROLE_KEY)
```

---

## 3. Authentication Strategy

### The Challenge

In Supabase Auth:
- Each email must be unique in `auth.users`
- Users belong to one project (your shared project)
- You need to associate users with tenants

### Solution: Store tenant_id in app_metadata

```javascript
// When user signs up or is invited to a tenant
const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  userId,
  {
    app_metadata: {
      tenant_id: 'uuid-of-tenant',
      role: 'editor', // Optional: role within tenant
    }
  }
);
```

**Critical:** Use `app_metadata`, NOT `user_metadata`
- `app_metadata` - Server-only, user cannot modify
- `user_metadata` - User can modify (security risk!)

### Custom Access Token Hook (Recommended)

For dynamic tenant assignment, use a Custom Access Token Hook:

```sql
-- supabase/migrations/xxx_create_custom_access_token_hook.sql

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  tenant_id uuid;
BEGIN
  -- Get user's tenant from your tenant_users table
  SELECT tu.tenant_id INTO tenant_id
  FROM tenant_users tu
  WHERE tu.user_id = (event->>'user_id')::uuid
  LIMIT 1;

  -- Build claims
  claims := event->'claims';

  IF tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata, tenant_id}', to_jsonb(tenant_id::text));
  END IF;

  -- Return modified event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

Enable in Supabase Dashboard: **Auth > Hooks > Custom Access Token**

### Multi-Tenant User Flow

```
User Signs Up
    ↓
Create auth.users record
    ↓
Create tenant_users record (user_id → tenant_id)
    ↓
Custom Access Token Hook adds tenant_id to JWT
    ↓
All queries automatically filtered by RLS
```

### Handling Users in Multiple Tenants

If a user can belong to multiple tenants:

```javascript
// Option 1: Tenant switcher (updates app_metadata)
async function switchTenant(userId, newTenantId) {
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { tenant_id: newTenantId }
  });
  // User must refresh session to get new JWT
}

// Option 2: Pass tenant in request headers (more complex)
// Requires custom RLS policies that read from request headers
```

---

## 4. Database Schema

### Tenant Tables

```sql
-- Core tenant table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Branding
  app_name TEXT DEFAULT 'Content Engine',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',

  -- Domain
  primary_domain TEXT,
  allowed_domains TEXT[] DEFAULT '{}',
  blocked_domains TEXT[] DEFAULT '{}',

  -- Subscription
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS on tenants - only accessed via service role or specific policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_tenant" ON tenants
FOR SELECT USING (id = auth.tenant_id());

-- Tenant-user relationship
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor', -- admin, editor, writer, viewer

  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, user_id)
);

-- RLS for tenant_users
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_memberships" ON tenant_users
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_can_manage_memberships" ON tenant_users
FOR ALL USING (
  tenant_id = auth.tenant_id()
  AND EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = auth.tenant_id()
    AND role = 'admin'
  )
);
```

### Content Tables (with tenant_id)

```sql
-- Articles table (example of tenant-scoped content)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  -- Content
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',

  -- Metadata
  contributor_id UUID REFERENCES tenant_contributors(id),
  quality_score INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Index on tenant_id (critical for RLS performance)
CREATE INDEX idx_articles_tenant_id ON articles(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_tenant_created ON articles(tenant_id, created_at DESC);

-- RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON articles
FOR ALL USING (tenant_id = auth.tenant_id());
```

### Tenant-Specific Configuration Tables

```sql
-- Tenant contributors (authors)
CREATE TABLE tenant_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  style_proxy TEXT,

  -- Voice profile
  voice_description TEXT,
  writing_guidelines TEXT,
  signature_phrases TEXT[] DEFAULT '{}',
  phrases_to_avoid TEXT[] DEFAULT '{}',

  -- Expertise
  expertise_areas TEXT[] DEFAULT '{}',
  content_types TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contributors_tenant ON tenant_contributors(tenant_id);

ALTER TABLE tenant_contributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_contributors
FOR ALL USING (tenant_id = auth.tenant_id());

-- Tenant settings (key-value store)
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,

  UNIQUE(tenant_id, key)
);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenant_settings
FOR ALL USING (tenant_id = auth.tenant_id());

-- Tenant API keys (encrypted)
CREATE TABLE tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  service TEXT NOT NULL, -- grok, claude, stealthgpt, wordpress

  -- Encrypted with pgcrypto
  encrypted_key TEXT NOT NULL,

  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys only accessible via service role (not through client)
ALTER TABLE tenant_api_keys ENABLE ROW LEVEL SECURITY;
-- No client-facing policies - accessed only via Edge Functions
```

### Migration Script to Add tenant_id to Existing Tables

```sql
-- Migration: Add tenant_id to existing Perdia tables

-- 1. Create default tenant for GetEducated
INSERT INTO tenants (id, name, slug, app_name, primary_domain)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'GetEducated',
  'geteducated',
  'Perdia',
  'geteducated.com'
);

-- 2. Add tenant_id to articles
ALTER TABLE articles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
UPDATE articles SET tenant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
ALTER TABLE articles ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX idx_articles_tenant ON articles(tenant_id);

-- 3. Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON articles
FOR ALL USING (tenant_id = auth.tenant_id());

-- 4. Repeat for all tables: content_ideas, clusters, keywords, etc.
```

---

## 5. Storage Isolation

### Folder-Based Isolation Pattern

Store files in tenant-prefixed folders:

```
storage/
└── content-assets/           (bucket)
    ├── tenant-uuid-1/        (tenant folder)
    │   ├── logos/
    │   ├── article-images/
    │   └── uploads/
    ├── tenant-uuid-2/
    │   ├── logos/
    │   └── article-images/
    └── ...
```

### RLS Policies for Storage

```sql
-- Policy: Users can only access files in their tenant's folder
CREATE POLICY "tenant_storage_isolation"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = auth.tenant_id()::text
);

-- Policy: Users can upload to their tenant's folder
CREATE POLICY "tenant_upload_policy"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'content-assets'
  AND (storage.foldername(name))[1] = auth.tenant_id()::text
);
```

### Client-Side Upload Pattern

```typescript
// Always prefix uploads with tenant_id
async function uploadFile(file: File, path: string) {
  const tenantId = await getTenantId();
  const fullPath = `${tenantId}/${path}`;

  const { data, error } = await supabase.storage
    .from('content-assets')
    .upload(fullPath, file);

  return data;
}

// Example usage
await uploadFile(logoFile, 'logos/logo.png');
// Uploads to: content-assets/tenant-uuid/logos/logo.png
```

---

## 6. Edge Functions

### Tenant-Aware Edge Functions

Edge Functions run in isolated V8 contexts per request. Pass tenant context explicitly:

```typescript
// supabase/functions/generate-article/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. Get user's JWT from Authorization header
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  // 2. Create Supabase client with user's JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // 3. Get user and tenant info
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = user?.app_metadata?.tenant_id;

  if (!tenantId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 4. Get tenant's API keys (using service role)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: apiKeys } = await supabaseAdmin
    .from('tenant_api_keys')
    .select('service, encrypted_key')
    .eq('tenant_id', tenantId);

  // 5. Decrypt and use API keys
  const grokKey = await decryptKey(apiKeys.find(k => k.service === 'grok')?.encrypted_key);

  // 6. Generate article using tenant's API key
  const article = await generateWithGrok(grokKey, req.body);

  // 7. Save to database (RLS filters automatically)
  await supabase.from('articles').insert({
    tenant_id: tenantId, // Still set explicitly for clarity
    ...article
  });

  return new Response(JSON.stringify(article));
});
```

### Shared Edge Functions

All clients share the same Edge Functions - the tenant context comes from the JWT:

```
Client A's Request → Edge Function → Uses Client A's API Keys → Saves to Client A's Data
Client B's Request → Edge Function → Uses Client B's API Keys → Saves to Client B's Data
```

---

## 7. Realtime Subscriptions

### Tenant-Scoped Channels

Include tenant_id in channel names for isolation:

```typescript
// Subscribe to tenant-specific changes
const channel = supabase
  .channel(`tenant:${tenantId}:articles`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'articles',
      filter: `tenant_id=eq.${tenantId}`
    },
    (payload) => {
      console.log('Article changed:', payload);
    }
  )
  .subscribe();
```

### RLS + Realtime

RLS automatically filters Realtime broadcasts:
- User subscribes to `articles` table changes
- Database only broadcasts rows where `tenant_id` matches user's tenant
- No cross-tenant data leakage

```typescript
// Even without explicit filter, RLS protects you
const channel = supabase
  .channel('article-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'articles'
      // No filter needed - RLS handles it
    },
    (payload) => {
      // Only receives changes for user's tenant
    }
  )
  .subscribe();
```

---

## 8. API Keys & Secrets

### Storing Tenant API Keys Securely

```sql
-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted keys
CREATE OR REPLACE FUNCTION store_api_key(
  p_tenant_id UUID,
  p_service TEXT,
  p_api_key TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO tenant_api_keys (tenant_id, service, encrypted_key)
  VALUES (
    p_tenant_id,
    p_service,
    pgp_sym_encrypt(p_api_key, current_setting('app.encryption_key'))
  )
  ON CONFLICT (tenant_id, service)
  DO UPDATE SET
    encrypted_key = pgp_sym_encrypt(p_api_key, current_setting('app.encryption_key')),
    last_used_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retrieve and decrypt (only callable from Edge Functions via service role)
CREATE OR REPLACE FUNCTION get_api_key(
  p_tenant_id UUID,
  p_service TEXT
) RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
BEGIN
  SELECT pgp_sym_decrypt(encrypted_key::bytea, current_setting('app.encryption_key'))
  INTO v_key
  FROM tenant_api_keys
  WHERE tenant_id = p_tenant_id AND service = p_service AND is_active = true;

  -- Update last_used_at
  UPDATE tenant_api_keys
  SET last_used_at = NOW()
  WHERE tenant_id = p_tenant_id AND service = p_service;

  RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Setting the Encryption Key

```bash
# In Supabase Dashboard: Settings > Database > Connection Pooler
# Add to connection string:
# ?options=-c%20app.encryption_key=your-secret-key

# Or set via SQL:
ALTER DATABASE postgres SET app.encryption_key = 'your-32-character-encryption-key';
```

### Edge Function Key Retrieval

```typescript
// supabase/functions/_shared/get-tenant-key.ts
export async function getTenantApiKey(
  supabaseAdmin: SupabaseClient,
  tenantId: string,
  service: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc('get_api_key', {
    p_tenant_id: tenantId,
    p_service: service
  });

  if (error) throw error;
  return data;
}
```

---

## 9. Migrations & Deployments

### Single Migration Path

With shared tables, migrations apply to ALL tenants at once:

```bash
# Generate migration
supabase migration new add_new_feature

# Apply locally
supabase db push

# Apply to production
supabase db push --linked
```

### Migration Best Practices

```sql
-- Always include tenant_id in new tables
CREATE TABLE new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  -- ... other columns
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Always add index on tenant_id
CREATE INDEX idx_new_feature_tenant ON new_feature_table(tenant_id);

-- Always enable RLS
ALTER TABLE new_feature_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON new_feature_table
FOR ALL USING (tenant_id = auth.tenant_id());
```

### Branching for Preview Environments

Use Supabase Branching for PR previews:

```yaml
# .github/workflows/preview.yml
name: Preview

on:
  pull_request:

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: supabase/setup-cli@v1

      - name: Create preview branch
        run: supabase branches create preview-${{ github.event.number }}

      - name: Run migrations
        run: supabase db push --branch preview-${{ github.event.number }}
```

---

## 10. Performance Optimization

### Critical: Index tenant_id

```sql
-- Every tenant-scoped table MUST have this index
CREATE INDEX idx_tablename_tenant ON tablename(tenant_id);

-- For common queries, create composite indexes
CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_tenant_created ON articles(tenant_id, created_at DESC);
```

### Wrap Functions in SELECT

```sql
-- BAD: Function called for every row
CREATE POLICY "bad_policy" ON articles
FOR SELECT USING (tenant_id = auth.tenant_id());

-- GOOD: Function result cached
CREATE POLICY "good_policy" ON articles
FOR SELECT USING (tenant_id = (SELECT auth.tenant_id()));
```

### Add Explicit Filters in Code

Even though RLS adds filters implicitly, add them explicitly for better query plans:

```typescript
// BAD: Relies only on RLS
const { data } = await supabase
  .from('articles')
  .select('*');

// GOOD: Explicit filter helps query planner
const { data } = await supabase
  .from('articles')
  .select('*')
  .eq('tenant_id', tenantId); // Helps Postgres optimize
```

### Monitor RLS Performance

```sql
-- Check query plans with RLS
EXPLAIN ANALYZE
SELECT * FROM articles
WHERE status = 'published';

-- Look for sequential scans on large tables - add indexes
```

---

## 11. Cost Analysis

### Single Project Costs (Pro Plan)

| Component | Included | Overage |
|-----------|----------|---------|
| Database | 8GB | $0.125/GB/month |
| Storage | 100GB | $0.021/GB/month |
| Bandwidth | 250GB | $0.09/GB |
| MAU | 100,000 | $0.00325/MAU |
| Edge Invocations | 2M | $2/million |

### Example: 20 Clients Scenario

**Separate Projects Approach:**
- 20 × $25/month = **$500/month minimum**
- Plus overage per project

**Single Project Approach:**
- Base: **$25/month**
- 20 clients × 50 users = 1,000 MAU (included)
- 20 clients × 500MB DB = 10GB ($2.50/month overage)
- 20 clients × 5GB storage = 100GB (included)
- **Total: ~$30/month**

**Savings: $470/month (94%)**

### Scaling Considerations

| Clients | Separate Projects | Single Project | Savings |
|---------|-------------------|----------------|---------|
| 10 | $250/mo | ~$27/mo | $223/mo |
| 50 | $1,250/mo | ~$50/mo | $1,200/mo |
| 100 | $2,500/mo | ~$100/mo | $2,400/mo |
| 500 | $12,500/mo | ~$400/mo | $12,100/mo |

### When to Upgrade Compute

| Scenario | Action |
|----------|--------|
| < 50 concurrent users | Micro (default) |
| 50-200 concurrent users | Small ($10/mo add-on) |
| 200-500 concurrent users | Medium ($50/mo add-on) |
| 500+ concurrent users | Large ($100/mo add-on) |

---

## 12. Implementation Guide

### Step 1: Create Tenant Infrastructure

```sql
-- Run this migration first
-- supabase/migrations/001_create_tenant_infrastructure.sql

-- Tenant helper function
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    NULL
  )
$$;

-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  app_name TEXT DEFAULT 'Content Engine',
  primary_domain TEXT,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant users
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_tenant" ON tenants
FOR SELECT USING (id = auth.tenant_id());

CREATE POLICY "read_own_membership" ON tenant_users
FOR SELECT USING (user_id = auth.uid());
```

### Step 2: Migrate Existing Tables

```sql
-- supabase/migrations/002_add_tenant_id_to_existing.sql

-- Add tenant_id to articles
ALTER TABLE articles ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Create default tenant
INSERT INTO tenants (id, name, slug, app_name, primary_domain)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'GetEducated', 'geteducated', 'Perdia', 'geteducated.com');

-- Migrate existing data
UPDATE articles SET tenant_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' WHERE tenant_id IS NULL;

-- Make NOT NULL
ALTER TABLE articles ALTER COLUMN tenant_id SET NOT NULL;

-- Add index
CREATE INDEX idx_articles_tenant ON articles(tenant_id);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON articles
FOR ALL USING (tenant_id = auth.tenant_id());

-- Repeat for all tables...
```

### Step 3: Create Custom Access Token Hook

```sql
-- supabase/migrations/003_custom_access_token_hook.sql

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  tenant_id uuid;
  user_role text;
BEGIN
  -- Get user's tenant and role
  SELECT tu.tenant_id, tu.role INTO tenant_id, user_role
  FROM tenant_users tu
  WHERE tu.user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';

  IF tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}'::jsonb) ||
      jsonb_build_object('tenant_id', tenant_id, 'role', user_role)
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### Step 4: Update Client Code

```typescript
// src/contexts/TenantContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TenantContextType {
  tenantId: string | null;
  tenant: Tenant | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenant: null,
  isLoading: true,
});

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user?.app_metadata?.tenant_id;

      if (tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        setTenant(tenant);
      }

      setIsLoading(false);
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{
      tenantId: tenant?.id ?? null,
      tenant,
      isLoading
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

### Step 5: Create Tenant Onboarding Edge Function

```typescript
// supabase/functions/create-tenant/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { name, slug, adminEmail, adminPassword } = await req.json();

  // 1. Create tenant
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({ name, slug })
    .select()
    .single();

  if (tenantError) throw tenantError;

  // 2. Create admin user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    app_metadata: {
      tenant_id: tenant.id,
      role: 'admin'
    }
  });

  if (authError) throw authError;

  // 3. Create tenant_users record
  await supabaseAdmin.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: authData.user.id,
    role: 'admin'
  });

  return new Response(JSON.stringify({ tenant, user: authData.user }));
});
```

---

## Summary

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Single shared project | 94%+ cost savings |
| **Isolation** | RLS with tenant_id | Database-level security |
| **Auth** | app_metadata + custom hook | Secure, efficient |
| **Storage** | Folder prefixes + RLS | Simple, effective |
| **Edge Functions** | Shared, tenant-aware | Single deployment |
| **Migrations** | Single path | Simplicity |

### What You Get

- **Single $25/month project** supports unlimited tenants
- **Database-level security** prevents data leaks even with buggy code
- **Simple architecture** - one codebase, one database, one deployment
- **Scales efficiently** - add tenants without infrastructure changes
- **Easy maintenance** - single migration path, single monitoring

### What to Watch

- **Index tenant_id** on every table (critical for performance)
- **Use app_metadata** not user_metadata (security)
- **Test RLS policies** thoroughly (security audit)
- **Monitor query performance** as data grows
- **Consider compute upgrade** at ~200 concurrent users

---

## Sources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Multi-Tenant Applications with RLS](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [Efficient Multi-Tenancy with Supabase](https://arda.beyazoglu.com/supabase-multi-tenancy)
- [Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [Supabase Custom Claims](https://github.com/supabase-community/supabase-custom-claims)
- [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Pricing](https://supabase.com/pricing)
- [Optimizing RLS Performance](https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)

---

*This architecture enables cost-effective multi-tenancy while maintaining strong security guarantees through PostgreSQL's Row-Level Security.*

# Multi-Client Monorepo Strategy for AI Content Engine

**Version:** 1.0
**Date:** December 9, 2025
**Purpose:** Architecture and tooling strategy for managing multiple client instances from a single codebase

---

## Executive Summary

This document outlines a comprehensive strategy for managing multiple client instances of the AI Content Engine from a single monorepo. The goal is to:

1. **Share core functionality** across all client instances
2. **Allow per-client customizations** without forking
3. **Deploy updates to all clients** from one place
4. **Track changes and versions** for each client instance
5. **Scale efficiently** as you add more clients

**Recommended Stack:**
- **Monorepo Tool:** Nx (for enterprise features, generators, and affected commands)
- **Feature Flags:** Flagsmith (open-source, self-hostable)
- **Deployment:** Vercel (native monorepo support)
- **Version Management:** Nx Release + Conventional Commits

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Why Nx Over Turborepo](#2-why-nx-over-turborepo)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Customization Strategy](#4-customization-strategy)
5. [Feature Flags System](#5-feature-flags-system)
6. [Deployment Strategy](#6-deployment-strategy)
7. [Version & Change Tracking](#7-version--change-tracking)
8. [Client Instance Management](#8-client-instance-management)
9. [Database Strategy](#9-database-strategy)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Implementation Roadmap](#11-implementation-roadmap)

---

## 1. Architecture Overview

### The Challenge

You need to support multiple scenarios:
- **Pure white-label clients:** Use exact same features, different branding
- **Customized clients:** Core features + client-specific additions
- **Evolved clients:** Started from template, now significantly different

### The Solution: Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  GetEducated │  │   Client B  │  │   Client C  │  ...        │
│  │    (app)     │  │    (app)    │  │    (app)    │              │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                 │                 │                    │
│         ▼                 ▼                 ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CLIENT OVERLAY PACKAGES                        │ │
│  │  (client-specific components, pages, hooks, configs)        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SHARED LIBRARIES                          │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│  │  │   UI    │ │ Services│ │  Hooks  │ │  Utils  │           │ │
│  │  │Components│ │ (AI,DB) │ │ (React) │ │ (Common)│           │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    CORE ENGINE                               │ │
│  │  (generation pipeline, quality scoring, publishing)          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Core is Immutable:** The core engine (generation, AI, publishing) is shared and never forked
2. **Overlays for Customization:** Client-specific code lives in overlay packages
3. **Configuration over Code:** Use tenant config + feature flags before writing custom code
4. **Dependency Direction:** Apps depend on overlays, overlays depend on shared libs, shared libs depend on core

---

## 2. Why Nx Over Turborepo

Based on research, **Nx is the better choice** for this use case:

### Nx Advantages for Your Scenario

| Feature | Nx | Turborepo | Why It Matters |
|---------|----|-----------|-|
| **Generators** | Built-in, powerful | None | Create new client apps consistently |
| **Affected Commands** | Advanced | Basic | Only build/test what changed |
| **Project Graph** | Visual + CLI | Basic | Understand dependencies between clients |
| **Distributed Caching** | Nx Cloud (free tier) | Vercel (free tier) | Both good |
| **Task Orchestration** | Intelligent | Fast but basic | Complex pipelines |
| **Plugins Ecosystem** | Rich (React, Next, etc.) | Minimal | Out-of-box React support |
| **Complexity** | Higher learning curve | Simple | Trade-off, but worth it at scale |

### The Decisive Factor: Generators

Nx Generators let you **automate client onboarding**:

```bash
# Create new client with one command
nx g @content-engine/tools:client --name="client-b" --domain="clientb.com"

# This generates:
# - apps/client-b/           (client app)
# - libs/clients/client-b/   (client overlay)
# - configs/client-b.json    (client configuration)
# - Wires up all dependencies
```

With Turborepo, you'd have to manually copy and configure each client.

### Performance Note

While Turborepo can be faster for simple builds, Nx's "affected" commands mean you typically build less:

```bash
# Only build apps affected by changes to shared libs
nx affected --target=build

# Only run tests for changed code
nx affected --target=test
```

---

## 3. Monorepo Structure

### Recommended Folder Structure

```
content-engine/
├── apps/
│   ├── geteducated/           # GetEducated client app
│   │   ├── src/
│   │   │   ├── main.tsx       # Entry point
│   │   │   └── app.tsx        # App with client config
│   │   ├── public/
│   │   ├── index.html
│   │   └── project.json       # Nx project config
│   │
│   ├── client-b/              # Client B app (same structure)
│   ├── client-c/              # Client C app
│   └── admin/                 # Platform admin dashboard
│
├── libs/
│   ├── core/                  # Core engine (shared by ALL)
│   │   ├── generation/        # AI generation pipeline
│   │   ├── publishing/        # WordPress publishing
│   │   ├── quality/           # Quality scoring & validation
│   │   └── ai-clients/        # Grok, Claude, StealthGPT clients
│   │
│   ├── shared/                # Shared libraries
│   │   ├── ui/                # Reusable UI components
│   │   ├── hooks/             # Common React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript types
│   │   └── config/            # Configuration system
│   │
│   ├── features/              # Optional feature modules
│   │   ├── analytics/         # Analytics feature
│   │   ├── automation/        # Auto-publish feature
│   │   ├── monetization/      # Monetization feature
│   │   └── keyword-research/  # DataForSEO integration
│   │
│   └── clients/               # Client-specific overlays
│       ├── geteducated/       # GetEducated customizations
│       │   ├── components/    # Client-specific components
│       │   ├── pages/         # Client-specific pages
│       │   ├── hooks/         # Client-specific hooks
│       │   └── config/        # Client configuration
│       │
│       ├── client-b/          # Client B customizations
│       └── client-c/          # Client C customizations
│
├── tools/                     # Nx generators and scripts
│   ├── generators/
│   │   ├── client/            # Generate new client
│   │   ├── feature/           # Generate new feature
│   │   └── component/         # Generate component
│   └── scripts/
│       ├── deploy.ts          # Deploy script
│       └── sync-clients.ts    # Sync changes to clients
│
├── configs/                   # Client configurations
│   ├── geteducated.json       # GetEducated config
│   ├── client-b.json          # Client B config
│   └── client-c.json          # Client C config
│
├── supabase/                  # Shared Supabase config
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge functions
│
├── nx.json                    # Nx configuration
├── package.json               # Root dependencies
├── tsconfig.base.json         # Base TypeScript config
└── README.md
```

### Library Categories

| Category | Purpose | Example Libraries |
|----------|---------|-------------------|
| **core/** | Engine logic, never customized | `generation`, `publishing`, `quality` |
| **shared/** | Reusable across all clients | `ui`, `hooks`, `utils`, `types` |
| **features/** | Optional modules clients can enable | `analytics`, `automation`, `monetization` |
| **clients/** | Client-specific customizations | `geteducated`, `client-b` |

### Dependency Rules (Enforced by Nx)

```json
// nx.json - Module boundary rules
{
  "rules": [
    {
      "sourceTag": "type:app",
      "onlyDependOnLibsWithTags": ["type:client", "type:feature", "type:shared", "type:core"]
    },
    {
      "sourceTag": "type:client",
      "onlyDependOnLibsWithTags": ["type:feature", "type:shared", "type:core"]
    },
    {
      "sourceTag": "type:feature",
      "onlyDependOnLibsWithTags": ["type:shared", "type:core"]
    },
    {
      "sourceTag": "type:shared",
      "onlyDependOnLibsWithTags": ["type:core"]
    },
    {
      "sourceTag": "type:core",
      "onlyDependOnLibsWithTags": []
    }
  ]
}
```

This prevents:
- Core depending on client-specific code
- Shared libs depending on features
- Circular dependencies

---

## 4. Customization Strategy

### Three Levels of Customization

```
Level 1: Configuration (Preferred)
    ↓ If not sufficient
Level 2: Feature Flags
    ↓ If not sufficient
Level 3: Client Overlay Code
```

### Level 1: Configuration

Most customizations should be **configuration-driven**:

```typescript
// configs/geteducated.json
{
  "tenant": {
    "id": "geteducated",
    "name": "GetEducated",
    "domain": "geteducated.com"
  },
  "branding": {
    "appName": "Perdia",
    "logo": "/assets/geteducated-logo.svg",
    "primaryColor": "#3B82F6",
    "theme": "light"
  },
  "content": {
    "blockedDomains": ["onlineu.com", "usnews.com"],
    "allowedDomains": ["bls.gov", "ed.gov"],
    "blockEduLinks": true,
    "requireCostData": true
  },
  "generation": {
    "defaultWordCount": 2000,
    "qualityThreshold": 85,
    "humanizationProvider": "stealthgpt"
  },
  "features": {
    "monetization": true,
    "automation": true,
    "keywordResearch": true,
    "analytics": false
  }
}
```

```typescript
// libs/shared/config/src/use-client-config.ts
export function useClientConfig() {
  const config = useContext(ClientConfigContext);
  return config;
}

// Usage in component
function Dashboard() {
  const { branding, features } = useClientConfig();

  return (
    <div style={{ color: branding.primaryColor }}>
      <h1>{branding.appName}</h1>
      {features.monetization && <MonetizationPanel />}
    </div>
  );
}
```

### Level 2: Feature Flags

For features that need **runtime control** or **gradual rollout**:

```typescript
// Using Flagsmith
import { useFlags } from 'flagsmith/react';

function ArticleEditor() {
  const flags = useFlags(['new_editor_ui', 'ai_suggestions', 'bulk_operations']);

  return (
    <div>
      {flags.new_editor_ui.enabled && <NewEditorToolbar />}
      {flags.ai_suggestions.enabled && <AISuggestionPanel />}
      {flags.bulk_operations.enabled && <BulkOperationsMenu />}
    </div>
  );
}
```

Feature flags are ideal for:
- **A/B testing** new features with some clients
- **Beta features** for early adopters
- **Kill switches** to disable broken features
- **Gradual rollouts** across client base

### Level 3: Client Overlay Code

When configuration and flags aren't enough, create **client-specific code**:

```typescript
// libs/clients/geteducated/src/components/GetEducatedPreview.tsx
export function GetEducatedPreview({ article }) {
  // Custom preview component only for GetEducated
  return (
    <div className="geteducated-preview">
      <header className="ge-header">
        <img src="/geteducated-logo.svg" />
      </header>
      <article dangerouslySetInnerHTML={{ __html: article.content }} />
    </div>
  );
}

// libs/clients/geteducated/src/index.ts
export { GetEducatedPreview } from './components/GetEducatedPreview';
export { useGetEducatedCatalog } from './hooks/useGetEducatedCatalog';
export { geteducatedValidationRules } from './validation/rules';
```

```typescript
// apps/geteducated/src/app.tsx
import { GetEducatedPreview } from '@content-engine/clients-geteducated';
import { ArticleEditor } from '@content-engine/shared-ui';

function App() {
  return (
    <ClientConfigProvider config={geteducatedConfig}>
      <ArticleEditor
        PreviewComponent={GetEducatedPreview}  // Client-specific
      />
    </ClientConfigProvider>
  );
}
```

### Component Override Pattern

For flexible customization, use a **component registry**:

```typescript
// libs/shared/ui/src/component-registry.ts
const defaultComponents = {
  ArticlePreview: DefaultArticlePreview,
  Dashboard: DefaultDashboard,
  SettingsPanel: DefaultSettingsPanel,
};

export function createComponentRegistry(overrides = {}) {
  return { ...defaultComponents, ...overrides };
}

// libs/clients/geteducated/src/index.ts
import { GetEducatedPreview } from './components/GetEducatedPreview';

export const geteducatedComponents = {
  ArticlePreview: GetEducatedPreview,
  // Dashboard uses default
  // SettingsPanel uses default
};

// apps/geteducated/src/app.tsx
import { createComponentRegistry } from '@content-engine/shared-ui';
import { geteducatedComponents } from '@content-engine/clients-geteducated';

const registry = createComponentRegistry(geteducatedComponents);

function App() {
  return (
    <ComponentRegistryProvider registry={registry}>
      <Router />
    </ComponentRegistryProvider>
  );
}

// Any component can use the registry
function ArticlePage({ article }) {
  const { ArticlePreview } = useComponentRegistry();
  return <ArticlePreview article={article} />;
}
```

---

## 5. Feature Flags System

### Recommended: Flagsmith

**Why Flagsmith over LaunchDarkly:**
- Open-source (can self-host)
- Lower cost for multi-tenant use
- Per-tenant (environment) targeting built-in
- Sufficient features for this use case

### Setup

```typescript
// libs/shared/config/src/feature-flags.ts
import Flagsmith from 'flagsmith';

export const flagsmith = new Flagsmith({
  environmentID: process.env.FLAGSMITH_ENVIRONMENT_ID,
});

// Initialize with tenant context
export async function initializeFlags(tenantId: string) {
  await flagsmith.identify(tenantId, {
    tenant_id: tenantId,
    plan: 'pro', // Can target by plan
  });
}
```

### Flag Categories

| Category | Examples | Use Case |
|----------|----------|----------|
| **Entitlement Flags** | `premium_features`, `analytics_access` | Control by subscription tier |
| **Rollout Flags** | `new_editor_v2`, `ai_revision_beta` | Gradual feature rollout |
| **Operations Flags** | `maintenance_mode`, `disable_publishing` | Emergency controls |
| **Experiment Flags** | `alt_quality_algorithm`, `new_onboarding` | A/B testing |

### Per-Client Configuration

```
Flagsmith Dashboard:
├── Environments
│   ├── production-geteducated     (GetEducated prod)
│   ├── production-client-b        (Client B prod)
│   ├── staging                    (Shared staging)
│   └── development                (Local dev)
│
├── Flags
│   ├── monetization_enabled       (on for GetEducated, off for Client B)
│   ├── advanced_analytics         (pro plan only)
│   ├── new_humanization_engine    (rollout 50%)
│   └── bulk_generation            (all clients)
```

---

## 6. Deployment Strategy

### Vercel Multi-App Deployment

Each client app deploys as a **separate Vercel project**:

```
Vercel Dashboard:
├── content-engine-geteducated     → geteducated.contentengine.com
├── content-engine-client-b        → clientb.contentengine.com
├── content-engine-client-c        → clientc.contentengine.com
└── content-engine-admin           → admin.contentengine.com
```

### Vercel Configuration

```json
// apps/geteducated/vercel.json
{
  "buildCommand": "npx nx build geteducated --prod",
  "outputDirectory": "../../dist/apps/geteducated",
  "installCommand": "npm ci",
  "framework": "vite"
}
```

### Environment Variables per Client

```
# Vercel Project: content-engine-geteducated
VITE_TENANT_ID=geteducated
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_FLAGSMITH_ENVIRONMENT_ID=abc123

# Vercel Project: content-engine-client-b
VITE_TENANT_ID=client-b
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_FLAGSMITH_ENVIRONMENT_ID=def456
```

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  determine-affected:
    runs-on: ubuntu-latest
    outputs:
      affected: ${{ steps.affected.outputs.apps }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - id: affected
        run: echo "apps=$(npx nx show projects --affected --type=app --json)" >> $GITHUB_OUTPUT

  deploy:
    needs: determine-affected
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: ${{ fromJson(needs.determine-affected.outputs.affected) }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx nx build ${{ matrix.app }} --prod
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets[format('VERCEL_PROJECT_{0}', matrix.app)] }}
          working-directory: ./dist/apps/${{ matrix.app }}
```

### Deploy Commands

```bash
# Deploy all clients
nx run-many --target=deploy --all

# Deploy only affected by recent changes
nx affected --target=deploy

# Deploy specific client
nx deploy geteducated

# Deploy all clients with tag
nx run-many --target=deploy --projects=tag:type:app
```

---

## 7. Version & Change Tracking

### Versioning Strategy

**Independent versioning per client app:**

```
geteducated@1.2.3    # GetEducated at version 1.2.3
client-b@1.1.0       # Client B at version 1.1.0
client-c@1.0.5       # Client C at version 1.0.5

@content-engine/core@2.0.0           # Core engine
@content-engine/shared-ui@1.5.0      # Shared UI
```

### Nx Release

```bash
# Release all affected packages
nx release

# Release specific client
nx release --projects=geteducated

# Preview what would be released
nx release --dry-run
```

### Conventional Commits

Enforce commit message format:

```
feat(geteducated): add custom monetization panel
fix(core): resolve quality scoring edge case
feat(shared-ui): add dark mode support
chore: update dependencies
```

### Changelog Generation

```markdown
# Changelog - GetEducated

## [1.2.3] - 2025-12-09

### Features
- Add custom monetization panel (#123)

### Bug Fixes
- Fix article preview rendering (#124)

### Dependencies
- @content-engine/core: 2.0.0 → 2.0.1
- @content-engine/shared-ui: 1.5.0 → 1.5.1
```

### Client Change Tracking Dashboard

Create a tracking system to see what's deployed where:

```typescript
// tools/scripts/client-versions.ts
interface ClientVersion {
  clientId: string;
  appVersion: string;
  coreVersion: string;
  sharedUiVersion: string;
  deployedAt: string;
  environment: 'production' | 'staging';
}

// Query from Vercel API + package.json
async function getClientVersions(): Promise<ClientVersion[]> {
  const clients = await getVercelProjects();
  return clients.map(client => ({
    clientId: client.name,
    appVersion: client.latestDeployment.meta.version,
    coreVersion: client.latestDeployment.meta.coreVersion,
    // ...
  }));
}
```

Display in admin dashboard:

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT VERSION TRACKER                     │
├───────────────┬─────────┬──────────┬───────────┬────────────┤
│ Client        │ App     │ Core     │ Deployed  │ Status     │
├───────────────┼─────────┼──────────┼───────────┼────────────┤
│ GetEducated   │ 1.2.3   │ 2.0.1    │ 2 hrs ago │ ✅ Current │
│ Client B      │ 1.1.0   │ 2.0.0    │ 1 day ago │ ⚠️ Update  │
│ Client C      │ 1.0.5   │ 1.9.0    │ 1 wk ago  │ ⚠️ Update  │
└───────────────┴─────────┴──────────┴───────────┴────────────┘
```

---

## 8. Client Instance Management

### Nx Generator for New Clients

```typescript
// tools/generators/client/index.ts
import { Tree, generateFiles, names, installPackagesTask } from '@nx/devkit';

interface ClientGeneratorSchema {
  name: string;
  domain: string;
  features?: string[];
}

export default async function clientGenerator(tree: Tree, schema: ClientGeneratorSchema) {
  const { name, className, propertyName } = names(schema.name);

  // 1. Generate app
  generateFiles(tree, './files/app', `apps/${name}`, {
    ...schema,
    name,
    className,
  });

  // 2. Generate client overlay library
  generateFiles(tree, './files/lib', `libs/clients/${name}`, {
    ...schema,
    name,
    className,
  });

  // 3. Generate configuration
  generateFiles(tree, './files/config', `configs`, {
    ...schema,
    name,
  });

  // 4. Update workspace configuration
  updateProjectConfiguration(tree, name, {
    tags: ['type:app', `client:${name}`],
  });

  // 5. Set up Vercel project (optional)
  await setupVercelProject(schema);

  // 6. Set up Flagsmith environment (optional)
  await setupFlagsmithEnvironment(schema);

  return () => {
    installPackagesTask(tree);
  };
}
```

### Client Onboarding Script

```bash
# Create new client with full setup
nx g @content-engine/tools:client \
  --name="awesome-corp" \
  --domain="awesomecorp.com" \
  --features="monetization,analytics"

# This creates:
# ✅ apps/awesome-corp/
# ✅ libs/clients/awesome-corp/
# ✅ configs/awesome-corp.json
# ✅ Vercel project (via API)
# ✅ Flagsmith environment (via API)
# ✅ Database tenant record
```

### Client Management Commands

```bash
# List all clients
nx show projects --projects=tag:type:app

# Check client dependencies
nx graph --focus=geteducated

# See what shared code a client uses
nx graph --focus=geteducated --exclude=tag:type:app

# Migrate client to new core version
nx migrate @content-engine/core --project=geteducated
```

---

## 9. Database Strategy

### Shared Database with Tenant Isolation

All clients share one Supabase project with Row-Level Security:

```sql
-- Every table has tenant_id
CREATE TABLE articles (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  ...
);

-- RLS policy filters by tenant
CREATE POLICY "tenant_isolation" ON articles
FOR ALL USING (
  tenant_id = (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
);
```

### Migration Management

```bash
# Apply migrations to shared database
supabase db push

# Generate migration
supabase migration new add_analytics_table

# Migrations apply to ALL tenants
# Tenant-specific data seeding handled separately
```

### Tenant Data Seeding

```typescript
// supabase/seed/tenant-data.ts
export async function seedTenantData(tenantId: string, config: TenantConfig) {
  // Seed contributors
  for (const contributor of config.contributors) {
    await supabase.from('tenant_contributors').insert({
      tenant_id: tenantId,
      ...contributor,
    });
  }

  // Seed monetization categories
  for (const category of config.monetizationCategories) {
    await supabase.from('tenant_monetization_categories').insert({
      tenant_id: tenantId,
      ...category,
    });
  }

  // Import site catalog
  if (config.sitemapUrl) {
    await importSiteCatalog(tenantId, config.sitemapUrl);
  }
}
```

---

## 10. CI/CD Pipeline

### Complete Workflow

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  # 1. Lint, test, build affected projects
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - run: npx nx affected --target=lint --parallel=3
      - run: npx nx affected --target=test --parallel=3 --coverage
      - run: npx nx affected --target=build --parallel=3

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # 2. Deploy affected apps (main branch only)
  deploy:
    needs: ci
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: nrwl/nx-set-shas@v4
      - run: npm ci

      - name: Get affected apps
        id: affected
        run: |
          AFFECTED=$(npx nx show projects --affected --type=app --plain | tr '\n' ' ')
          echo "apps=$AFFECTED" >> $GITHUB_OUTPUT

      - name: Deploy to Vercel
        run: |
          for app in ${{ steps.affected.outputs.apps }}; do
            npx nx deploy $app
          done
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

  # 3. Notify on deployment
  notify:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployed: ${{ needs.deploy.outputs.deployed-apps }}"
            }
```

### Nx Cloud for Distributed Caching

```json
// nx.json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "accessToken": "your-nx-cloud-token",
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  }
}
```

Benefits:
- **Remote caching:** Build artifacts shared across CI and developers
- **Distributed execution:** Run tasks across multiple machines
- **Build analytics:** See what's slow, what's cached

---

## 11. Implementation Roadmap

### Phase 1: Monorepo Setup (Week 1)

| Task | Description |
|------|-------------|
| Initialize Nx workspace | `npx create-nx-workspace content-engine` |
| Create folder structure | `apps/`, `libs/core/`, `libs/shared/`, `libs/clients/` |
| Migrate GetEducated code | Move existing code to `apps/geteducated` |
| Extract core libraries | Move generation, publishing to `libs/core/` |
| Extract shared libraries | Move UI, hooks, utils to `libs/shared/` |
| Set up module boundaries | Configure `@nx/enforce-module-boundaries` |

### Phase 2: Configuration System (Week 2)

| Task | Description |
|------|-------------|
| Create config schema | Define TypeScript types for client config |
| Build ClientConfigProvider | React context for client configuration |
| Extract hardcoded values | Move to configuration files |
| Set up Flagsmith | Create account, define initial flags |
| Implement feature flag hooks | `useFlags`, `useFeature` |

### Phase 3: Client Overlay System (Week 3)

| Task | Description |
|------|-------------|
| Create GetEducated overlay | `libs/clients/geteducated/` |
| Build component registry | Override pattern for components |
| Extract GetEducated-specific code | Move to overlay library |
| Create client generator | Nx generator for new clients |
| Test with second client | Create test client to validate |

### Phase 4: Deployment Pipeline (Week 4)

| Task | Description |
|------|-------------|
| Set up Vercel projects | One per client app |
| Configure CI/CD | GitHub Actions workflow |
| Set up Nx Cloud | Remote caching |
| Implement version tracking | Dashboard for client versions |
| Test full deployment flow | End-to-end deployment test |

### Phase 5: Client Management (Week 5)

| Task | Description |
|------|-------------|
| Build admin dashboard | View all clients, versions, status |
| Create onboarding automation | Generator + provisioning scripts |
| Document processes | Runbooks for common operations |
| Create first new client | Full onboarding of real client |

---

## Summary: Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Monorepo Tool** | Nx | Generators, affected commands, enterprise features |
| **Customization** | Config → Flags → Overlays | Minimize custom code |
| **Feature Flags** | Flagsmith | Open-source, multi-tenant support |
| **Deployment** | Vercel | Native monorepo support, per-app projects |
| **Versioning** | Independent per app | Clients can be at different versions |
| **Database** | Shared with RLS | Cost-effective, simpler migrations |
| **Caching** | Nx Cloud | Free tier sufficient, speeds up CI |

---

## Sources

- [Using Monorepo To Cut Costs for White-labelled App Development](https://www.aot-technologies.com/using-monorepo-to-cut-costs-for-white-labelled-app-development/)
- [Nx vs Turborepo: A Comprehensive Guide](https://www.wisp.blog/blog/nx-vs-turborepo-a-comprehensive-guide-to-monorepo-tools)
- [Mastering Monorepos: Nx vs Turborepo in 2024](https://phoenixhq.hashnode.dev/mastering-monorepos-part-3-points-to-consider-choosing-between-nx-and-turborepo)
- [Vercel Monorepos Documentation](https://vercel.com/docs/monorepos)
- [Nx Folder Structure](https://nx.dev/docs/concepts/decisions/folder-structure)
- [Nx Local Generators](https://nx.dev/extending-nx/recipes/local-generators)
- [Flagsmith vs LaunchDarkly Comparison](https://www.flagsmith.com/compare/flagsmith-vs-launchdarkly)
- [Feature Flags Best Practices](https://docs.getunleash.io/topics/feature-flags/feature-flag-best-practices)
- [Release Management for Monorepos](https://graphite.com/guides/release-management-strategies-in-a-monorepo)
- [Nx Release for Versioning](https://nx.dev/blog/versioning-and-releasing-packages-in-a-monorepo)

---

*This strategy enables you to efficiently manage multiple client instances while maintaining a single source of truth for core functionality.*

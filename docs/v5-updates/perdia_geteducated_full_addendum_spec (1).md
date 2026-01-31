# Perdia × GetEducated Content, Monetization & Authoring Spec

_Generated from Kayleigh’s rules, GetEducated.com structure, and the `School_Degree Category_Subject Organization - IPEDS.xlsx` workbook._

## 1. Overview

Perdia is the content engine responsible for generating, revising, and publishing SEO-optimized, monetized articles for **GetEducated.com**. This document specifies how the app must be configured so that **content topics, monetization, linking, authoring, and review** all comply with Kayleigh’s latest rules.

This spec is intended to be **handed directly to the dev team or an AI app builder**. If all items in this document are implemented and verified, the system should behave correctly.

## 2. Content Scope & Core Rules

### 2.1 Allowed Topics

- All content must be about **online education**, **online degrees**, and **online schools**.

- Articles may cover broader trends in education **only if they are clearly relevant to online students**.

### 2.2 Cost & Data Sources

- When the AI references **degree costs, tuition, or total program price**, it must:

  - Pull the numbers from **GetEducated’s ranking reports**, not from competitor sites.

  - Respect that these reports include:

    - Total cost of enrollment (tuition + all mandatory fees).

    - In-state vs out-of-state cost, when applicable.

- **Never** source cost info from competitor sites (onlineu.com, usnews.com, affordablecollegesonline.com, toponlinecollegesusa.com, etc.).

- If cost must be mentioned and no internal ranking data exists, the AI should:

  - Prefer qualitative language (e.g., “affordable compared to similar online programs”) over invented numbers.

## 3. Data Model & External Databases

Perdia must integrate with three core data domains from GetEducated:

1. **Ranking Reports** – source of cost and Best Buy rankings.

2. **Degree / Program Database** – all online programs, with sponsored vs non-sponsored flags.

3. **School Database** – all schools, with logos and sponsorship/meta fields.

4. **Subject & Level Mapping (this workbook)** – maps content topics to internal IDs and CIP codes.

### 3.1 Subject–CIP–Category Mapping Workbook

- Workbook: `School_Degree Category_Subject Organization - IPEDS.xlsx`

- Sheets:

  - **subject-cip-bls** – 968 rows, 15 columns.

  - **Level Codes ** – 14 rows, 2 columns.

#### 3.1.1 Sheet: `subject-cip-bls`

This sheet maps high-level fields of study (categories) to specific **concentrations/subjects** and their corresponding **IPEDS CIP codes**. This is foundational for how Perdia understands topics, selects degrees, and aligns monetization.

Columns:

- `Unnamed: 0`

- `"Field of Study" (on WP) / "Category" in LXC `

- `Category ID`

- `Concentration ID (aka Subject)`

- `"Concentration" in LXC/WP`

- `Including the following types of degrees.... `

- `CipCode (Main)`

- `CipCode Title (Main)`

- `CipCode (Secondary)`

- `CipCode Title (Secondary)`

- `CipCode (Secondary/Third)`

- `CipCode Title (Third)`

- `Degree Description per IPEDS CIPS`

- `Unnamed: 13`

- `Unnamed: 14`


Key semantics (inferred from sample rows):

- `"Field of Study" (on WP) / "Category" in LXC`:

  - High-level content category for WordPress and the LXC system (e.g., `Arts & Liberal Arts`).

- `Category ID`:

  - Numeric internal ID for this field of study.

- `Concentration ID (aka Subject)`:

  - Numeric ID for a specific subject/major (e.g., Anthropology).

- `"Concentration" in LXC/WP`:

  - Human-readable name of the subject/major.

- `Including the following types of degrees....`:

  - Free-text listing of degree types under this concentration (Associate, Bachelor, Master, etc.).

- `CipCode (Main)` & `CipCode Title (Main)`:

  - Primary IPEDS CIP code and label for the subject.

- `CipCode (Secondary)` / `(Secondary/Third)` and Titles:

  - Additional CIP codes connected to this subject (for cross-classified programs).

- `Degree Description per IPEDS CIPS`:

  - Description of the degree/field drawn from IPEDS definitions (used for category page copy or tooltips).

- `Unnamed: 0`, `Unnamed: 13`, `Unnamed: 14`:

  - Likely helper/placeholder columns (category headings, notes, spacing). These should not be used as primary keys.

**Implementation requirements:**

- Create a table (e.g., `subjects`) with fields roughly matching:

  - `id` (PK, internal)

  - `field_of_study_label` (string)

  - `category_id` (int)

  - `concentration_id` (int)

  - `concentration_label` (string)

  - `degree_types` (string or array – parsed from `Including the following types of degrees....`)

  - `cip_main_code`, `cip_main_title`

  - `cip_secondary_code`, `cip_secondary_title`

  - `cip_third_code`, `cip_third_title`

  - `degree_description` (from `Degree Description per IPEDS CIPS`)

- On article creation, Perdia must map the article’s **topic** (e.g., `online anthropology degree`) to:

  - The corresponding `Category ID` and `Concentration ID` via this table.

- These IDs are then used downstream by the **monetization shortcode system** (see §4).

#### 3.1.2 Sheet: `Level Codes `

This sheet defines **degree level codes** to be used in article shortcodes for monetization blocks.

Columns:

- `Level Codes for Article Shortcodes`

- `Unnamed: 1`


Sample values:

```text

   Level Codes for Article Shortcodes  Unnamed: 1
0                                 NaN         NaN
1                           Associate         1.0
2                            Bachelor         2.0
3                 Bachelor Completion         3.0
4                          Certifiate         6.0
5                              Course       399.0
6                             Diploma         7.0
7                          Doctorate          5.0
8                Graduate Certificate       356.0
9                     Graduate Course       400.0
10                             Master         4.0
11         Post Graduate Certificate        362.0
12           Professional Certificate       393.0
13               Undergraduate Course       401.0

```

Interpreted semantics:

- `Level Codes for Article Shortcodes`:

  - Human-readable degree level (e.g., `Associate`, `Bachelor`, `Master`, `Doctorate`, `Graduate Certificate`, etc.).

- `Unnamed: 1`:

  - Numeric code used in article shortcodes and/or database queries.

  - Examples from the sheet:

    - `Associate` → `1`

    - `Bachelor` → `2`

    - `Bachelor Completion` → `3`

    - `Master` → `4`

    - `Doctorate` → `5`

    - `Certificate` (typo as `Certifiate`) → `6`

    - `Diploma` → `7`

    - `Graduate Certificate` → `356`

    - `Graduate Course` → `400`

    - `Post Graduate Certificate` → `362`

    - `Professional Certificate` → `393`

    - `Undergraduate Course` → `401`

**Implementation requirements:**

- Create a table (e.g., `degree_levels`) with fields:

  - `id` (PK)

  - `label` (e.g., `Bachelor`)

  - `code` (int – the numeric shortcode code from the sheet)

- All monetization shortcodes must use these **canonical level codes** when constructing degree-offer blocks.

- When an article is about a specific level (e.g., `online master's in business`):

  - Perdia must attach the right `degree_levels.code` when building shortcodes.

## 4. Monetization & Shortcodes (High-Level Behavior)

Kayleigh’s rules describe a system where **article monetization** is driven by:
- Category + Concentration (from `subject-cip-bls`).
- Degree Level (from `Level Codes `).
- A separate **monetization shortcode sheet** (not yet provided here) that uses Columns B/C/D to select specific degrees.

Even without the actual shortcode sheet, we can specify the intended behavior:

### 4.1 Monetization Selection Logic

- For each article, Perdia must:

  1. Determine the **primary topic** → map to `Category ID` + `Concentration ID`.

  2. Determine the **degree level** (from context or article type).

  3. Query the internal degree database for matching programs:

     - Where `degree.category_id = Category ID`.

     - And `degree.concentration_id = Concentration ID`.

     - Optionally filtered by `degree.level_code`.

  4. Prioritize degrees where:

     - `is_sponsored = true` (logo + “Sponsored Listing” in the degree DB).

  5. Build a monetization block using shortcodes that target those degrees.

### 4.2 Shortcode Construction (To Be Finalized with Kayleigh’s Sheet)

The exact shortcode syntax is not visible here, but the dev team should assume a pattern such as:

```text

[degree_table category="{Category ID}" concentration="{Concentration ID}" level="{Level Code}"]

```

or degree-specific shortcodes like:

```text

[degree_offer school_id="{school_id}" program_id="{program_id}"]

```

Until the exact syntax is confirmed by Kayleigh’s monetization sheet, the implementation must:

- Use **Category ID** + **Concentration ID** + **Level Code** as the core selectors.

- Expose a configurable template for shortcode generation so marketing can adjust format without code changes.

### 4.3 Placement in Articles

- Monetization blocks should appear in **predictable, configurable positions**, for example:

  - After the introduction.

  - After a section explaining “How to choose a program”.

  - Near the end, as “Recommended programs”.

- The app must support **at least two monetization blocks per article**, each with its own config.

## 5. Linking Rules (Internal vs External)

### 5.1 Internal Links

- When discussing a specific degree type (e.g., `online master's in business`):

  - Always include a link to the relevant **degree database page** (e.g., `/online-degrees/master/business/business-administration/`).

- When referencing specific schools or degrees:

  - Link to the **GetEducated school page**, e.g., `/online-schools/southern-new-hampshire-university/`.

- Degree listings and monetization blocks must **never** link directly to `.edu` domains.

### 5.2 External Links

- External links are allowed only to **authoritative, non-competitive sources**, such as:

  - Bureau of Labor Statistics (BLS).

  - Government education sites.

  - Nonprofit education organizations.

- Do **not** link to:

  - Competitor degree comparison sites (onlineu.com, usnews.com, affordablecollegesonline.com, toponlinecollegesusa.com, etc.).

  - School websites as the **primary** destination for program exploration.

### 5.3 Enforcement in Perdia

- Implement a **link validation layer** that:

  - Scans generated content for any URLs.

  - Rejects or flags content that links to forbidden domains.

  - Encourages replacing external school links with `/online-schools/{slug}` internal links.

## 6. AI Generation, Human Review, and Training (Baseline)

- All AI-generated drafts must:

  - Use the subject & level mapping to contextualize the article.

  - Use ranking reports for cost data when available.

  - Follow linking and monetization rules above.

- Human editors (Kayleigh, Tony, Sara, Charity) will:

  - Review early batches of articles.

  - Leave inline comments.

  - Trigger AI revisions which should:

    - Update the draft.

    - Log a training example pairing (old text, comments, revised text).

- The training system should default to using all revisions as global training data, with the option later to exclude specific revisions if needed.

## 7. Developer Checklist (Content & Monetization)

1. **Subject Mapping**

   - [ ] `subjects` table created using `subject-cip-bls` sheet columns.

   - [ ] Article topics correctly map to `Category ID` and `Concentration ID`.

2. **Degree Levels**

   - [ ] `degree_levels` table created using `Level Codes ` sheet.

   - [ ] Level codes used in all monetization shortcodes.

3. **Monetization**

   - [ ] Degree selection uses Category + Concentration + Level.

   - [ ] Sponsored listings prioritized where applicable.

   - [ ] Shortcode templates are configurable and use the IDs from this workbook.

4. **Linking**

   - [ ] Internal links always point to degree and school pages on GetEducated.

   - [ ] External links limited to allowed authoritative domains.

   - [ ] No links to competitor domains or school `.edu` as primary destinations.

5. **Cost Data**

   - [ ] All cost numbers pulled from internal ranking reports.

   - [ ] No scraping or use of competitor cost data.



---

# 8. Authoring, Bylines & Roles (Kayleigh’s Requirements Addendum)

This section extends the spec into a more complete, PRD-style addendum covering **author management**, **authoring workflow**, and **review/training flows** exactly as requested by Kayleigh and Tony.

## 8.1 Allowed Authors & Identity Rules

### 8.1.1 Allowed Authors

Only **four** real authors must be used as bylines for new AI-generated or AI-assisted GetEducated content:

- **Kayleigh Gilbert**
- **Tony Huffman**
- **Sara <LastName>** (final name to be confirmed in your system)
- **Charity <LastName>** (final name to be confirmed in your system)

**Rules:**

- No legacy authors should appear as bylines on new AI-generated content.
- No placeholder or pseudonym authors should appear as public-facing names (for example: “Julia Samples”, “Danny Samples”, “Alicia Samples”, “Kif Samples”). Those are *only* training style proxies.
- If the system pulls authors from WordPress, it must **filter** the usable list to these four when creating new content.

### 8.1.2 Author Data Model

Create an `allowed_authors` (or `authors`) table to mirror GetEducated’s author universe for Perdia:

| Field            | Type    | Notes                                                        |
|------------------|---------|--------------------------------------------------------------|
| id               | PK      | Internal numeric ID                                          |
| name             | string  | Visible display name (e.g., "Kayleigh Gilbert")              |
| wp_author_slug   | string  | WordPress user/author slug for mapping                       |
| role             | enum    | e.g., `author`, `editor`, `reviewer`                         |
| active           | bool    | Whether this author is currently usable in Perdia            |
| default_for_type | string? | Optional: default author for certain article types/categories|

**Implementation details:**

- Seed this table with four records (Kayleigh, Tony, Sara, Charity).
- Mark only Kayleigh & Tony as `active = true` initially if Sara and Charity's WP accounts/pages are not yet created; update once they exist.
- Perdia’s author picker UI must only show rows where `active = true`.

### 8.1.3 Mapping to WordPress

- When Perdia pushes an article to WordPress, it must set the post’s `author` field using `wp_author_slug` for the selected `allowed_authors` record.
- If WordPress returns an error because the author/user doesn’t exist, Perdia should:
  - Fail gracefully, log the issue, and keep the article in **Ready to Publish** state without pushing.
  - Surface a clear error: “Author user not found in WordPress. Please configure the author account or choose a different author.”

## 8.2 Author Selection Logic

### 8.2.1 Required Fields Per Article

Every article record in Perdia must have at least:

- `primary_author_id` → FK to `allowed_authors`
- Optional `reviewed_by_id` → FK to `allowed_authors` (for “Expert review by …” UI if desired)
- Optional `editor_id` → internal user who last approved the article in the app (this may or may not show publicly).

### 8.2.2 Default Author per Article Type (Configurable)

Based on the writing samples and historical patterns, the app can provide **sensible defaults** but must keep them configurable:

- **Ranking landing pages & Best Buy reports**  
  - Default `primary_author`: **Tony**  
  - Rationale: He is the face of rankings and ranking-report content.

- **Program lists / degree roundups**  
  (e.g., LCSW programs, hospitality degrees, technical colleges)  
  - Default `primary_author`: **Kayleigh**, **Sara**, or **Charity** depending on category.
  - Recommended initial config: use **Kayleigh** as default until a more granular mapping is agreed upon.

- **General guides / explainer content**  
  (e.g., “What degrees can you get online?”)  
  - Default `primary_author`: **Sara** or **Charity**, once they're fully onboarded as authors.

**Implementation:**

- Create a config table or JSON mapping, e.g. `default_author_by_article_type` with fields:
  - `article_type` (e.g., `ranking`, `program_list`, `guide`)
  - `default_author_id` (FK to `allowed_authors`)
- When a new article is created, Perdia picks `primary_author_id` using this map, but:
  - The editor can override it via dropdown before publishing.
- The app must **never** auto-assign a non-allowed author.

## 8.3 Authoring Workflow & Queues

### 8.3.1 Internal AI Workflow (Technical)

Internally, the AI pipeline can use a more granular Kanban-like workflow:

- `idea_queue`
- `drafting`
- `refinement`
- `pre_check` (AI self-check)
- `publishing_queue`

The AI may move items between `drafting`, `refinement`, and `pre_check` automatically as it revises and checks its own work.

### 8.3.2 Human-Facing Workflow (What Kayleigh & Tony Care About)

For the GetEducated team, the important states are simpler:

1. **Idea Queue** – Proposed topics, generated or manually added.
2. **Ready for Human Review** – The article is drafted, passed internal AI checks, and is ready for Kayleigh/Tony/Sara/Charity to review.
3. **Approved for Publish** – Human sign-off complete; article is ready to be pushed to WordPress (or scheduled).
4. **Published** – Confirmed successfully published on the site.

**Rules:**

- In the **initial phase**, human review is mandatory for all content:
  - No auto-publish.
  - An article must be moved from `Ready for Human Review` → `Approved for Publish` by an authorized human.
- In a **later phase**, after trust is established:
  - Add a time-based auto-publish rule for items that sit too long (e.g., 5 days) in `Ready for Human Review`:
    - If `now - ready_for_review_at > X days` AND AI checks are still green → auto-publish is allowed.
    - This delay value X must be configurable (default 5 days).

### 8.3.3 Article Review UI Requirements

On the **Article Detail Page** in Perdia, provide:

- Full article body in a rich text or markdown editor view.
- Side panel with:
  - Metadata (title, slug, topic mapping, Category/Concentration IDs, degree level).
  - `primary_author_id` dropdown (from `allowed_authors`).
  - Status (Idea, Draft, Ready for Review, Approved for Publish, Published).
  - Buttons:
    - **Save draft**
    - **Submit feedback & request AI revision** (triggers AI revise with comments)
    - **Approve for publish**
    - **Push to WordPress** (or this happens automatically when status changes).
- Inline comment capability:
  - Editors can highlight text and leave comments.
  - These comments are captured as feedback items.

When the editor hits **“AI revise”**:

- Perdia bundles:
  - The current article text.
  - All comments (or current comment) and their locations.
  - Relevant metadata (topic, category/concentration, degree level, monetization context).
- Sends this as a revision request to the AI.
- Receives a revised draft and replaces or versions the article text.
- Logs a training data row (see §8.4).

## 8.4 AI Training & Revision Log

### 8.4.1 Training Data Model

Create a table, e.g. `ai_revisions`:

| Field             | Type     | Notes                                                  |
|-------------------|----------|--------------------------------------------------------|
| id                | PK       | Internal ID                                            |
| article_id        | FK       | References the article                                 |
| previous_version  | text     | Article body before revision                           |
| revised_version   | text     | Article body after AI revision                         |
| comments_snapshot | json     | All comments that were present when the revision ran   |
| triggered_by_user | FK       | Which editor clicked "AI revise"                       |
| created_at        | datetime | Timestamp of revision                                  |
| include_in_training | bool   | Default true; can be toggled off in future if needed   |

### 8.4.2 AI Training Screen

Add an **AI Training** view in Perdia:

- Shows list of revision records (`ai_revisions`) with:
  - Article title
  - Date of revision
  - Triggering user
  - `include_in_training` flag
- Initial behavior (as per Kayleigh):
  - All revisions are used for training by default.
- Future-proofing:
  - Allow an admin to uncheck `include_in_training` if a particular revision is not representative.

## 8.5 Human Roles & Permissions

At minimum, define these roles within Perdia:

- **Admin**
  - Manage authors, config, and integration settings.
  - Override any article status.
- **Editor (Kayleigh, Tony)**
  - Can approve articles for publish.
  - Can trigger AI revisions.
  - Can modify metadata, monetization blocks, and authors.
- **Reviewer (Sara, Charity)**
  - Can add comments and suggest changes.
  - Can trigger AI revisions.
  - Cannot final-approve publishing (optional, configurable).

Permissions should be configurable using a simple RBAC model, but an initial hard-coded mapping is acceptable.

## 8.6 What MUST NOT Happen (Authoring Guardrails)

- No article must be published with:
  - A legacy or unrelated author name.
  - A pseudonym (“Julia Samples”, “Danny Samples”, “Alicia Samples”, “Kif Samples”) as the public author.
- No content should publish without a valid `primary_author_id` mapped to an existing WordPress author.
- If a WP author is missing/misconfigured:
  - The system must not silently assign a default like `Admin`.
  - Instead, fail with a clear error and require intervention.

---

# 9. UI/UX Addendum: Key Screens & Flows

This addendum also formalizes the key screens and flows so a dev team (or AI app builder) can implement the Perdia front-end correctly.

## 9.1 Main Navigation

At minimum, Perdia should have the following primary sections:

1. **Dashboard**
   - High-level metrics: number of drafts, ready-for-review, approved, published this week.
   - Quick links to “Articles waiting for your review”.

2. **Articles**
   - Table/grid with filters:
     - Status (Idea, Draft, Ready for Review, Approved, Published)
     - Topic / Category / Concentration
     - Author
     - Date ranges
   - Bulk actions (where safe): request AI revision, archive ideas, etc.

3. **AI Training**
   - View of `ai_revisions` for transparency and control.

4. **Configuration**
   - Authors, default authors, degree levels, integration settings.

## 9.2 Article List View

Columns:

- Title
- Status
- Primary author
- Topic/category label
- Last updated
- Flags: `Has Comments`, `Has Monetization`, `Needs Review`

Actions per row:

- Open (edit)
- View on site (if published)
- Duplicate
- Archive (for ideas that won’t be used)

## 9.3 Article Detail View (Editor)

Sections:

1. **Main Content Editor**
   - Rich text / markdown editor with headings, links, and inline formatting.
   - Inline comments pane.

2. **Right Sidebar: Metadata & Controls**
   - **Status** dropdown (Idea, Draft, Ready for Review, Approved, Published).
   - **Primary Author** dropdown (from allowed authors).
   - **Reviewer** dropdown (optional).
   - Topic mapping display:
     - Category label & ID
     - Concentration label & ID
     - Degree level label & code
   - Monetization block preview (if implemented).
   - Buttons:
     - Save
     - Request AI revise
     - Approve for publish
     - Publish / Push to WordPress (if user has permission).

3. **Comments / Feedback Panel**
   - List of comments with:
     - Text excerpt
     - Author of comment (Kayleigh/Tony/Sara/Charity)
     - Timestamp
   - Ability to mark a comment as “addressed”.

## 9.4 AI Training View

- Table of revision records with filters by article, date, user.
- Columns:
  - Article title
  - Revision date
  - Triggering user
  - `include_in_training` (checkbox)
- Detail view:
  - Before vs after diff (optional, future enhancement).
  - Comments snapshot.

## 9.5 Authors & Config View

- Table of allowed authors with:
  - Display name
  - WordPress slug
  - Role
  - Active (toggle)
- Default mapping editor:
  - For each `article_type`, choose a default `primary_author_id`.
- Degree level management (read-only from `Level Codes` initially).

---

# 10. Final Developer Checklist (Extended)

In addition to the checklist in the original document, confirm the following for **authoring and workflow**:

1. **Authors & Identity**
   - [ ] `allowed_authors` table created and seeded with Kayleigh, Tony, Sara, Charity.
   - [ ] Only these authors can be selected as `primary_author_id` for new content.
   - [ ] WordPress integration maps Perdia authors to WP authors correctly and fails safely if missing.

2. **Author Selection & Defaults**
   - [ ] Config exists to map `article_type` → default `primary_author_id`.
   - [ ] Editors can override the default before publishing.
   - [ ] No legacy or pseudonym authors are ever used in public bylines.

3. **Workflow & Queues**
   - [ ] Human-facing statuses implemented: Idea, Draft, Ready for Review, Approved for Publish, Published.
   - [ ] Time-based auto-publish (e.g., 5 days) is configurable and only applies once trust is established.
   - [ ] Editors can move articles through the states according to their role/permissions.

4. **AI Revision & Training**
   - [ ] “Request AI revise” button sends article + comments as context.
   - [ ] Revisions logged in `ai_revisions` table with previous and revised versions.
   - [ ] AI Training screen shows revisions and allows toggling `include_in_training`.

5. **UI/UX**
   - [ ] Article list, detail, training, and config screens are implemented as described.
   - [ ] Author selection and metadata are visible and easy to change prior to publishing.

If all of the above (plus the original sections 1–7) are implemented and validated, the Perdia app should meet Kayleigh’s requirements for **content, monetization, linking, and authoring workflow** end-to-end.

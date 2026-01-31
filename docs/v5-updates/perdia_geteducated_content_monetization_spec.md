# Perdia × GetEducated Content & Monetization Configuration Spec

_Generated from Kayleigh’s rules, GetEducated.com structure, and the `School_Degree Category_Subject Organization - IPEDS.xlsx` workbook._

## 1. Overview

Perdia is the content engine responsible for generating, revising, and publishing SEO-optimized, monetized articles for **GetEducated.com**. This document specifies how the app must be configured so that **content topics, monetization, linking, and data usage** all comply with Kayleigh’s latest rules.

This spec is intended to be **handed directly to the dev team**. It should be treated as a checklist: if all items in this document are implemented and verified, the system should behave correctly.

## 2. Content Scope & Core Rules

### 2.1 Allowed Topics

- All content must be about **online education**, **online degrees**, and **online schools**.

- Articles may cover broader trends in education **only if they are clearly relevant to online students**.

### 2.2 Cost & Data Sources

- When the AI references **degree costs, tuition, or total program price**, it must:

  - Pull the numbers from **GetEducated’s ranking reports**, not from random scraping.

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

## 6. AI Generation, Human Review, and Training

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

## 7. Developer Checklist

To confirm the new configuration is correct, verify the following:

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

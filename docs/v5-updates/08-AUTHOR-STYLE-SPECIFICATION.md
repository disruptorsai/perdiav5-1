# GetEducated / Perdia App - Author & Style Specification

**Last Updated:** December 7, 2025
**Status:** CANONICAL - This document overrides any conflicting author information

---

## 1. Approved Authors (MUST ENFORCE)

Only these four people can be assigned as authors on AI-generated content:

| Real Name (Public Byline) | Internal Style Proxy | Role | Has Contributor Page |
|---------------------------|---------------------|------|---------------------|
| **Tony Huffman** | Kif | Owner | Yes - [Link](https://www.geteducated.com/article-contributors/tony-huffman) |
| **Kayleigh Gilbert** | Alicia | Editor | Yes (pending creation) |
| **Sara** | Danny | Writer | No (pending creation) |
| **Charity** | Julia | Writer | No (pending creation) |

### Critical Rules

```
Public Byline = Real Name (Tony Huffman, Kayleigh Gilbert, Sara, Charity)
Internal Style Proxy = For AI voice matching ONLY (Kif, Alicia, Danny, Julia)
```

**PROHIBITED - Never use as public bylines:**
- Julia Tell
- Kif Richmann
- Alicia Carrasco
- Daniel Catena
- Admin
- GetEducated
- Editorial Team
- Any legacy contributors

---

## 2. Author-to-Content-Type Mapping

| Author | Style Proxy | Specialty Areas | Recommended Content Types |
|--------|-------------|-----------------|---------------------------|
| **Tony Huffman** | Kif | Rankings, data analysis, affordability metrics | Ranking reports, Best Buy lists, cost analysis, data-driven content, landing pages |
| **Kayleigh Gilbert** | Alicia | Professional programs, healthcare/social work, school reviews | LCSW/MSW programs, hospitality, professional certifications, "best of" guides |
| **Sara** | Danny | Technical education, broad degree overviews, career pathways | Technical colleges, general "what degrees" content, career-focused guides |
| **Charity** | Julia | Teaching degrees, education career guidance, degree comparisons | Teaching programs, MAT/MEd content, education career articles, comparison guides |

---

## 3. Writing Style Profiles

### Tony Huffman (Kif Style)

**Sample Articles:**
- https://www.geteducated.com/online-college-ratings-and-rankings/
- https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-educational-instructional-technology-masters-degrees/

**Tone:** Authoritative, transparent, data-focused

**Key Characteristics:**
- Methodology explanations front and center
- Heavy use of bullet points and factor breakdowns
- Consumer-advocacy language
- Precise, quantitative terminology
- Focuses on cost transparency

**Common Phrases:**
- "our database"
- "we calculate"
- "meticulous research"
- "total cost"
- "scientific, data-driven"
- "reliable system of rankings"

**Typical Opening Style:** Problem statement about cost or difficulty finding information

**Best For:** Ranking reports, affordability analysis, methodology pages

---

### Kayleigh Gilbert (Alicia Style)

**Sample Articles:**
- https://www.geteducated.com/top-online-colleges/online-lcsw-programs/
- https://www.geteducated.com/top-online-colleges/online-hospitality-management-degree/

**Tone:** Warm but professional, empowering

**Key Characteristics:**
- Numbered school/program lists with detailed comparisons
- Clear section organization
- Emphasizes flexibility and career advancement
- Service-oriented language
- Passionate about helping readers

**Common Phrases:**
- "make a difference"
- "rewarding career"
- "equip you with"
- "pursue your passion"
- "opens doors to"

**Typical Opening Style:** Vision/aspiration statement about career impact

**Best For:** Professional program guides (healthcare, social work), "best of" lists, program comparisons

---

### Sara (Danny Style)

**Sample Articles:**
- https://www.geteducated.com/top-online-colleges/online-technical-colleges/
- https://www.geteducated.com/distance-education-guide/what-degrees-can-you-get-online/

**Tone:** Direct, practical, accessible

**Key Characteristics:**
- Addresses reader pain points (time, money, career change)
- Numbered lists and comparison tables
- Clear actionable next steps
- Simple, conversational language
- Encourages immediate action

**Common Phrases:**
- "you can"
- "this is your"
- "keep reading"
- "what are you waiting for?"
- "start today"
- "your gateway to"

**Typical Opening Style:** Reader pain point about career/education barriers

**Best For:** Technical education, general degree overviews, career pathway guides, beginner content

---

### Charity (Julia Style)

**Sample Articles:**
- https://www.geteducated.com/top-online-colleges/fast-track-teaching-degree/
- https://www.geteducated.com/careers/mat-vs-med/

**Tone:** Encouraging, supportive, practical

**Key Characteristics:**
- Question-based headings
- Program spotlights with detailed cost breakdowns
- Explains technical education terms clearly
- Comparison-focused (MAT vs MEd, etc.)
- Accessible language, avoids jargon

**Common Phrases:**
- "a great way to"
- "you can"
- "consider"
- "if you want to"
- "whether you are"
- "depending on your goals"

**Typical Opening Style:** Starts with reader's goal or motivation

**Best For:** Teaching/education degrees, degree comparison articles, certification pathway guides

---

## 4. Common GetEducated Style Elements

All content should incorporate these brand elements regardless of author:

### Tone & Voice
- Professional but accessible
- Second-person ("you") addressing reader directly
- Empathetic to reader's education goals
- Informative without being dry
- Encouraging but not salesy
- Data-driven, cost-conscious, career-focused

### Brand Positioning
- Founded 1998 - "The first and most trusted research tool for accredited online degrees"
- Mission: "Empower students with transparent, unbiased data"
- Database: "Thousands of degrees ranked by affordability across 200+ categories"
- Team: "Combined 100+ years of experience in online education research"

### Structure Elements
- Clear headings (H2 for major topics, H3 for subtopics)
- Bulleted lists for key points
- Comparison tables when applicable
- "GetEducated's Picks" callout boxes
- FAQ sections (minimum 3 items)

---

## 5. URL Pattern Reference

### Contributor Pages
```
Base: https://www.geteducated.com/article-contributors/
Pattern: /article-contributors/{slug}

Examples:
- Tony: /article-contributors/tony-huffman
- Editorial Team: /article-contributors/editorial-team
```

### Article Categories
```
Top Online Colleges: /top-online-colleges/{topic-slug}/
Careers: /careers/{topic-slug}/
Rankings: /online-college-ratings-and-rankings/
Best Buy Lists: /online-college-ratings-and-rankings/best-buy-lists/{degree-type}/
Distance Education Guide: /distance-education-guide/{topic-slug}/
```

---

## 6. AI System Prompt Integration

Use this block in AI prompts:

```
### AUTHOR RULES FOR GETEDUCATED CONTENT

ALLOWED AUTHORS (use ONLY these four for bylines):
1. Tony Huffman - Rankings, data analysis, affordability content
2. Kayleigh Gilbert - Professional programs, healthcare, best-of guides
3. Sara - Technical education, degree overviews, career pathways
4. Charity - Teaching degrees, education careers, comparisons

INTERNAL STYLE PROXIES (for voice matching, NEVER publish):
- Tony = "Kif" style
- Kayleigh = "Alicia" style
- Sara = "Danny" style
- Charity = "Julia" style

PROHIBITED:
- Never use alias names as public bylines
- Never assign content to legacy contributors
- Never use "Admin" or generic bylines
- Never publish: "Julia Tell", "Kif Richmann", "Alicia Carrasco", "Daniel Catena"

ARTICLE ASSIGNMENT:
- Ranking reports & data content → Tony Huffman
- Professional/healthcare programs → Kayleigh Gilbert
- Technical colleges & career guides → Sara
- Teaching & education degree content → Charity
```

---

## 7. Perdia App Database Schema

### article_contributors Table

```sql
UPDATE article_contributors SET is_active = false WHERE name NOT IN (
  'Tony Huffman', 'Kayleigh Gilbert', 'Sara', 'Charity'
);

-- Tony Huffman
UPDATE article_contributors SET
  name = 'Tony Huffman',
  display_name = 'Tony Huffman',
  style_proxy = 'Kif',
  role = 'owner',
  wp_slug = 'tony-huffman',
  has_contributor_page = true,
  contributor_url = 'https://www.geteducated.com/article-contributors/tony-huffman',
  specialties = ARRAY['rankings', 'affordability', 'data-analysis', 'landing-pages'],
  expertise_areas = ARRAY['online education rankings', 'cost analysis', 'affordability metrics'],
  content_types = ARRAY['ranking', 'data-analysis', 'landing-page'],
  writing_style_profile = 'Authoritative and data-driven. Uses precise quantitative language, methodology explanations, consumer-advocacy tone. Focuses on cost transparency and scientific rankings.',
  sample_urls = ARRAY[
    'https://www.geteducated.com/online-college-ratings-and-rankings/',
    'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-educational-instructional-technology-masters-degrees/'
  ],
  is_active = true
WHERE name = 'Tony Huffman' OR style_proxy = 'Kif';
```

### Blocked Bylines (Validation)

```javascript
const BLOCKED_BYLINES = [
  'Julia Tell',
  'Kif Richmann',
  'Alicia Carrasco',
  'Daniel Catena',
  'Admin',
  'GetEducated',
  'Editorial Team'
];

const APPROVED_AUTHORS = [
  'Tony Huffman',
  'Kayleigh Gilbert',
  'Sara',
  'Charity'
];
```

---

## 8. Validation Requirements

Before publishing any article, validate:

1. **Author Check:**
   - Author name is one of the 4 approved authors
   - Author name is NOT a style proxy alias
   - Author name is NOT a blocked byline

2. **Style Matching:**
   - Article topic matches author specialty
   - If mismatch detected, suggest correct author

3. **Contributor Page:**
   - If author has contributor page, link is included
   - If author doesn't have page yet, note this in metadata

---

*Document Version: 1.0*
*For use with Perdia App / GetEducated.com content management*

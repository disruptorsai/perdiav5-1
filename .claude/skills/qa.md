---
description: "Run QA tests - self-evolving test suite that learns from Slack issues. Use: /qa, /qa full, /qa article [id], /qa stats"
allowed-tools: ["Task", "Read", "Bash", "Write"]
---

# QA - Self-Evolving Quality Assurance

> Run the self-evolving QA test suite that learns from Slack issues and adapts its tests accordingly.

## Arguments: $ARGUMENTS

## Action

Parse the arguments and execute the appropriate QA action:

### No arguments or "full" - Run Full Suite

```javascript
// Run complete QA suite
import { qaService } from './src/services/qa'

const results = await qaService.runFullSuite({
  verbose: true,
  includeDb: true,
  generateReport: true,
  onProgress: ({ stage, message }) => console.log(`[${stage}] ${message}`)
})

console.log(results.report)
```

**Execute:**
1. Read `src/services/qa/qaTestingService.js` to understand the service
2. Use Task tool to run the QA suite:

```
Task(
  subagent_type: "general-purpose",
  description: "Run QA test suite",
  prompt: """
  Run the perdiav5 QA test suite.

  1. Navigate to C:\Users\Disruptors\Repos\perdiav5\perdiav5
  2. Import and run the QA service:
     - Run internal linking tests (topicRelevanceService validation)
     - Run revision tests (word count, replacement detection)
     - Run dynamic tests (from tracked issues)
  3. Generate and display the report
  4. If tests fail, list recommendations

  The QA system is at: src/services/qa/
  Main service: qaTestingService.js
  """
)
```

### "article [id]" - Test Specific Article

Test a specific article's content quality:

```
Task(
  subagent_type: "general-purpose",
  description: "Test article QA",
  prompt: """
  Test article [id] using the QA system.

  1. Load the article from Supabase
  2. Run link validation (404s, competitors)
  3. Test internal link relevance
  4. Check quality metrics
  5. Report findings
  """
)
```

### "stats" - Show Issue Statistics

Display QA issue tracking statistics:

```
Task(
  subagent_type: "general-purpose",
  description: "QA issue stats",
  prompt: """
  Get QA issue statistics from the issue tracker.

  Show:
  - Total issues by category
  - Issues by status (new, fixed, closed)
  - Issues from last 7 days
  - Priority issues (categories with 3+ reports)
  """
)
```

### "issues" - List Recent Issues

Show recent issues from Slack:

```
Task(
  subagent_type: "general-purpose",
  description: "List QA issues",
  prompt: """
  List recent QA issues from the tracking system.

  Query qa_issues table for recent entries.
  Show: category, description, status, reporter, date
  """
)
```

### "tests" - List Dynamic Test Cases

Show dynamically generated test cases:

```
Task(
  subagent_type: "general-purpose",
  description: "List dynamic tests",
  prompt: """
  Generate and display dynamic test cases from tracked issues.

  Use issueTracker.generateTestCases() to show what tests
  have been automatically created from Slack feedback.
  """
)
```

---

## Test Categories

| Category | What It Tests |
|----------|---------------|
| Internal Linking | Subject area matching, relevance scoring, forbidden cross-links |
| External Links | 404 errors, competitor domains, .edu blocking, whitelist compliance |
| AI Revisions | Content preservation, word count, replacement detection |
| Statistics | Data accuracy (requires ranking data import) |
| Dynamic | Tests generated from Slack issues |

---

## Output

```
═══════════════════════════════════════════════════════════
  PERDIA QA - Quality Assurance Results
═══════════════════════════════════════════════════════════

📊 Results: 92% passed

## Summary
- Total Tests: 25
- ✅ Passed: 23
- ❌ Failed: 2
- ⏭️ Skipped: 0

## Test Suites

### ✅ Internal Linking (8/8 passed)
  ✓ Subject Area Extraction
  ✓ Related Subjects Logic
  ✓ Relevance Scoring
  ✓ Scenario: ministry_no_business
  ...

### ⚠️ AI Revisions (3/4 passed)
  ✓ Content Preservation
  ✓ Simple Replacement Detection
  ✓ Rejected Links Memory
  ✗ Word Count Validation - Issue found
    → Expected 10 words, got 9

## Recommendations
🔴 [AI Revisions] Word counting has issues - check HTML stripping

═══════════════════════════════════════════════════════════
```

---

## Integration with /slack-agent

The QA system is tightly integrated with /slack-agent:

1. **Issue Recording:** When /slack-agent finds bugs, they're recorded to qa_issues
2. **Test Generation:** Issues automatically generate test cases
3. **Fix Verification:** After fixing, relevant QA tests run
4. **Reporting:** QA summary included in Slack reports

---

## Related

- `/slack-agent` - Autonomous bug fixing (feeds issues to QA)
- `src/services/qa/` - QA service code
- `supabase/migrations/20260130000000_add_qa_tables.sql` - Database tables
- `scripts/post-commit-qa.js` - Post-commit runner

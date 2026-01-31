/**
 * Page-specific help content for the "How to use this page" feature.
 * Each key corresponds to a route path, and values contain comprehensive help information.
 */

export const pageHelpContent = {
  '/': {
    title: 'Dashboard',
    description: 'Your command center for monitoring content production at a glance.',
    sections: [
      {
        heading: 'What is the Dashboard?',
        content:
          'The Dashboard is your central hub for monitoring the entire content production pipeline. It provides real-time visibility into article status, recent activity, and key performance metrics. Use it as your starting point each day to understand what needs attention.',
      },
      {
        heading: 'Pipeline Overview Cards',
        content:
          'The top row shows status cards representing each stage of your content pipeline: Ideas (pending approval), Drafts (being generated), In Review (awaiting human review), Ready to Publish (approved), and Published (live on site). Click any card to jump directly to that filtered view.',
      },
      {
        heading: 'Recent Activity Feed',
        content:
          'The activity feed shows a chronological list of recent actions: articles generated, status changes, publishing events, and more. Each entry includes a timestamp and quick link to the relevant item. Use this to stay informed about what\'s happening without checking each page.',
      },
      {
        heading: 'Quick Actions',
        content:
          'Use the quick action buttons to perform common tasks without navigating away: "Generate Article" starts a new generation from approved ideas, "Review Queue" jumps to pending reviews, and "View Library" opens your full content catalog.',
      },
      {
        heading: 'Performance Metrics',
        content:
          'The metrics section shows key statistics: articles generated today/this week, average quality scores, publishing throughput, and auto-publish countdown timers. These help you track productivity and identify potential bottlenecks.',
      },
    ],
    faqs: [
      {
        question: 'How often does the Dashboard refresh?',
        answer:
          'The Dashboard automatically refreshes every 30 seconds. You can also manually refresh by clicking the refresh icon or pressing F5.',
      },
      {
        question: 'What do the colors on the status cards mean?',
        answer:
          'Blue indicates normal status, yellow means items need attention soon, and red indicates urgent items (like articles approaching auto-publish deadlines without review).',
      },
    ],
  },

  '/ideas': {
    title: 'Content Ideas',
    description: 'Manage, approve, and organize content ideas before generation.',
    sections: [
      {
        heading: 'What is the Content Ideas Page?',
        content:
          'This page is where all content ideas live before they become articles. Ideas can be manually created, AI-generated from keyword research, or imported from external sources. Each idea must be approved before it enters the generation queue. Think of this as your content planning headquarters.',
      },
      {
        heading: 'Ideas Table',
        content:
          'The main table displays all ideas with columns for: Title (the proposed article title), Content Type (guide, listicle, ranking, etc.), Topics/Keywords, Status (pending, approved, rejected), Created Date, and Actions. Click column headers to sort, or use the search bar to find specific ideas.',
      },
      {
        heading: 'Status Workflow',
        content:
          'Ideas follow a simple workflow: PENDING → APPROVED or REJECTED. Pending ideas await your review. Approved ideas are eligible for article generation. Rejected ideas are archived but not deleted (you can restore them later). Once an article is generated from an idea, it moves to COMPLETED status.',
      },
      {
        heading: 'Approving Ideas',
        content:
          'Review each idea\'s title, keywords, and content type. Click the checkmark icon to approve (adds to generation queue) or the X icon to reject. For bulk operations, use the checkboxes to select multiple ideas, then use the bulk action buttons at the top.',
      },
      {
        heading: 'Creating Ideas Manually',
        content:
          'Click "Add Idea" to create a new idea. Fill in: Title (be specific and SEO-friendly), Content Type (determines article structure), Target Keywords (comma-separated), Description (optional notes about the article direction). The more detail you provide, the better the AI generation will be.',
      },
      {
        heading: 'AI Idea Generation',
        content:
          'Click "Generate Ideas" to have the AI suggest new content ideas based on your keyword list, existing content gaps, or trending topics in your niche. Review generated ideas carefully—they\'re suggestions, not guaranteed winners.',
      },
      {
        heading: 'Filtering & Search',
        content:
          'Use the filter dropdown to view ideas by status (All, Pending, Approved, Rejected, Completed). The search bar searches across title, keywords, and description. Combine filters for precise results like "all pending ideas about nursing degrees."',
      },
    ],
    faqs: [
      {
        question: 'How many ideas should I approve at once?',
        answer:
          'It depends on your generation capacity. Each approved idea will eventually generate an article, so only approve what you can review within your auto-publish window (default 5 days).',
      },
      {
        question: 'Can I edit an idea after creating it?',
        answer:
          'Yes! Click on any idea row to open the edit modal. You can modify title, keywords, content type, and description until the idea is used for generation.',
      },
      {
        question: 'What happens to rejected ideas?',
        answer:
          'Rejected ideas are hidden from the default view but not deleted. Use the filter to show rejected ideas, and you can restore them to pending status if you change your mind.',
      },
    ],
  },

  '/library': {
    title: 'Content Library',
    description: 'Browse, search, and manage all generated articles in your system.',
    sections: [
      {
        heading: 'What is the Content Library?',
        content:
          'The Content Library contains every article in your system, regardless of status. It\'s your complete content database where you can search, filter, edit, and manage articles throughout their lifecycle. Use this page to find specific articles, check overall production, and manage your content catalog.',
      },
      {
        heading: 'Article Cards',
        content:
          'Each article displays as a card showing: Title, Status badge (color-coded), Assigned Author, Quality Score (0-100), Word Count, Created Date, and quick action buttons. Cards are sorted by creation date by default, with newest first.',
      },
      {
        heading: 'Status Filters',
        content:
          'The status filter bar lets you view articles by stage: All Articles, Drafts (just generated), In Review (human review needed), Ready to Publish (approved), Published (live on site). Click a status to filter; the count badge shows how many articles are in each status.',
      },
      {
        heading: 'Search & Advanced Filters',
        content:
          'The search bar searches article titles and content. Use advanced filters for: Author (filter by contributor), Date Range (created or published date), Quality Score (minimum threshold), Content Type, and Topics. Combine multiple filters to narrow results.',
      },
      {
        heading: 'Opening Articles',
        content:
          'Click any article card to open it in the Article Editor for full editing capabilities. The card\'s action menu (three dots) offers quick actions: View, Edit, Change Status, Regenerate, Delete.',
      },
      {
        heading: 'Batch Generation',
        content:
          'Click "Generate Batch" to generate multiple articles at once from approved ideas. Set the batch size (1-10 articles), and the system will process them sequentially. A progress indicator shows generation status.',
      },
      {
        heading: 'Bulk Actions',
        content:
          'Select multiple articles using checkboxes, then use bulk actions: Change Status (move multiple articles to a new status), Delete (remove selected articles), Export (download as JSON or CSV).',
      },
    ],
    faqs: [
      {
        question: 'How do I find a specific article?',
        answer:
          'Use the search bar to search by title or content keywords. For more precision, use advanced filters to narrow by date, author, or status first.',
      },
      {
        question: 'Can I restore a deleted article?',
        answer:
          'No, deletion is permanent. Articles are soft-deleted for 30 days (viewable with "Show Deleted" filter), then permanently removed. Always export important articles before deleting.',
      },
      {
        question: 'What does the Quality Score mean?',
        answer:
          'Quality Score (0-100) is an automated assessment of article quality based on: word count, internal links, external citations, FAQ presence, heading structure, and readability. Scores below 70 typically need revision before publishing.',
      },
    ],
  },

  '/review': {
    title: 'Review Queue',
    description: 'Your final quality gate before publishing—review and approve articles.',
    sections: [
      {
        heading: 'What is the Review Queue?',
        content:
          'The Review Queue is where articles land after AI generation, waiting for human review before publishing. This is your quality control checkpoint—every article should be reviewed here to ensure it meets your standards before going live. The queue shows articles sorted by urgency (auto-publish deadline).',
      },
      {
        heading: 'Queue Priority',
        content:
          'Articles are automatically sorted by urgency. Those closest to their auto-publish deadline appear first (highlighted in yellow/red). Newly generated articles appear at the bottom. This ensures you always see what needs attention most urgently.',
      },
      {
        heading: 'Article Preview Cards',
        content:
          'Each card shows: Title, Assigned Author, Quality Score with breakdown, Auto-Publish Countdown (time remaining), Content Preview (first 200 characters), and any Quality Warnings (issues flagged by automated checks). Click to expand for full details.',
      },
      {
        heading: 'Quality Indicators',
        content:
          'Each article displays quality metrics: Word Count (target: 1500-2500), Internal Links (target: 3-5), External Citations (target: 2-4), FAQ Count (minimum: 3), Heading Structure (proper H2/H3 hierarchy). Red indicators show metrics below minimum thresholds.',
      },
      {
        heading: 'Review Actions',
        content:
          '"Approve" moves the article to Ready to Publish status. "Request Revision" sends it back for AI improvement with your feedback. "Reject" removes it from the pipeline. "Edit" opens the full Article Editor for manual changes.',
      },
      {
        heading: 'Auto-Publish System',
        content:
          'Articles have an auto-publish deadline (configurable in Settings, default 5 days). If not reviewed by this deadline, they\'re automatically published (if auto-publish is enabled) or flagged as overdue. The countdown shows time remaining.',
      },
      {
        heading: 'Risk Levels',
        content:
          'Articles are assigned risk levels based on automated checks: LOW (all checks pass), MEDIUM (minor issues), HIGH (significant issues), CRITICAL (must not publish without review). High/Critical risk articles are blocked from auto-publish.',
      },
      {
        heading: 'Bulk Review',
        content:
          'For efficiency, you can select multiple low-risk articles and approve them in bulk. However, we recommend individually reviewing any article with a quality score below 80 or risk level above LOW.',
      },
    ],
    faqs: [
      {
        question: 'What happens if I don\'t review an article before the deadline?',
        answer:
          'If auto-publish is enabled and the article is LOW risk, it publishes automatically. Otherwise, it\'s marked as "Overdue" and requires manual action. Check Settings to configure this behavior.',
      },
      {
        question: 'How do I request specific changes to an article?',
        answer:
          'Click "Request Revision" and enter your feedback in the text box. Be specific about what needs to change—the AI uses your feedback to improve the article. You can also click "Edit" to make changes yourself.',
      },
      {
        question: 'Can I preview how the article will look on the website?',
        answer:
          'Click "Preview" to see a rendered preview of the article with formatting applied. This shows how it will appear after publishing.',
      },
    ],
  },

  '/automation': {
    title: 'Automation',
    description: 'Configure and monitor automated content generation workflows.',
    sections: [
      {
        heading: 'What is the Automation Page?',
        content:
          'The Automation page controls your automated content pipeline. Here you configure how articles are generated, scheduled, and published without manual intervention. Use this to set up "set it and forget it" content production or fine-tune automation levels.',
      },
      {
        heading: 'Automation Levels',
        content:
          'Choose your automation level: MANUAL (you trigger everything), ASSISTED (AI generates but you review), FULL AUTO (complete automation with guardrails). Each level balances control vs. efficiency. Start with Assisted to learn the system.',
      },
      {
        heading: 'Generation Queue',
        content:
          'The queue shows articles waiting to be generated. Items enter from approved ideas. You can: Reorder queue priority (drag and drop), Pause individual items, Cancel items, or Clear the entire queue. Active generation shows progress in real-time.',
      },
      {
        heading: 'Scheduling',
        content:
          'Configure when automatic generation runs: Set daily generation limits (e.g., 10 articles/day), Choose active hours (e.g., generate during business hours only), Set days of week (e.g., skip weekends). This prevents overwhelming your review queue.',
      },
      {
        heading: 'Auto-Publish Settings',
        content:
          'Configure automatic publishing: Enable/disable auto-publish entirely, Set review deadline (days before auto-publish), Set risk threshold (only auto-publish LOW risk articles), Configure publishing delays between articles.',
      },
      {
        heading: 'Monitoring Dashboard',
        content:
          'Real-time monitoring shows: Current queue status, Active generation progress, Success/failure rates, Recent generation log with timestamps. Use this to identify issues like repeated failures or stuck items.',
      },
      {
        heading: 'Failure Handling',
        content:
          'When generation fails, items are marked with the error reason. Options: Retry (attempt again), Regenerate (start fresh), Skip (remove from queue), or view error details for debugging. Repeated failures may indicate API issues.',
      },
    ],
    faqs: [
      {
        question: 'How many articles can I generate per day?',
        answer:
          'There\'s no hard limit, but we recommend 10-20 articles per day to maintain review quality. Generation is rate-limited by AI API quotas, which vary by plan.',
      },
      {
        question: 'What happens if generation fails?',
        answer:
          'Failed items are marked with an error badge and reason. They remain in queue for retry. Common causes: API rate limits, network issues, or malformed prompts. Check the error log for details.',
      },
      {
        question: 'Can I pause all automation temporarily?',
        answer:
          'Yes! Click "Pause All" at the top to stop all automated generation and publishing. Use this during maintenance or when you need to catch up on reviews. Click "Resume" to restart.',
      },
    ],
  },

  '/catalog': {
    title: 'Site Catalog',
    description: 'Manage the GetEducated article database for intelligent internal linking.',
    sections: [
      {
        heading: 'What is the Site Catalog?',
        content:
          'The Site Catalog contains every article from the GetEducated website. This database powers the intelligent internal linking feature—when AI generates new articles, it uses this catalog to find relevant existing articles to link to. Keeping this catalog current is essential for good internal linking.',
      },
      {
        heading: 'Why Internal Linking Matters',
        content:
          'Internal links help SEO by distributing page authority, help users discover related content, and keep visitors on your site longer. The AI uses this catalog to intelligently insert 3-5 relevant internal links in each generated article.',
      },
      {
        heading: 'Catalog Table',
        content:
          'The table shows all catalog articles: URL (the actual page URL), Title, Topics (tags/categories), Word Count, Last Updated, Times Linked To (how often this article is linked from generated content). Sort by any column.',
      },
      {
        heading: 'Syncing the Catalog',
        content:
          'Click "Sync Catalog" to import new articles from the GetEducated sitemap. This fetches the latest sitemap XML, identifies new URLs, and scrapes their titles and topics. Run this weekly to keep internal linking current.',
      },
      {
        heading: 'Manual Article Addition',
        content:
          'For articles not in the sitemap, click "Add Article" to manually add a URL. The system will scrape the page for title and topics. Use this for new articles that haven\'t been indexed yet.',
      },
      {
        heading: 'Link Analytics',
        content:
          'The "Link Analytics" tab shows: Most linked articles (popular link targets), Least linked articles (opportunities for more visibility), Link distribution by topic, Articles never linked to (potential orphans).',
      },
      {
        heading: 'Article Details',
        content:
          'Click any catalog article to see full details: Complete URL, All topics/tags, Last scraped date, Full content preview, List of generated articles that link to it. Use "Refresh" to re-scrape the article for updates.',
      },
      {
        heading: 'Managing Catalog Entries',
        content:
          'Remove outdated URLs (404s, redirects) by selecting and clicking "Remove." Edit topics/tags to improve linking relevance. Mark articles as "Priority" to make them more likely to be linked.',
      },
    ],
    faqs: [
      {
        question: 'How often should I sync the catalog?',
        answer:
          'Weekly is ideal for active sites. After publishing a batch of new articles, sync immediately to make them available for internal linking in future generated content.',
      },
      {
        question: 'Why is an article not being linked to?',
        answer:
          'The AI selects link targets based on topic relevance. If an article is never linked, its topics may not match generated content. Try editing its topics to be more specific or broader.',
      },
      {
        question: 'Can I force a specific article to be linked?',
        answer:
          'Not automatically, but you can edit any generated article to add specific links manually. Mark important articles as "Priority" to increase their linking likelihood.',
      },
    ],
  },

  '/keywords': {
    title: 'Keywords',
    description: 'Research and manage target keywords for content planning.',
    sections: [
      {
        heading: 'What is the Keywords Page?',
        content:
          'The Keywords page is your research hub for finding valuable content opportunities. Use keyword research tools to discover what people are searching for, evaluate competition and search volume, and save promising keywords for content planning.',
      },
      {
        heading: 'Keyword Research',
        content:
          'Enter a seed keyword (e.g., "online nursing degree") and click "Research" to fetch data. Results show: Related keywords, Search volume (monthly searches), Competition (difficulty to rank), CPC (advertising value), and Trend (up/down/stable).',
      },
      {
        heading: 'Understanding Metrics',
        content:
          'Search Volume: Higher is better for traffic potential. Competition: Lower is easier to rank. CPC: Higher indicates commercial intent. Focus on keywords with decent volume (100+) and manageable competition for best results.',
      },
      {
        heading: 'Saving Keywords',
        content:
          'Click the star icon to save keywords to your list. Organize saved keywords into groups (by topic, priority, or campaign). Saved keywords appear in the "My Keywords" tab for easy access.',
      },
      {
        heading: 'Creating Ideas from Keywords',
        content:
          'Select one or more saved keywords and click "Create Ideas" to automatically generate content ideas targeting those keywords. The AI suggests appropriate titles and content types based on keyword intent.',
      },
      {
        heading: 'Keyword Groups',
        content:
          'Organize keywords into groups for better management: "High Priority" for immediate content, "Long-tail" for specific queries, "Competitive" for future content when authority grows. Drag keywords between groups.',
      },
      {
        heading: 'Export & Import',
        content:
          'Export keyword lists as CSV for use in other tools. Import keywords from external research tools (SEMrush, Ahrefs, etc.) by uploading CSV files with keyword, volume, and competition columns.',
      },
    ],
    faqs: [
      {
        question: 'Where does keyword data come from?',
        answer:
          'Keyword data is fetched from DataForSEO API, which aggregates data from multiple sources including Google Keyword Planner. Data is refreshed with each search.',
      },
      {
        question: 'How do I choose good keywords?',
        answer:
          'Look for keywords with: 100+ monthly search volume, competition score under 50 (out of 100), relevance to your site\'s topics, and clear user intent that matches your content type.',
      },
      {
        question: 'Can I research competitor keywords?',
        answer:
          'Enter a competitor URL in the domain analysis tool to see what keywords they rank for. Use this for inspiration, but avoid directly copying their strategy.',
      },
    ],
  },

  '/integrations': {
    title: 'Integrations',
    description: 'Connect external services, APIs, and publishing destinations.',
    sections: [
      {
        heading: 'What is the Integrations Page?',
        content:
          'The Integrations page manages connections between Perdia and external services. This includes your WordPress site (for publishing), AI providers (for generation), analytics platforms, and other third-party APIs. Properly configured integrations enable the full automation pipeline.',
      },
      {
        heading: 'WordPress Connection',
        content:
          'Connect your WordPress site for direct publishing. Enter: Site URL (your WordPress address), Application Password (generated in WordPress), Author Mapping (which WordPress users match your contributors). Test the connection before saving.',
      },
      {
        heading: 'AI Provider Keys',
        content:
          'Configure API keys for AI services: Grok (primary generation), Claude (revision and fallback), StealthGPT (humanization). Each key shows status (valid/invalid) and usage statistics. Keys are encrypted in storage.',
      },
      {
        heading: 'Testing Connections',
        content:
          'Each integration has a "Test" button to verify it\'s working. Tests check: API key validity, endpoint accessibility, required permissions. Failed tests show specific error messages for troubleshooting.',
      },
      {
        heading: 'Webhook Configuration',
        content:
          'Set up webhooks to notify external systems when events occur: Article generated, Article published, Status changed, Error occurred. Enter the webhook URL and select which events to trigger it.',
      },
      {
        heading: 'Analytics Integration',
        content:
          'Connect Google Analytics or other analytics platforms to track published article performance. See pageviews, engagement, and conversion data for your generated content.',
      },
      {
        heading: 'API Usage & Limits',
        content:
          'Monitor API usage across all integrations: Requests today/this month, Rate limit status, Cost tracking (for paid APIs), Usage trends over time. Set alerts for approaching limits.',
      },
    ],
    faqs: [
      {
        question: 'How do I get a WordPress Application Password?',
        answer:
          'In WordPress: Go to Users → Your Profile → Application Passwords. Enter a name (e.g., "Perdia") and click Add New. Copy the generated password immediately—it won\'t be shown again.',
      },
      {
        question: 'What if my API key stops working?',
        answer:
          'Check if the key expired or was revoked at the provider\'s dashboard. Generate a new key if needed. Also verify you haven\'t exceeded rate limits or billing limits.',
      },
      {
        question: 'Can I use multiple WordPress sites?',
        answer:
          'Currently, one WordPress site per Perdia instance. For multiple sites, you\'d need separate Perdia installations or use webhooks to distribute content.',
      },
    ],
  },

  '/contributors': {
    title: 'Contributors',
    description: 'Manage article authors, their profiles, and writing styles.',
    sections: [
      {
        heading: 'What is the Contributors Page?',
        content:
          'Contributors are the authors attributed to your generated articles. Each contributor has a distinct writing style profile that the AI mimics when generating content. For GetEducated, there are 4 approved contributors: Tony Huffman, Kayleigh Gilbert, Sara, and Charity.',
      },
      {
        heading: 'Contributor Cards',
        content:
          'Each contributor shows: Name (the public byline), Avatar, Expertise Areas (topics they typically cover), Content Types (article formats they write), Article Count (how many assigned), Average Quality Score for their articles.',
      },
      {
        heading: 'Writing Style Profiles',
        content:
          'Each contributor has a detailed style profile including: Tone (formal, conversational, authoritative), Vocabulary preferences, Sentence structure patterns, Typical phrases and transitions, Topics of expertise. The AI uses this to match their voice.',
      },
      {
        heading: 'Content Type Mapping',
        content:
          'Contributors specialize in different content types: Tony → Rankings, data analysis, affordability guides. Kayleigh → Professional programs, best-of guides. Sara → Technical education, degree overviews. Charity → Teaching degrees, comparisons.',
      },
      {
        heading: 'Automatic Assignment',
        content:
          'When generating articles, the AI automatically assigns the best-matching contributor based on: Article topic vs. contributor expertise, Content type vs. contributor specialization, Workload balancing across contributors.',
      },
      {
        heading: 'Viewing Contributor Details',
        content:
          'Click any contributor to see their full profile: Complete style guide, All assigned articles, Performance metrics, Edit options. Use this to fine-tune how the AI writes in their voice.',
      },
      {
        heading: 'Style Training',
        content:
          'Improve contributor style matching by: Uploading sample articles they\'ve written, Providing feedback on generated content, Adjusting style parameters. The system learns from approved revisions.',
      },
    ],
    faqs: [
      {
        question: 'Can I add new contributors?',
        answer:
          'For GetEducated, only the 4 approved contributors should be used. Adding contributors requires updating both Perdia and the WordPress Article Contributor system.',
      },
      {
        question: 'Why was a specific contributor assigned to an article?',
        answer:
          'Click on the article to see assignment reasoning. The AI considers topic match (50% weight), content type (30% weight), and keyword relevance (20% weight).',
      },
      {
        question: 'How do I improve a contributor\'s writing style?',
        answer:
          'Upload more sample articles, make specific edits to generated content (the AI learns from your corrections), or adjust the style parameters in their profile.',
      },
    ],
  },

  '/ai-training': {
    title: 'AI Training',
    description: 'Improve AI output quality through feedback and training data.',
    sections: [
      {
        heading: 'What is AI Training?',
        content:
          'The AI Training page helps you improve generation quality over time. By providing feedback, uploading examples, and reviewing AI decisions, you train the system to better match your standards. Think of it as teaching the AI your preferences.',
      },
      {
        heading: 'Feedback Loop',
        content:
          'When you edit generated content, those edits become training signals. The system tracks: What you changed, Why (based on patterns), How often similar changes occur. Over time, the AI learns to avoid mistakes you consistently correct.',
      },
      {
        heading: 'Style Samples',
        content:
          'Upload example articles to teach writing styles. For each contributor, upload 5-10 articles that exemplify their voice. The AI analyzes these for: Tone, sentence structure, vocabulary, transitions, and formatting patterns.',
      },
      {
        heading: 'Quality Patterns',
        content:
          'View trends in quality scores over time. See: Which issues occur most frequently, Which contributors have highest/lowest scores, Which content types perform best, Common quality problems to address.',
      },
      {
        heading: 'Revision Analysis',
        content:
          'The system analyzes your manual revisions to learn patterns: If you consistently add more examples, future articles will include more. If you often rewrite intros, the AI adjusts its intro style.',
      },
      {
        heading: 'Prompt Refinement',
        content:
          'Advanced users can view and refine the prompts used for generation. See what instructions the AI receives, and suggest modifications to improve output quality or consistency.',
      },
      {
        heading: 'A/B Testing',
        content:
          'Run experiments with different AI settings: Compare models, test prompt variations, try different humanization levels. Results show which configuration produces better quality scores.',
      },
    ],
    faqs: [
      {
        question: 'How long until the AI shows improvement?',
        answer:
          'You should see incremental improvements after 20-30 reviewed articles. Significant style matching improvements may take 50-100 articles with consistent feedback.',
      },
      {
        question: 'Does training affect all contributors or just one?',
        answer:
          'Training can be global (affects all generation) or contributor-specific (only affects one author\'s style). Style samples are always contributor-specific.',
      },
      {
        question: 'Can I undo training if results get worse?',
        answer:
          'Yes, the Training History shows all learning events. You can rollback to a previous training state if new changes produced worse results.',
      },
    ],
  },

  '/analytics': {
    title: 'Analytics',
    description: 'Track content production metrics and performance data.',
    sections: [
      {
        heading: 'What is the Analytics Page?',
        content:
          'The Analytics page provides detailed metrics on your content production pipeline. Track generation velocity, quality trends, publishing throughput, and more. Use these insights to optimize your workflow and identify bottlenecks.',
      },
      {
        heading: 'Production Metrics',
        content:
          'The main dashboard shows: Articles Generated (today/week/month), Generation Success Rate (% completed vs failed), Average Generation Time, Queue Depth (ideas waiting), Review Backlog (articles awaiting review).',
      },
      {
        heading: 'Quality Trends',
        content:
          'Quality charts show: Average Quality Score over time, Score distribution (how many articles at each score level), Common quality issues by frequency, Quality by contributor and content type.',
      },
      {
        heading: 'Publishing Analytics',
        content:
          'Track publishing output: Articles Published (daily/weekly/monthly), Auto-publish vs Manual publish ratio, Publishing delays (time from approval to live), Failed publishes and reasons.',
      },
      {
        heading: 'Contributor Performance',
        content:
          'Compare contributors: Articles assigned to each, Average quality score per contributor, Revision rate (how often their articles need editing), Content type distribution.',
      },
      {
        heading: 'Time Analysis',
        content:
          'Understand timing patterns: Best days/hours for generation, Time in each pipeline stage, Bottleneck identification (where articles get stuck), Throughput optimization suggestions.',
      },
      {
        heading: 'Export & Reports',
        content:
          'Export analytics data as CSV or PDF reports. Schedule weekly email reports summarizing production metrics. Create custom date range reports for specific analysis.',
      },
    ],
    faqs: [
      {
        question: 'How far back does analytics data go?',
        answer:
          'Analytics data is retained for 12 months. For longer history, export monthly reports to maintain records.',
      },
      {
        question: 'What\'s a good quality score to target?',
        answer:
          'Aim for an average quality score of 80+. Articles scoring below 70 typically need revision. Top-performing pipelines average 85-90.',
      },
      {
        question: 'Why do I see discrepancies in the numbers?',
        answer:
          'Numbers update in real-time but charts may use cached data (refresh every 5 minutes). Some metrics exclude deleted articles while others include them.',
      },
    ],
  },

  '/settings': {
    title: 'Settings',
    description: 'Configure application behavior, rules, and preferences.',
    sections: [
      {
        heading: 'What is the Settings Page?',
        content:
          'The Settings page controls all aspects of Perdia\'s behavior. Configuration is organized into tabs: GetEducated (client-specific rules), Automation (generation and publishing settings), AI Models (model selection and parameters), Quality Rules (minimum standards), and System (general preferences).',
      },
      {
        heading: 'GetEducated Tab',
        content:
          'Client-specific settings: Approved Authors (the 4 allowed contributors), Link Compliance Rules (blocked domains, required shortcodes), Risk Controls (auto-publish thresholds), Content Rules (word counts, required elements). These ensure all content meets GetEducated standards.',
      },
      {
        heading: 'Automation Tab',
        content:
          'Control automation levels: Mode Selection (Manual/Assisted/Full Auto), Generation Schedule (daily limits, active hours), Auto-Publish Settings (enable/disable, delay, risk threshold), Queue Management (max size, priority rules).',
      },
      {
        heading: 'AI Models Tab',
        content:
          'Configure AI behavior: Primary Model (Grok version), Humanization Settings (StealthGPT mode and bypass level), Temperature (creativity vs consistency), Max Tokens (article length limits), Fallback Settings (what to do if primary fails).',
      },
      {
        heading: 'Quality Rules Tab',
        content:
          'Set minimum standards: Word Count (min/target/max), Internal Links (required number), External Citations (required number), FAQ Count (minimum items), Readability Score (threshold), Custom Rules (add your own checks).',
      },
      {
        heading: 'System Tab',
        content:
          'General preferences: Theme (light/dark/auto), Notifications (email alerts, in-app notifications), Data Retention (how long to keep drafts, analytics), Help Guides (enable/disable the how-to feature), Timezone.',
      },
      {
        heading: 'Saving Changes',
        content:
          'Changes auto-save as you make them (indicated by "Saved" badge). For critical settings, you\'ll be asked to confirm. Some settings require re-processing existing content to take effect.',
      },
    ],
    faqs: [
      {
        question: 'Will changing settings affect existing articles?',
        answer:
          'Most settings only affect new generations. Quality rules can be re-run on existing articles using the "Revalidate" button. Status changes don\'t affect already-published content.',
      },
      {
        question: 'What settings should I change first?',
        answer:
          'Start with GetEducated rules to ensure compliance, then Automation to match your workflow, then Quality Rules to set your standards. Leave AI Models at defaults until you\'re familiar with the system.',
      },
      {
        question: 'How do I reset to default settings?',
        answer:
          'Each tab has a "Reset to Defaults" button at the bottom. This restores factory settings for that section only. A global reset is available in System → Advanced.',
      },
    ],
  },

  '/dev-feedback': {
    title: 'Dev Feedback Queue',
    description: 'View and manage all user-submitted feedback for developers.',
    sections: [
      {
        heading: 'What is the Dev Feedback Queue?',
        content:
          'This page displays all feedback submitted by users through the Help & Feedback button. It\'s your central hub for tracking bugs, answering questions, addressing confusion, and considering suggestions. Use it to understand what users struggle with and prioritize improvements.',
      },
      {
        heading: 'Status Workflow',
        content:
          'Feedback items follow a workflow: PENDING (new, unreviewed) → REVIEWED (acknowledged, working on it) → RESOLVED (fixed or addressed) or WON\'T FIX (declined with reason). Use status filters to focus on what needs attention.',
      },
      {
        heading: 'Category Types',
        content:
          'Feedback is categorized by type: BUG (something is broken), QUESTION (user needs help), SUGGESTION (feature request or improvement), CONFUSION (UI/UX is unclear), OTHER (doesn\'t fit other categories). Filter by category to batch similar items.',
      },
      {
        heading: 'Feedback Cards',
        content:
          'Each card shows: Category badge (color-coded), Message preview, Page it was submitted from, Timestamp, Status badge. Click to expand and see full details including browser info and your developer notes.',
      },
      {
        heading: 'Managing Items',
        content:
          'For each feedback item you can: Change Status (mark reviewed, resolved, won\'t fix), Add Developer Notes (track your investigation), Delete (remove permanently). Use the search bar to find specific issues.',
      },
      {
        heading: 'Developer Notes',
        content:
          'Add internal notes to track your progress: What you\'ve investigated, Root cause analysis, Links to related code changes, Why something was marked won\'t fix. Notes are only visible here, not to the submitter.',
      },
      {
        heading: 'Copy All for Claude',
        content:
          'Click "Copy All for Claude" to generate a comprehensive markdown document with all feedback items, organized by category and priority. Paste this into Claude Code for AI-assisted analysis, bug triage, and fix suggestions.',
      },
      {
        heading: 'Statistics',
        content:
          'The stats bar shows counts by status and category, helping you understand: How much is pending, Most common issue types, Resolution rate, Patterns in user feedback.',
      },
    ],
    faqs: [
      {
        question: 'How do I know when new feedback is submitted?',
        answer:
          'The nav item shows a badge with pending feedback count. You can also enable email notifications in Settings → System → Notifications.',
      },
      {
        question: 'Should I respond to feedback submitters?',
        answer:
          'The current system doesn\'t notify users of status changes. If you want to respond, note the user\'s email and reach out directly for critical issues.',
      },
      {
        question: 'What\'s the best way to use "Copy for Claude"?',
        answer:
          'Copy the markdown and paste it into Claude Code with a prompt like "Analyze this user feedback and help me prioritize fixes" or "Help me fix the bugs reported here."',
      },
    ],
  },

  // Editor routes (dynamic)
  '/editor': {
    title: 'Article Editor',
    description: 'Full-featured editor for reviewing and refining article content.',
    sections: [
      {
        heading: 'What is the Article Editor?',
        content:
          'The Article Editor is your workspace for reviewing, editing, and refining AI-generated articles. It provides a rich text editor for content changes, metadata panels for SEO, and AI revision tools for automated improvements. Every article passes through here before publishing.',
      },
      {
        heading: 'Main Content Area',
        content:
          'The central editor supports full rich text editing: Headings (H2, H3), Paragraphs, Bold/Italic/Underline, Bullet and Numbered Lists, Links (internal and external), Images (upload or URL). Changes save automatically every 30 seconds.',
      },
      {
        heading: 'Formatting Toolbar',
        content:
          'The toolbar provides quick formatting: Text styles (heading levels, paragraph), Inline formatting (bold, italic, underline, strikethrough), Lists (bullet, numbered), Links (insert, edit, remove), Undo/Redo, View Source (HTML).',
      },
      {
        heading: 'Metadata Panel (Right Sidebar)',
        content:
          'The right panel contains SEO and attribution settings: Title (for browser tab and search), Meta Description (search result snippet), Focus Keyword (primary SEO target), Author (contributor attribution), Status (current pipeline stage).',
      },
      {
        heading: 'Quality Score Panel',
        content:
          'Real-time quality assessment shows: Overall Score (0-100), Individual metrics (word count, links, readability), Issues list with severity, Suggestions for improvement. Score updates as you edit.',
      },
      {
        heading: 'AI Revision Tools',
        content:
          'Use AI to improve content: "AI Revise" button sends the article for automated improvement, "Request Changes" lets you specify what to fix, "Regenerate Section" recreates a specific part. Revision history shows all AI changes.',
      },
      {
        heading: 'Selection-Based Actions',
        content:
          'Select text to see contextual options: "AI Improve" rewrites the selection, "Add Link" suggests relevant internal links, "Expand" makes the section longer, "Simplify" makes it more readable.',
      },
      {
        heading: 'Saving and Status',
        content:
          'Articles auto-save every 30 seconds (see "Saved" indicator). Manually save anytime with Ctrl+S. Change status using the dropdown: Drafting → In Review → Ready to Publish. Status changes are logged.',
      },
      {
        heading: 'Preview Mode',
        content:
          'Click "Preview" to see the article as it will appear when published. Preview shows rendered HTML with proper formatting, images, and links. Use this for final review before approval.',
      },
    ],
    faqs: [
      {
        question: 'How do I add internal links?',
        answer:
          'Select the text you want to link, click the link icon, and choose "Internal Link." The system suggests relevant articles from your site catalog. Or paste any GetEducated URL directly.',
      },
      {
        question: 'What if I make a mistake while editing?',
        answer:
          'Use Undo (Ctrl+Z) for recent changes. For bigger mistakes, check Revision History to restore a previous version. Auto-save means you won\'t lose work.',
      },
      {
        question: 'How do I request specific AI changes?',
        answer:
          'Click "Request Changes" and describe what you want: "Make the introduction more engaging" or "Add more statistics to section 2." Be specific for best results.',
      },
    ],
  },

  // Catalog article detail
  '/catalog/:id': {
    title: 'Catalog Article Detail',
    description: 'View and manage a specific article from the site catalog.',
    sections: [
      {
        heading: 'What is This Page?',
        content:
          'This page shows detailed information about a single article in your site catalog. Use it to review article metadata, see linking statistics, and manage how this article appears in internal linking suggestions.',
      },
      {
        heading: 'Article Information',
        content:
          'View key details: Full URL (click to visit the live page), Page Title, Topics/Categories (used for link matching), Word Count, Last Updated date, Date added to catalog.',
      },
      {
        heading: 'Link Statistics',
        content:
          'See how this article is used in internal linking: Times Linked To (how many generated articles link here), Recent Links (which articles link to this one), Link Context (the anchor text used).',
      },
      {
        heading: 'Topic Management',
        content:
          'Edit the topics/tags associated with this article. Better topics = better link matching. Add specific topics like "nursing degree" or "online MBA" rather than generic ones.',
      },
      {
        heading: 'Refresh Content',
        content:
          'Click "Refresh" to re-scrape this article from the live site. Use this when the article has been updated and you want the catalog to reflect current content.',
      },
      {
        heading: 'Priority Setting',
        content:
          'Mark articles as "Priority" to increase their likelihood of being linked. Use for cornerstone content, high-converting pages, or articles you want to promote.',
      },
    ],
    faqs: [
      {
        question: 'Why isn\'t this article being linked to?',
        answer:
          'The AI selects links based on topic relevance. Try adding more specific topics that match your generated content types. Also check that the article isn\'t marked as excluded.',
      },
      {
        question: 'The article content changed—how do I update it?',
        answer:
          'Click "Refresh" to re-scrape the article. This updates the title, content preview, and topics based on the current live page.',
      },
    ],
  },

  '/releases': {
    title: 'Release History',
    description: 'View the complete changelog of Perdia updates and improvements.',
    sections: [
      {
        heading: 'What is the Release History?',
        content:
          'This page shows the complete version history of Perdia, including all updates, bug fixes, new features, and improvements. Use it to see what\'s changed, understand new capabilities, and track when issues were resolved.',
      },
      {
        heading: 'Version Entries',
        content:
          'Each release entry shows: Version number (semantic versioning), Release date, Category badges (Feature, Fix, Improvement), Detailed description of changes.',
      },
      {
        heading: 'Change Categories',
        content:
          'Changes are categorized as: FEATURE (new capability), FIX (bug resolution), IMPROVEMENT (enhancement to existing feature), BREAKING (changes that may affect your workflow).',
      },
      {
        heading: 'Finding Specific Changes',
        content:
          'Use search to find when a specific feature was added or bug was fixed. Filter by category to see only features, only fixes, etc.',
      },
    ],
    faqs: [
      {
        question: 'How often is Perdia updated?',
        answer:
          'Updates are released as needed—typically multiple times per week during active development. Critical bug fixes are deployed immediately.',
      },
      {
        question: 'How do I know if an update affects me?',
        answer:
          'Check the release notes for your version. Items marked "BREAKING" may require action. The system status banner highlights important recent changes.',
      },
    ],
  },
}

/**
 * Get help content for a given route path.
 * Handles dynamic routes by matching patterns.
 */
export function getHelpContentForPath(pathname) {
  // Direct match
  if (pageHelpContent[pathname]) {
    return pageHelpContent[pathname]
  }

  // Handle dynamic routes
  if (pathname.startsWith('/editor/')) {
    return pageHelpContent['/editor']
  }

  if (pathname.startsWith('/catalog/') && pathname !== '/catalog') {
    return pageHelpContent['/catalog/:id']
  }

  if (pathname.startsWith('/review/') && pathname !== '/review') {
    return {
      title: 'Article Review',
      description: 'Review and approve a specific article before publishing.',
      sections: [
        {
          heading: 'What is This Page?',
          content:
            'This is the detailed review view for a single article. Here you can thoroughly review content, check quality metrics, make edits, and decide whether to approve or request revisions.',
        },
        {
          heading: 'Content Review',
          content:
            'Read through the entire article checking for: Accuracy of information, Appropriate tone and style, Proper formatting and structure, Working links, Correct author attribution.',
        },
        {
          heading: 'Quality Checklist',
          content:
            'The sidebar shows automated quality checks. Green checkmarks indicate passing metrics. Red X marks need attention before approval. Address all red items or document why they\'re acceptable.',
        },
        {
          heading: 'Making Edits',
          content:
            'Click "Edit" to open the full Article Editor for changes. For minor tweaks, you can edit directly in the review preview. All changes are saved to the article.',
        },
        {
          heading: 'Approval Actions',
          content:
            '"Approve" moves the article to Ready to Publish. "Request Revision" returns it to the AI for improvement (include your feedback). "Reject" removes it from the pipeline with a reason.',
        },
      ],
      faqs: [
        {
          question: 'What if I\'m unsure about approving?',
          answer:
            'When in doubt, request revision with specific feedback. It\'s better to improve content than publish something questionable.',
        },
        {
          question: 'Can I partially approve an article?',
          answer:
            'No, it\'s all or nothing. If parts need work, either edit them yourself or request revision for the specific sections.',
        },
      ],
    }
  }

  if (pathname.startsWith('/contributors/')) {
    return {
      title: 'Contributor Detail',
      description: 'View and manage a specific contributor\'s profile and performance.',
      sections: [
        {
          heading: 'What is This Page?',
          content:
            'This page shows everything about a specific contributor: their writing style profile, expertise areas, assigned articles, and performance metrics. Use it to understand and fine-tune how the AI writes in their voice.',
        },
        {
          heading: 'Profile Overview',
          content:
            'See the contributor\'s public name, avatar, bio, and expertise areas. This information appears on published articles and helps readers understand the author\'s background.',
        },
        {
          heading: 'Writing Style',
          content:
            'The style profile shows: Tone (formal to conversational), Typical vocabulary, Sentence structure patterns, Common phrases and transitions, Topics they specialize in. The AI uses all of this when generating content.',
        },
        {
          heading: 'Assigned Articles',
          content:
            'View all articles assigned to this contributor: Published articles, Articles in review, Drafts in progress. Click any article to open it in the editor.',
        },
        {
          heading: 'Performance Metrics',
          content:
            'See how this contributor\'s articles perform: Average quality score, Revision rate (how often articles need editing), Topic distribution, Publication volume over time.',
        },
        {
          heading: 'Style Training',
          content:
            'Upload sample articles to improve style matching. Provide 5-10 articles that exemplify this author\'s voice. The more examples, the better the AI can mimic their style.',
        },
      ],
      faqs: [
        {
          question: 'Can I change a contributor\'s name?',
          answer:
            'For GetEducated, contributor names are fixed (Tony, Kayleigh, Sara, Charity). Changes would need to match WordPress Article Contributor records.',
        },
        {
          question: 'How do I improve this contributor\'s AI writing?',
          answer:
            'Upload more sample articles, consistently edit generated content in their style (the AI learns from corrections), and adjust style parameters as needed.',
        },
      ],
    }
  }

  // Fallback for unknown routes
  return {
    title: 'Page Help',
    description: 'General help for this page.',
    sections: [
      {
        heading: 'Getting Started',
        content:
          'This page is part of the Perdia content production system. Use the sidebar navigation to access different features. Click the Help & Feedback button on any page for page-specific guidance.',
      },
      {
        heading: 'Need More Help?',
        content:
          'Use the "Send Feedback" tab to ask questions or report issues. Your message will go directly to the development team for response.',
      },
    ],
  }
}

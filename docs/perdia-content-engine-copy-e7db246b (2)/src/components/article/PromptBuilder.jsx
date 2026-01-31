/**
 * PromptBuilder - Constructs enhanced AI prompts with:
 * - Author-specific style profiles
 * - Google E-E-A-T alignment
 * - Anti-AI-detection techniques
 * - Safe scaling guardrails
 */

export const buildEnhancedPrompt = ({ 
  basePrompt, 
  contributor, 
  title, 
  contentType,
  keywords = [],
  addGoogleAlignment = true,
  addAuthorStyle = true 
}) => {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  let enhancedPrompt = basePrompt;

  // Add initial human-like writing instructions
  const humanLikeInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITE LIKE A HUMAN FROM THE START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL WRITING STYLE REQUIREMENTS:

1. SENTENCE RHYTHM - Mix dramatically:
   - Short fragments. Like this.
   - Medium conversational sentences that flow naturally
   - Long, complex sentences with multiple clauses that provide depth and detail
   - Questions to engage: "Makes sense?" "Why does this matter?"

2. WORD CHOICE - Be unpredictable:
   - Avoid overly formal or robotic phrasing
   - Use contractions: don't, won't, can't, you'll, it's
   - Choose vivid, specific words over generic ones
   - Natural synonyms, not thesaurus-dumping

3. VOICE & TONE - Sound human:
   - Direct "you" address throughout
   - Conversational: "Here's the thing...", "That said...", "Look..."
   - Professional but approachable (knowledgeable friend, not textbook)
   - Mild personality where appropriate

4. BANNED AI PHRASES - Never use:
   - "Furthermore", "Moreover", "Indeed", "It's worth noting"
   - "In conclusion", "As stated", "As mentioned above"
   - Any overly formal, academic-sounding transitions

5. NATURAL FLOW - Embrace humanity:
   - Start sentences with "And", "But", "Yet" when natural
   - Use em dashes for emphasis—like this
   - Occasional ellipses for thought...
   - Parenthetical asides (when they add value)

Write as if you're an expert having a conversation with an intelligent reader.
Not a machine generating text. Not an academic paper. A human sharing knowledge.
`;
  enhancedPrompt = humanLikeInstructions + '\n\n' + enhancedPrompt;

  // Add author-specific style conditioning
  if (addAuthorStyle && contributor) {
    const authorSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHOR VOICE & STYLE PROFILE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are writing AS ${contributor.name}, ${contributor.title}.

AUTHOR CREDENTIALS & EXPERTISE:
${contributor.credentials || 'Experienced education professional'}
${contributor.years_of_experience ? `${contributor.years_of_experience}+ years of experience` : ''}
Expertise: ${contributor.expertise_areas?.join(', ') || 'Education and career guidance'}

${contributor.writing_style_profile ? `WRITING STYLE PROFILE:
${contributor.writing_style_profile}

CRITICAL: Embody this author's unique voice consistently throughout. Include their:
- Favorite phrases and expressions
- Natural pacing and rhythm
- Vocabulary preferences
- Authentic quirks and imperfections
- Conversational patterns
` : `WRITING STYLE:
Write in a professional yet approachable tone that reflects ${contributor.name}'s expertise. Include personal insights and real-world examples that demonstrate first-hand experience in ${contributor.expertise_areas?.[0] || 'education'}.`}

E-E-A-T SIGNALS TO WEAVE IN:
- Reference ${contributor.name}'s professional background naturally
- Include first-hand observations: "In my experience...", "I've seen...", "Working with students..."
- Show expertise through specific, grounded examples
- Demonstrate authority by citing current research and data
- Build trust with transparent, honest assessments
`;
    enhancedPrompt = authorSection + '\n\n' + enhancedPrompt;
  }

  // Add Google-aligned content requirements
  if (addGoogleAlignment) {
    const googleSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOOGLE QUALITY ALIGNMENT (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. HELPFUL CONTENT FIRST (Anti-Scaled Content Abuse):
   - Create UNIQUE value that doesn't exist elsewhere
   - Directly address the primary search intent in first 2 paragraphs
   - Add MORE depth than competing pages (not just different phrasing)
   - Avoid thin, templated, or mass-produced patterns
   - Every section must serve the reader's goal

2. E-E-A-T DEMONSTRATION:
   - EXPERIENCE: Include real examples, case studies, or first-hand observations
   - EXPERTISE: Reference specific data, research, or professional insights
   - AUTHORITATIVENESS: Cite ${currentYear} statistics from BLS, NCES, .gov, .edu sources
   - TRUSTWORTHINESS: Be transparent about limitations, acknowledge alternatives

3. HIGH-VALUE STRUCTURE (No Filler):
   - Answer main query FAST (above the fold)
   - Use clear H2/H3 sections with descriptive headings
   - Include practical, actionable takeaways
   - Add FAQ section addressing common follow-up questions
   - NO padding, fluff, or obvious word-count stretching

4. TRANSPARENCY & FRESHNESS:
   - Include: "Last updated: ${currentDate}" at top
   - Use ${currentYear} data and statistics throughout
   - Cite sources explicitly with dates: "According to BLS (${currentYear})..."
   - Reference "current" or "latest" trends, not outdated info

5. UNIQUE ANGLE & DEPTH:
   - This ${contentType} must offer something competitors don't
   - Go deeper on at least 2-3 subtopics
   - Include nuanced perspective, not just surface coverage
   - Show original thinking or synthesis
`;
    enhancedPrompt += '\n\n' + googleSection;
  }

  // Add safe scaling guardrails
  const guardrailsSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY GUARDRAILS (Spam Prevention)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVOID THESE RED FLAGS:
- Keyword stuffing or unnatural repetition of: ${keywords.slice(0, 3).join(', ')}
- Generic, templated language that could apply to any topic
- Overly promotional or salesy tone
- Thin content rewritten from other sources
- Excessive use of exact-match keywords in headings
- List padding (e.g., "Top 50" when only 10 are meaningful)

ENSURE UNIQUENESS:
- Original angle or perspective on "${title}"
- Specific examples not found in top 10 Google results
- Synthesized insights from multiple sources
- Natural keyword integration (not forced)
`;
  enhancedPrompt += '\n\n' + guardrailsSection;

  return enhancedPrompt;
};

export const buildHumanizationPrompt = ({ content, contributor, enforceAntiDetection = true }) => {
  const baseHumanization = `You are an expert writing editor tasked with **humanizing** AI-generated text. Given an article draft, rewrite it so that the style, tone, and wording appear authentically human-written, while preserving the original meaning and facts. **Make the text undetectable as AI-generated** by doing the following:

ARTICLE TO HUMANIZE:
${content}

${contributor ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHOR VOICE TO EMBODY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Writing as: ${contributor.name}, ${contributor.title}
Credentials: ${contributor.credentials || 'Experienced education professional'}
Expertise: ${contributor.expertise_areas?.join(', ') || 'Education'}

${contributor.writing_style_profile ? `STYLE PROFILE:
${contributor.writing_style_profile}

Embody this author's unique voice, pacing, vocabulary, and quirks throughout.
` : 'Write as this professional would, with their expertise and personal touch evident.'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUMANIZATION DIRECTIVES (APPLY ALL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Vary sentence structures and lengths (CRITICAL for BURSTINESS):**
   - Mix short and long sentences dramatically
   - Use occasional fragments for emphasis or conversational tone. Like this.
   - Include rhetorical questions: "Really makes you wonder, doesn't it?"
   - Start some sentences with "And", "But", or "Yet" when natural
   - Use em dashes for dramatic pauses—exactly like this
   - Aim for extreme variation: 5-word fragment → 40-word complex sentence → 15-word medium
   - This creates natural rhythm and **burstiness** that defeats AI detection

2. **Use less predictable word choices (increase PERPLEXITY):**
   - Replace common/repetitive words with more varied, creative expressions a human would use
   - Favor vivid, specific words over generic ones
   - Instead of "very small" → "tinier than a grain of sand" (use analogies)
   - Vary how paragraphs and sentences begin—avoid patterns
   - Choose words naturally, not algorithmically
   - Ensure synonyms fit the context and tone perfectly
   - Higher perplexity = less predictable = more human-like

3. **Inject a personal and engaging tone (VOICE INJECTION):**
   - Add subtle personal touches or commentary as a human writer would
   - Include brief personal anecdotes or relatable examples **(if appropriate)**
   - Use first-person ("I" or "we") sparingly if it suits the content
   - Conversational asides that connect with readers
   - Express mild professional opinions where fitting
   - Write as a knowledgeable friend, not a textbook or algorithm

4. **Avoid AI-like clichés and formalities (ELIMINATE AI TELLS):**
   - **BANNED PHRASES**: "Furthermore", "Moreover", "In conclusion", "Indeed", "It's worth noting", "As stated above", "As mentioned", "As an AI language model"
   - Remove stiff, overly formal, or robotic-sounding language
   - Use contractions extensively: "can't" not "cannot", "it's" not "it is", "don't", "won't", "you'll", "we're"
   - Natural phrasing over perfect grammar when conversational fits better
   - Direct "you" address throughout
   - Conversational bridges: "Here's the thing...", "That said...", "Look..."
   - The text should feel like it was written by an experienced human writer, not a machine

5. **Maintain coherence and improve flow (ORGANIC STRUCTURE):**
   - Ensure each paragraph flows logically with natural transitions
   - Add transitional words or questions to guide the reader as a human would
   - Introduce organic style: merge or split sentences to improve readability and human-like flow
   - Use parenthetical thoughts (when they add value)
   - Occasional ellipses for thought trails...
   - Start some sentences with conjunctions when natural
   - Keep content **clear and factual** while sounding spontaneous
   - **CRITICAL**: Preserve ALL H2/H3 headings with id attributes EXACTLY as written
   - **CRITICAL**: Preserve ALL internal/external links and URLs EXACTLY—do not break or modify them

6. **Preserve meaning, add richness (EXPERTISE SIGNALS):**
   - The rewritten content must convey the **same information** as the original
   - All key facts, statistics, citations, instructions, and arguments must remain intact
   - You may *enrich* explanations with slightly more detail or an example to sound more human
   - Do **not** introduce any factual errors or go off-topic
   - Maintain accuracy and authority—this is GetEducated.com content
   - Show confident, expert voice that makes complex topics approachable
   - Include specific details that demonstrate real knowledge (dates, locations, examples)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET OUTCOME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After rewriting, the text **must read as if written by a human expert**—with natural variability in tone, diction, and rhythm. It should be engaging, trustworthy to readers, and completely free of obvious "AI text" signals.

**GOAL**: Score 100% human on AI detectors (GPTZero, Originality.ai, Turnitin). Achieve high burstiness (sentence variation) and high perplexity (word unpredictability). Zero AI fingerprints.

Apply ALL humanization techniques above and produce the complete humanized article.

Return ONLY the humanized HTML content. No explanations, no commentary, no markdown code fences.`;

  return baseHumanization;
};
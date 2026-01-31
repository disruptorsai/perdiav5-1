import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Link as LinkIcon, 
  Code, 
  Layout,
  DollarSign,
  TrendingUp
} from "lucide-react";

export default function SiteAnalysis() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            GetEducated.com Site Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of structure, monetization, and content patterns
          </p>
        </div>

        <Tabs defaultValue="structure">
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="structure">Content Structure</TabsTrigger>
            <TabsTrigger value="monetization">Monetization</TabsTrigger>
            <TabsTrigger value="linking">Internal Linking</TabsTrigger>
            <TabsTrigger value="templates">Content Templates</TabsTrigger>
          </TabsList>

          {/* Content Structure */}
          <TabsContent value="structure" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  Content Type Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">1. Rankings / "Best Buy" Lists (Primary)</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pattern: "The [X] Most Affordable [Degree Name]"</p>
                    <div className="ml-4 space-y-1">
                      <p>• Examples: "27 Most Affordable Online Bachelor's Degree in Business"</p>
                      <p>• Examples: "48 Cheapest MLIS Degree Online Programs"</p>
                      <p>• Format: Cost-focused rankings below national average</p>
                    </div>
                    <p className="font-semibold mt-3">Structure:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Hero image (degree-related stock photo)</p>
                      <p>• Opening context paragraph (1-2 paragraphs)</p>
                      <p>• Article navigation (jump links)</p>
                      <p>• Key stats box: Average Cost, Least Expensive, Most Expensive</p>
                      <p>• Methodology statement (transparency)</p>
                      <p>• Sponsored listings (3-5 featured programs with icons)</p>
                      <p>• Filterable rankings table (by state, military-friendly)</p>
                      <p>• Career guide section with BLS data</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-900 mb-3">2. Career Guides</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pattern: "How to Become a [Profession]"</p>
                    <div className="ml-4 space-y-1">
                      <p>• Example: "How to Become a History Teacher: A Step-by-Step Guide"</p>
                      <p>• Focus: Educational pathways, requirements, salary data</p>
                    </div>
                    <p className="font-semibold mt-3">Structure:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Hero image</p>
                      <p>• Comprehensive article navigation (10+ sections)</p>
                      <p>• "What is a [Job]?" definition</p>
                      <p>• Step-by-step guide (numbered list)</p>
                      <p>• Skills required section</p>
                      <p>• Education requirements</p>
                      <p>• BLS salary data + career outlook</p>
                      <p>• Related resource links (internal)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-3">3. Listicles</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pattern: "[X] Highest Paying [Degree Level] Jobs"</p>
                    <div className="ml-4 space-y-1">
                      <p>• Example: "24 Highest Paying Associate Degree Jobs"</p>
                      <p>• Focus: Career outcomes, ROI, salary data</p>
                    </div>
                    <p className="font-semibold mt-3">Structure:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Article navigation (comprehensive)</p>
                      <p>• Educational context (What is an Associate's Degree?)</p>
                      <p>• "Sponsored Picks" section (3 programs)</p>
                      <p>• Numbered list of careers with BLS data</p>
                      <p>• Each entry: Job title, salary, growth rate, description</p>
                      <p>• Related degree program links</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-bold text-amber-900 mb-3">4. Educational Guidance</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pattern: Consumer protection + advice</p>
                    <div className="ml-4 space-y-1">
                      <p>• Example: "Best Accredited Colleges For A Life Experience Degree"</p>
                      <p>• Focus: Scam warnings, legitimate options, how-to guidance</p>
                    </div>
                    <p className="font-semibold mt-3">Structure:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Q&A format introduction</p>
                      <p>• "Quick Facts" section</p>
                      <p>• Warning sections (scams, diploma mills)</p>
                      <p>• Legitimate options with specific universities</p>
                      <p>• Link to diploma mill database</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monetization */}
          <TabsContent value="monetization" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Monetization Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h3 className="font-bold text-emerald-900 mb-3">Partner Program Links</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Implementation:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Custom shortcode system: <code className="bg-white px-1 py-0.5 rounded">wpge-cta</code> class</p>
                      <p>• All school/degree links wrapped in tracking</p>
                      <p>• Data attributes for analytics:</p>
                      <div className="ml-4 mt-1 bg-white p-2 rounded font-mono text-xs">
                        data-schoolid="2240"<br/>
                        data-degreeid="325877"<br/>
                        data-schoolname="Alvernia University"<br/>
                        data-clicksource="GEPartnerPrograms"<br/>
                        rel="nofollow"
                      </div>
                    </div>
                    <p className="font-semibold mt-3">Visual Indicators:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Icon badges (icon-partner-program-1.png, icon-partner-program-2.png)</p>
                      <p>• "Click here to learn more" CTA buttons</p>
                      <p>• School logos displayed prominently</p>
                      <p>• "SPONSORED LISTINGS" label above featured schools</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3">Link Structure</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Pattern:</p>
                    <div className="ml-4 space-y-1 font-mono text-xs bg-white p-2 rounded">
                      https://www.geteducated.com/online-schools/[school-slug]/?d=[degree-id]
                    </div>
                    <p className="font-semibold mt-3">Examples:</p>
                    <div className="ml-4 space-y-1 text-xs">
                      <p>• /online-schools/alvernia-university/?d=bs-in-management</p>
                      <p>• /online-schools/campbellsville-university/?d=bs-in-general-business</p>
                    </div>
                    <p className="font-semibold mt-3">All monetization links:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Have rel="nofollow"</p>
                      <p>• Include comprehensive tracking data</p>
                      <p>• Never appear as plain URLs</p>
                      <p>• Wrapped in custom CTA elements</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-3">Content Monetization Strategy</h3>
                  <div className="space-y-2 text-sm">
                    <p>• <strong>Rankings:</strong> 3-5 sponsored schools above table, then full rankings</p>
                    <p>• <strong>Articles:</strong> "GetEducated Sponsored Picks" sections with 3 programs</p>
                    <p>• <strong>Inline:</strong> Contextual degree links within content</p>
                    <p>• <strong>Sidebar:</strong> Related programs (not visible in fetched content)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Linking */}
          <TabsContent value="linking" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Internal Linking Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h3 className="font-bold text-indigo-900 mb-3">Link Types & Patterns</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold">1. Degree Category Pages</p>
                      <div className="ml-4">
                        <p>• /online-degrees/associate/</p>
                        <p>• /online-degrees/associate/business/accounting/</p>
                        <p>• Used in: "View All Associate Degrees" CTAs</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">2. Related Rankings</p>
                      <div className="ml-4">
                        <p>• Link to related degree level rankings</p>
                        <p>• Example: MBA rankings → Executive MBA rankings</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">3. Career Center Links</p>
                      <div className="ml-4">
                        <p>• /career-center/how-to-become-a-teacher/</p>
                        <p>• /career-center/detail/substance-abuse-and-drug-addiction-counselor/</p>
                        <p>• Used as "Related Resource" boxes</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">4. Educational Guides</p>
                      <div className="ml-4">
                        <p>• /life-experience-college-degree/</p>
                        <p>• /college-degree-mills/ (scam warnings)</p>
                        <p>• Consumer protection content</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                  <h3 className="font-bold text-pink-900 mb-3">Article Navigation Pattern</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Every article includes jump-link navigation:</p>
                    <div className="ml-4 space-y-1 text-xs bg-white p-2 rounded font-mono">
                      &lt;span style="color: #ffae41;"&gt;&lt;strong&gt;ARTICLE NAVIGATION:&lt;/strong&gt;&lt;/span&gt;<br/>
                      &lt;a href="#section-1"&gt;Section 1&lt;/a&gt; |<br/>
                      &lt;a href="#section-2"&gt;Section 2&lt;/a&gt; |<br/>
                      &lt;a href="#section-3"&gt;Section 3&lt;/a&gt;
                    </div>
                    <p className="mt-3">• Orange color (#ffae41) for visibility</p>
                    <p>• Pipe-separated format</p>
                    <p>• Links to H2 id anchors</p>
                    <p>• Appears early in article (after intro)</p>
                  </div>
                </div>

                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h3 className="font-bold text-teal-900 mb-3">Internal Link Density</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Rankings Pages:</strong> 5-8 internal links</p>
                    <p><strong>Career Guides:</strong> 8-12 internal links</p>
                    <p><strong>Listicles:</strong> 10-15 internal links (related programs)</p>
                    <p className="mt-3 font-semibold">Strategic Placement:</p>
                    <div className="ml-4 space-y-1">
                      <p>• Inline contextual links (degree types)</p>
                      <p>• "Related Resource" callout boxes</p>
                      <p>• "GetEducated Sponsored Picks" sections</p>
                      <p>• End-of-section CTAs</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Templates */}
          <TabsContent value="templates" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Content Templates & Schema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3">Rankings Page Template</h3>
                  <div className="space-y-2 text-sm font-mono bg-white p-3 rounded">
                    <p className="font-sans font-semibold text-gray-700 mb-2">Required Elements:</p>
                    <div className="space-y-1">
                      <p>1. H1: "The [X] Most Affordable [Degree Type]"</p>
                      <p>2. Hero Image (227x300 right-aligned)</p>
                      <p>3. Context Paragraphs (2-3)</p>
                      <p>4. Article Navigation (orange)</p>
                      <p>5. Stats Box:</p>
                      <div className="ml-4">
                        <p>   - Average Cost</p>
                        <p>   - Least Expensive School + Price</p>
                        <p>   - Most Expensive School + Price</p>
                      </div>
                      <p>6. Methodology Statement</p>
                      <p>7. H2 id="Cost-Rankings"</p>
                      <p>8. Sponsored Programs (3-5 with icons)</p>
                      <p>9. Filter Options (State dropdown, Military checkbox)</p>
                      <p>10. Rankings Table</p>
                      <p>11. H2 id="Career-Guide"</p>
                      <p>12. BLS Career Data Section</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-3">Career Guide Template</h3>
                  <div className="space-y-2 text-sm font-mono bg-white p-3 rounded">
                    <p className="font-sans font-semibold text-gray-700 mb-2">Required Elements:</p>
                    <div className="space-y-1">
                      <p>1. H1: "How to Become a [Profession]"</p>
                      <p>2. Hero Image (1140x400)</p>
                      <p>3. Opening Context (2 paragraphs)</p>
                      <p>4. Comprehensive Navigation (10+ sections)</p>
                      <p>5. H2: "What is a [Job]?"</p>
                      <p>6. H2: "How Long Does It Take?"</p>
                      <p>7. H2: "Step-by-Step Guide"</p>
                      <p>   - Numbered list (6-8 steps)</p>
                      <p>8. H2: "Skills Required"</p>
                      <p>9. H2: "Education Needed"</p>
                      <p>10. H2: "Career Outlook" (BLS data)</p>
                      <p>11. H2: "Salary" (BLS data with date)</p>
                      <p>12. Related Resource boxes</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                  <h3 className="font-bold text-rose-900 mb-3">Schema Markup (NOT FOUND)</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-red-600">⚠️ Critical Finding:</p>
                    <p>GetEducated.com does NOT currently implement structured data markup</p>
                    <p className="mt-3 font-semibold">Missing schema types that SHOULD be added:</p>
                    <div className="ml-4 space-y-1">
                      <p>• FAQPage (for Q&A sections)</p>
                      <p>• Article (for all content types)</p>
                      <p>• BreadcrumbList</p>
                      <p>• HowTo (for step-by-step guides)</p>
                      <p>• Organization / Author</p>
                    </div>
                    <p className="mt-3 text-amber-700 font-semibold">
                      📈 OPPORTUNITY: Adding schema could significantly improve AI Overview citations
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <h3 className="font-bold text-cyan-900 mb-3">BLS Data Integration Pattern</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Standard Format:</p>
                    <div className="ml-4 bg-white p-2 rounded">
                      <p>"According to the Bureau of Labor Statistics (BLS), the median salary for [occupation] was [amount] per year as of [date]."</p>
                    </div>
                    <p className="font-semibold mt-3">Growth Rate Format:</p>
                    <div className="ml-4 bg-white p-2 rounded">
                      <p>"The BLS projects [X]% growth from [year] to [year], which is [faster/slower] than average."</p>
                    </div>
                    <p className="mt-3">• Always include source (BLS)</p>
                    <p>• Always include date</p>
                    <p>• Link to BLS Occupational Outlook Handbook when possible</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Recommendations */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Key Recommendations for Content Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>Implement schema markup</strong> - GetEducated doesn't use it, major opportunity</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>Enforce shortcode system</strong> - All monetization links MUST be wrapped and tracked</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>Article navigation required</strong> - Jump links improve UX and SEO</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>BLS citation format</strong> - Always include source, date, and link to OOH</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>Internal link density</strong> - Maintain 5-15 internal links per article</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p><strong>Sponsored sections</strong> - Always label clearly and use visual indicators</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
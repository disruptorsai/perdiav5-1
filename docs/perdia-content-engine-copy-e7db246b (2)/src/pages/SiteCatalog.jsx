import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Upload
} from "lucide-react";

export default function SiteCatalog() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newArticle, setNewArticle] = useState({
    url: '',
    title: '',
    category: 'guides',
    topics: '',
    excerpt: ''
  });

  const { data: siteArticles = [], isLoading } = useQuery({
    queryKey: ['site-articles'],
    queryFn: () => base44.entities.SiteArticle.list('-created_date', 2000),
  });

  const addArticleMutation = useMutation({
    mutationFn: (data) => base44.entities.SiteArticle.create({
      ...data,
      topics: data.topics.split(',').map(t => t.trim()).filter(t => t),
      is_active: true,
      last_verified: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-articles'] });
      queryClient.invalidateQueries({ queryKey: ['verified-site-articles'] });
      setShowAddDialog(false);
      setNewArticle({ url: '', title: '', category: 'guides', topics: '', excerpt: '' });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (id) => base44.entities.SiteArticle.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-articles'] });
      queryClient.invalidateQueries({ queryKey: ['verified-site-articles'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SiteArticle.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-articles'] });
      queryClient.invalidateQueries({ queryKey: ['verified-site-articles'] });
    },
  });

  const [updatingArticleId, setUpdatingArticleId] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await base44.functions.invoke('importSiteArticles', {
        html_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6921d6d51a52f632e7db246b/887888969_geteducated-complete-library-2025-11-21.html'
      });
      
      queryClient.invalidateQueries({ queryKey: ['site-articles'] });
      alert(`Successfully imported ${result.data.imported} articles!`);
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const aiUpdateArticleMutation = useMutation({
    mutationFn: async (article) => {
      setUpdatingArticleId(article.id);
      
      // Fetch the current article content
      const response = await fetch(article.url);
      const html = await response.text();
      
      // Use AI to rewrite the article with new standards
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are rewriting an existing GetEducated.com article to meet new editorial standards.

ORIGINAL ARTICLE URL: ${article.url}
ORIGINAL TITLE: ${article.title}
CATEGORY: ${article.category}
TOPICS: ${article.topics?.join(', ')}

ORIGINAL CONTENT:
${html.substring(0, 15000)}

Your task is to rewrite this article following GetEducated's editorial standards:

1. STRUCTURE:
   - Clear H2 and H3 headings for navigation
   - Short, scannable paragraphs
   - Bullet points and lists where appropriate

2. CONTENT REQUIREMENTS:
   - Minimum 800 words
   - Include updated salary data from BLS where relevant
   - Add internal links to related GetEducated content
   - Include external citations to authoritative sources
   - FAQ section with schema markup

3. SEO OPTIMIZATION:
   - Target keywords naturally integrated
   - Meta description optimized
   - Alt text for images

4. TONE & STYLE:
   - Professional yet conversational
   - Empowering and solution-focused
   - Data-driven with specific numbers

Generate the complete rewritten article in HTML format, ready to publish.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            html_content: { type: "string", description: "Complete HTML article content" },
            title: { type: "string", description: "Optimized article title" },
            meta_description: { type: "string", description: "SEO meta description" },
            target_keywords: { type: "array", items: { type: "string" }, description: "Primary target keywords" },
            word_count: { type: "number", description: "Total word count" },
            internal_links: { type: "array", items: { type: "string" }, description: "URLs of internal links added" },
            external_citations: { type: "array", items: { type: "string" }, description: "URLs of external sources cited" },
            faqs: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" }
                }
              },
              description: "FAQ items for schema"
            }
          }
        }
      });

      // Create a new Article record with the updated content
      const newArticle = await base44.entities.Article.create({
        title: result.title,
        slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: article.category === 'rankings' ? 'ranking' : 'guide',
        status: 'in_review',
        content: result.html_content,
        excerpt: result.meta_description,
        wp_post_id: article.url,
        target_keywords: result.target_keywords,
        word_count: result.word_count,
        internal_links_count: result.internal_links?.length || 0,
        external_citations_count: result.external_citations?.length || 0,
        faqs: result.faqs,
        model_used: 'gpt-4',
        generation_prompt: 'AI Update from Site Catalog'
      });

      return newArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setUpdatingArticleId(null);
      alert('Article successfully updated and sent to review queue!');
    },
    onError: (error) => {
      setUpdatingArticleId(null);
      alert('Failed to update article: ' + error.message);
    }
  });

  const handleAdd = () => {
    if (!newArticle.url || !newArticle.title) {
      alert('Please enter both URL and title');
      return;
    }
    addArticleMutation.mutate(newArticle);
  };

  const activeCount = siteArticles.filter(a => a.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Site Article Catalog
            </h1>
            <p className="text-gray-600 mt-1">
              Verified GetEducated.com articles for safe internal linking
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleImport}
              disabled={importing}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import 1,035 Articles
                </>
              )}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Article
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Site Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Article URL</Label>
                  <Input
                    value={newArticle.url}
                    onChange={(e) => setNewArticle({ ...newArticle, url: e.target.value })}
                    placeholder="https://www.geteducated.com/..."
                  />
                </div>
                <div>
                  <Label>Article Title</Label>
                  <Input
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Best Online MBA Programs 2025"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="degree_guides">Degree Guides</option>
                    <option value="career_guides">Career Guides</option>
                    <option value="rankings">Rankings</option>
                    <option value="school_reviews">School Reviews</option>
                    <option value="guides">General Guides</option>
                    <option value="resources">Resources</option>
                  </select>
                </div>
                <div>
                  <Label>Topics (comma-separated)</Label>
                  <Input
                    value={newArticle.topics}
                    onChange={(e) => setNewArticle({ ...newArticle, topics: e.target.value })}
                    placeholder="MBA, online degrees, business"
                  />
                </div>
                <div>
                  <Label>Excerpt (optional)</Label>
                  <Textarea
                    value={newArticle.excerpt}
                    onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <Button 
                  onClick={handleAdd}
                  disabled={addArticleMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {addArticleMutation.isPending ? 'Adding...' : 'Add Article'}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Articles</p>
                  <p className="text-3xl font-bold text-gray-900">{siteArticles.length}</p>
                </div>
                <ExternalLink className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Articles</p>
                  <p className="text-3xl font-bold text-green-600">{activeCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactive Articles</p>
                  <p className="text-3xl font-bold text-gray-400">{siteArticles.length - activeCount}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Why This Matters</h4>
                <p className="text-sm text-blue-800">
                  AI-generated articles will ONLY link to articles in this catalog. This prevents broken internal links 
                  and ensures all references are to real, verified GetEducated.com content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <Card>
          <CardHeader>
            <CardTitle>Catalog Articles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : siteArticles.length === 0 ? (
              <div className="text-center py-12">
                <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No articles in catalog yet</p>
                <p className="text-sm text-gray-400">
                  Add GetEducated.com articles to enable safe internal linking
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {siteArticles.map((article) => (
                  <div
                    key={article.id}
                    className={`p-4 rounded-lg border transition-all ${
                      article.is_active
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {article.title}
                          </h3>
                          <Badge variant="outline" className="capitalize shrink-0">
                            {article.category?.replace(/_/g, ' ')}
                          </Badge>
                          {article.is_active ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                        >
                          {article.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {article.topics && article.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.topics.map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {article.excerpt && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        {article.last_verified && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last verified: {new Date(article.last_verified).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Rewrite this article with AI using new editorial standards? This will create a new draft in the review queue.')) {
                              aiUpdateArticleMutation.mutate(article);
                            }
                          }}
                          disabled={updatingArticleId === article.id}
                          className="text-purple-600 hover:bg-purple-50"
                        >
                          {updatingArticleId === article.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: article.id,
                              is_active: !article.is_active,
                            })
                          }
                        >
                          {article.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this article from catalog?')) {
                              deleteArticleMutation.mutate(article.id);
                            }
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AutoFillButton({ onAutoFill }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // Fetch data in parallel
      const [keywords, clusters, ideas] = await Promise.all([
        base44.entities.Keyword.filter({ target_flag: true }, '-search_volume', 10),
        base44.entities.Cluster.filter({ status: 'active' }, '-priority', 10),
        base44.entities.ContentIdea.filter({ status: 'approved' }, '-trending_score', 10)
      ]);

      const suggestions = [];

      // Generate suggestions from target keywords
      keywords.forEach(keyword => {
        suggestions.push({
          type: 'keyword',
          title: generateTitleFromKeyword(keyword),
          keywords: [keyword.keyword, ...getRelatedKeywords(keyword.keyword)],
          targetAudience: inferAudienceFromKeyword(keyword),
          contentType: inferContentType(keyword),
          additionalContext: `Targeting keyword with ${keyword.search_volume || 'high'} search volume. ${keyword.intent} intent.`,
          source: `Keyword: ${keyword.keyword}`,
          priority: keyword.priority
        });
      });

      // Generate suggestions from clusters
      clusters.forEach(cluster => {
        suggestions.push({
          type: 'cluster',
          title: generateTitleFromCluster(cluster),
          keywords: cluster.subtopics || [],
          targetAudience: cluster.target_audience || 'Prospective online students',
          contentType: 'guide',
          additionalContext: cluster.description || '',
          source: `Cluster: ${cluster.name}`,
          priority: cluster.priority
        });
      });

      // Generate suggestions from approved content ideas
      ideas.forEach(idea => {
        suggestions.push({
          type: 'idea',
          title: idea.title,
          keywords: idea.keywords || [],
          targetAudience: inferAudienceFromIdea(idea),
          contentType: idea.content_type,
          additionalContext: idea.description + (idea.notes ? `\n\nContext: ${idea.notes}` : ''),
          source: `Trending: ${idea.source}`,
          priority: idea.priority
        });
      });

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setSuggestions(suggestions.slice(0, 12)); // Top 12 suggestions
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTitleFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    
    if (kw.includes('best') || kw.includes('top')) {
      return keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    if (kw.includes('how to')) {
      return keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    // Default: Create a ranking-style title
    const degreeType = kw.includes('master') || kw.includes('mba') || kw.includes('phd') ? 
      kw.split(' ')[0] : 'Degree';
    return `The 25 Most Affordable Online ${keyword.keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Programs`;
  };

  const generateTitleFromCluster = (cluster) => {
    const name = cluster.name;
    // Use GetEducated patterns
    const patterns = [
      `The Complete Guide to ${name}`,
      `How to Choose the Right ${name}`,
      `Everything You Need to Know About ${name}`,
      `${name}: Career Guide and Degree Options`
    ];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const getRelatedKeywords = (keyword) => {
    const base = keyword.toLowerCase();
    const related = [];
    
    if (base.includes('online')) related.push('distance learning', 'remote education');
    if (base.includes('mba')) related.push('business degree', 'management');
    if (base.includes('nursing')) related.push('healthcare', 'RN', 'BSN');
    if (base.includes('education')) related.push('teaching', 'educator');
    if (base.includes('degree')) related.push('program', 'university', 'college');
    
    return related.slice(0, 3);
  };

  const inferAudienceFromKeyword = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    
    if (kw.includes('affordable') || kw.includes('cheap')) {
      return 'Budget-conscious students seeking affordable education options';
    }
    if (kw.includes('working professional') || kw.includes('online')) {
      return 'Working professionals seeking flexible online programs';
    }
    if (kw.includes('accelerated') || kw.includes('fast track')) {
      return 'Career changers looking for accelerated degree programs';
    }
    if (kw.includes('master') || kw.includes('graduate')) {
      return 'Graduate students seeking advanced degrees';
    }
    
    return 'Prospective students researching online education options';
  };

  const inferAudienceFromIdea = (idea) => {
    const desc = (idea.description || '').toLowerCase();
    
    if (desc.includes('career change')) return 'Career changers seeking new opportunities';
    if (desc.includes('working')) return 'Working professionals';
    if (desc.includes('student')) return 'Current and prospective students';
    
    return 'Education seekers researching degree options';
  };

  const inferContentType = (keyword) => {
    const kw = keyword.keyword.toLowerCase();
    
    if (kw.includes('best') || kw.includes('top') || kw.includes('most affordable')) {
      return 'ranking';
    }
    if (kw.includes('how to become')) {
      return 'career_guide';
    }
    if (kw.includes('highest paying') || kw.includes('jobs')) {
      return 'listicle';
    }
    
    return 'guide';
  };

  const handleSelect = (suggestion) => {
    onAutoFill(suggestion);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      loadSuggestions();
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={handleOpen}
        >
          <Wand2 className="w-4 h-4" />
          Auto-Fill from Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Content to Generate</DialogTitle>
          <DialogDescription>
            Choose from target keywords, clusters, or trending ideas to auto-fill all fields
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Loading suggestions...</span>
          </div>
        ) : (
          <div className="grid gap-3 mt-4">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300"
                onClick={() => handleSelect(suggestion)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{suggestion.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={`${priorityColors[suggestion.priority]} border text-xs`}>
                        {suggestion.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {suggestion.contentType?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.source}
                      </Badge>
                    </div>
                    {suggestion.keywords.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {suggestion.keywords.slice(0, 5).map((kw, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Use This
                  </Button>
                </div>
              </Card>
            ))}

            {suggestions.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                <p>No data-driven suggestions available.</p>
                <p className="text-sm mt-2">Add target keywords or approve content ideas first.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
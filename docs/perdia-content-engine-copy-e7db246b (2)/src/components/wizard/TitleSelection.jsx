import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Check, Edit3 } from "lucide-react";

export default function TitleSelection({ selectedIdea, contentType, keywords, onSelect }) {
  const [titleOptions, setTitleOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    generateTitles();
  }, []);

  const generateTitles = async () => {
    setIsLoading(true);
    try {
      const prompt = `You are an SEO expert for GetEducated.com. Generate 5 highly optimized article titles.

Topic: ${selectedIdea.title}
Content Type: ${contentType.replace(/_/g, ' ')}
Keywords: ${keywords.slice(0, 5).join(', ')}

Requirements:
- SEO-optimized with target keywords
- Compelling and click-worthy
- Match the content type style
- Follow GetEducated's tone (professional, helpful, consumer-focused)
- Include numbers where appropriate (for listicles/rankings)
- Be specific and clear about value

Return 5 title options with brief SEO rationale for each.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  seo_rationale: { type: "string" },
                  primary_keyword: { type: "string" },
                  estimated_difficulty: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTitleOptions(result.titles || []);
    } catch (error) {
      console.error('Failed to generate titles:', error);
      setTitleOptions([
        {
          title: selectedIdea.title,
          seo_rationale: 'Original title from idea',
          primary_keyword: keywords[0] || '',
          estimated_difficulty: 'Medium'
        }
      ]);
    }
    setIsLoading(false);
  };

  const handleSelectTitle = (title) => {
    onSelect(title);
  };

  const handleCustomSubmit = () => {
    if (customTitle.trim()) {
      onSelect(customTitle.trim());
    }
  };

  const difficultyColors = {
    'Easy': 'bg-green-100 text-green-700 border-green-300',
    'Medium': 'bg-amber-100 text-amber-700 border-amber-300',
    'Hard': 'bg-red-100 text-red-700 border-red-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Context Summary */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-emerald-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Ready to Generate</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Type:</span> {contentType.replace(/_/g, ' ')}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Topic:</span> {selectedIdea.title}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose SEO-Optimized Title</h2>
        <p className="text-gray-600 mb-6">
          AI-generated titles optimized for search engines and click-through rates
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Generating SEO-Optimized Titles...</h3>
            <p className="text-gray-600">
              Analyzing keywords, search intent, and competition
            </p>
          </CardContent>
        </Card>
      )}

      {/* Title Options */}
      {!isLoading && !showCustom && (
        <div className="space-y-4">
          {titleOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                onClick={() => handleSelectTitle(option.title)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {option.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-blue-600 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {option.primary_keyword}
                        </Badge>
                        <Badge variant="outline" className={`${difficultyColors[option.estimated_difficulty] || 'bg-gray-100'} border`}>
                          {option.estimated_difficulty} Difficulty
                        </Badge>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          <span className="font-medium">SEO Rationale:</span> {option.seo_rationale}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-emerald-600">Select</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Button
            variant="outline"
            onClick={() => setShowCustom(true)}
            className="w-full gap-2"
            size="lg"
          >
            <Edit3 className="w-4 h-4" />
            Write My Own Title
          </Button>
        </div>
      )}

      {/* Custom Title Input */}
      {showCustom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Custom Title</label>
                <Input
                  placeholder="Enter your own SEO-optimized title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                  className="text-lg"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: Include your primary keyword and make it compelling for clicks
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCustom(false)}
                  className="flex-1"
                >
                  Back to Suggestions
                </Button>
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customTitle.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  Continue with Custom Title
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
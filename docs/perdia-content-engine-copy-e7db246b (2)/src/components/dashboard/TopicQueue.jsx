import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Sparkles, ExternalLink, ArrowRight } from "lucide-react";

export default function TopicQueue({ ideas }) {
  const pendingIdeas = ideas.filter(i => i.status === 'pending').slice(0, 5);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Content Queue
          </CardTitle>
          <Link to={createPageUrl("TopicDiscovery")}>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {pendingIdeas.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No topics in queue</h3>
            <p className="text-gray-500 mb-4">Discover trending topics to generate content</p>
            <Link to={createPageUrl("TopicDiscovery")}>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                <Sparkles className="w-4 h-4" />
                Discover Topics
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingIdeas.map((idea) => (
              <div 
                key={idea.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 truncate">{idea.title}</h4>
                      {idea.trending_score >= 70 && (
                        <Badge className="bg-red-600 text-xs gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Hot
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{idea.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {idea.content_type?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {idea.source}
                      </Badge>
                      {idea.priority === 'high' && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          High Priority
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link to={`${createPageUrl("ArticleGenerator")}?title=${encodeURIComponent(idea.title)}&type=${idea.content_type}`}>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
                      <Sparkles className="w-3 h-3" />
                      Generate
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
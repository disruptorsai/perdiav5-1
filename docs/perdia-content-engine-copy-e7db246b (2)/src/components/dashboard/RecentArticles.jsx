import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  in_review: "bg-amber-100 text-amber-700 border-amber-300",
  approved: "bg-blue-100 text-blue-700 border-blue-300",
  published: "bg-emerald-100 text-emerald-700 border-emerald-300",
  needs_revision: "bg-red-100 text-red-700 border-red-300"
};

export default function RecentArticles({ articles, isLoading }) {
  const recentArticles = articles.slice(0, 8);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-900">
          Recent Articles
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : recentArticles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No articles yet. Start by generating your first one!</p>
            </div>
          ) : (
            recentArticles.map((article) => (
              <div 
                key={article.id} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <Link to={`${createPageUrl("ArticleEditor")}?id=${article.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className={`${statusColors[article.status]} border font-medium`}>
                          {article.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(article.created_date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {article.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {article.risk_flags && article.risk_flags.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-amber-700">
                            {article.risk_flags.length} risk flag{article.risk_flags.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {article.schema_valid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Schema valid" />
                      )}
                      {article.shortcode_valid && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500" title="Shortcodes valid" />
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
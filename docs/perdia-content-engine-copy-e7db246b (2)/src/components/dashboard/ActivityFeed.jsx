import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function ActivityFeed({ articles }) {
  const recentActivity = articles
    .slice(0, 10)
    .map(article => ({
      id: article.id,
      title: article.title,
      status: article.status,
      date: article.updated_date || article.created_date,
      type: 'article'
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getIcon = (status) => {
    switch(status) {
      case 'published': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in_review': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'needs_revision': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (status) => {
    switch(status) {
      case 'published': return 'Published';
      case 'in_review': return 'Moved to review';
      case 'approved': return 'Approved';
      case 'needs_revision': return 'Needs revision';
      case 'draft': return 'Created draft';
      default: return 'Updated';
    }
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-bold text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No activity yet</p>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getActivityText(activity.status)} • {format(new Date(activity.date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, Plus } from "lucide-react";

export default function ArticleNavigationGenerator({ content, onNavigationGenerated }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!content) {
      setHeadings([]);
      return;
    }

    const h2Regex = /<h2[^>]*id=["']([^"']+)["'][^>]*>([^<]+)<\/h2>/gi;
    const matches = [];
    let match;

    while ((match = h2Regex.exec(content)) !== null) {
      matches.push({
        id: match[1],
        text: match[2]
      });
    }

    setHeadings(matches);
  }, [content]);

  const generateNavigation = () => {
    if (headings.length === 0) {
      alert('No H2 headings with IDs found. Add headings with id attributes first.');
      return;
    }

    const navHtml = `
<nav class="article-navigation" style="background: #f0f7ff; border: 1px solid #bae0ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #0070c9;">Table of Contents</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">
    ${headings.map(h => `<li style="margin: 8px 0;"><a href="#${h.id}" style="color: #0070c9; text-decoration: none;">${h.text}</a></li>`).join('\n    ')}
  </ul>
</nav>
    `.trim();

    onNavigationGenerated(navHtml);
    alert('Navigation inserted at the top of your article!');
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <List className="w-5 h-5" />
            Navigation
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {headings.length} heading{headings.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {headings.length > 0 ? (
          <>
            <div className="space-y-1">
              {headings.map((heading, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-700">
                  {heading.text}
                </div>
              ))}
            </div>
            <Button
              onClick={generateNavigation}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Insert Navigation
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No H2 headings with IDs found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
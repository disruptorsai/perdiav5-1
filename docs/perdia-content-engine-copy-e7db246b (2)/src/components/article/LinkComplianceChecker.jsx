import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";

export default function LinkComplianceChecker({ content, onComplianceChange }) {
  const [linkStats, setLinkStats] = useState({
    internal: 0,
    external: 0,
    total: 0,
    compliant: true
  });

  useEffect(() => {
    if (!content) {
      setLinkStats({ internal: 0, external: 0, total: 0, compliant: false });
      onComplianceChange(false);
      return;
    }

    const internalCount = (content.match(/geteducated\.com/gi) || []).length;
    const externalCount = (content.match(/<a href="http/gi) || []).length - internalCount;
    const totalCount = internalCount + externalCount;
    const isCompliant = internalCount >= 2 && externalCount >= 1;

    const stats = {
      internal: internalCount,
      external: externalCount,
      total: totalCount,
      compliant: isCompliant
    };

    setLinkStats(stats);
    onComplianceChange(isCompliant);
  }, [content, onComplianceChange]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Link Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Internal Links</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={linkStats.internal >= 2 ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
              {linkStats.internal}
            </Badge>
            {linkStats.internal >= 2 ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">External Links</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={linkStats.external >= 1 ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
              {linkStats.external}
            </Badge>
            {linkStats.external >= 1 ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {!linkStats.compliant && linkStats.total > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Recommendation:</strong> Add {linkStats.internal < 2 ? `${2 - linkStats.internal} more internal link(s)` : ''} 
              {linkStats.internal < 2 && linkStats.external < 1 ? ' and ' : ''}
              {linkStats.external < 1 ? `${1 - linkStats.external} more external link(s)` : ''} for optimal SEO.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
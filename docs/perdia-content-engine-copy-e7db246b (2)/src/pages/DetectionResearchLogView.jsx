import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DetectionResearchLogView() {
  const [expandedId, setExpandedId] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['detection-research-logs'],
    queryFn: () => base44.entities.DetectionResearchLog.list('-date_checked'),
  });

  const pendingLogs = logs.filter(l => !l.implemented);
  const implementedLogs = logs.filter(l => l.implemented);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const LogCard = ({ log, isPending }) => (
    <Card className={isPending ? "border-2 border-orange-500 bg-orange-50/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPending ? (
              <AlertCircle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Research - {new Date(log.date_checked).toLocaleDateString()}</CardTitle>
                <Badge className={isPending ? "bg-orange-600 text-white" : "bg-green-600 text-white"}>
                  {isPending ? "Pending" : "Implemented"}
                </Badge>
              </div>
              {log.detection_tools_mentioned && (
                <p className="text-sm text-gray-600 mt-1">Tools: {log.detection_tools_mentioned}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
          >
            {expandedId === log.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence>
        {expandedId === log.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Trends Summary:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{log.key_trends_summary}</p>
              </div>

              {log.google_policy_notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Google Policy Notes:</h3>
                  <div className="bg-blue-50 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                    {log.google_policy_notes}
                  </div>
                </div>
              )}

              {log.recommended_changes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recommended Changes:</h3>
                  <div className="bg-yellow-50 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                    {log.recommended_changes}
                  </div>
                </div>
              )}

              {log.sources && log.sources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sources:</h3>
                  <div className="space-y-1">
                    {log.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {log.implemented_at && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Implemented: {new Date(log.implemented_at).toLocaleString()}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detection Research Log</h1>
          <p className="text-gray-600">AI detection trends and Google policy research findings</p>
        </motion.div>

        {/* Pending Changes */}
        {pendingLogs.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Pending Implementation ({pendingLogs.length})
            </h2>
            <div className="space-y-4">
              {pendingLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LogCard log={log} isPending={true} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Implemented Changes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Implementation History
          </h2>
          <div className="space-y-4">
            {implementedLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <LogCard log={log} isPending={false} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
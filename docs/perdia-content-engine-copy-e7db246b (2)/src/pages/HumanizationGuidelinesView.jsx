import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HumanizationGuidelinesView() {
  const [expandedId, setExpandedId] = useState(null);

  const { data: guidelines = [], isLoading } = useQuery({
    queryKey: ['humanization-guidelines'],
    queryFn: () => base44.entities.HumanizationGuidelines.list('-version'),
  });

  const activeGuideline = guidelines.find(g => g.active);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Humanization Guidelines</h1>
          <p className="text-gray-600">Current rules for humanizing AI-generated content</p>
        </motion.div>

        {/* Active Guideline Highlight */}
        {activeGuideline && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle className="text-xl">{activeGuideline.guideline_title}</CardTitle>
                      <Badge className="mt-2 bg-green-600 text-white">Version {activeGuideline.version} • ACTIVE</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === activeGuideline.id ? null : activeGuideline.id)}
                  >
                    {expandedId === activeGuideline.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedId === activeGuideline.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Detection Focus:</h3>
                        <p className="text-gray-700">{activeGuideline.detection_focus || "N/A"}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Guidelines:</h3>
                        <div className="bg-white rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                          {activeGuideline.guideline_body}
                        </div>
                      </div>
                      {activeGuideline.notes_for_editors && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Notes for Editors:</h3>
                          <p className="text-gray-700 bg-yellow-50 rounded-lg p-3">{activeGuideline.notes_for_editors}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(activeGuideline.created_date).toLocaleString()}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}

        {/* Version History */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Version History
          </h2>
          <div className="space-y-4">
            {guidelines.filter(g => !g.active).map((guideline) => (
              <motion.div
                key={guideline.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{guideline.guideline_title}</CardTitle>
                        <Badge variant="outline" className="mt-2">Version {guideline.version}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === guideline.id ? null : guideline.id)}
                      >
                        {expandedId === guideline.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedId === guideline.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Detection Focus:</h3>
                            <p className="text-gray-700">{guideline.detection_focus || "N/A"}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Guidelines:</h3>
                            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto">
                              {guideline.guideline_body}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {new Date(guideline.created_date).toLocaleString()}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
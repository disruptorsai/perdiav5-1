import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AITraining() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState('');

  const { data: trainingData = [], isLoading } = useQuery({
    queryKey: ['training-data'],
    queryFn: () => base44.entities.TrainingData.list('-created_date', 100),
  });

  const { data: systemSettings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const applyTrainingMutation = useMutation({
    mutationFn: async () => {
      setTrainingStatus('Analyzing all training data...');
      
      const pendingData = trainingData.filter(t => t.status === 'pending_review' || t.status === 'approved');
      
      if (pendingData.length === 0) {
        throw new Error('No training data to apply');
      }

      setTrainingStatus(`Processing ${pendingData.length} training examples...`);

      // Aggregate all feedback patterns
      const allFeedback = pendingData.flatMap(t => t.feedback_items || []);
      const categoryBreakdown = {};
      const severityBreakdown = {};
      
      allFeedback.forEach(item => {
        categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
        severityBreakdown[item.severity] = (severityBreakdown[item.severity] || 0) + 1;
      });

      setTrainingStatus('Generating improved system prompts...');

      // Create comprehensive training prompt
      const trainingPrompt = `You are analyzing editorial feedback to improve GetEducated.com's AI content generation system.

TRAINING DATA SUMMARY:
- Total revisions analyzed: ${pendingData.length}
- Total feedback items: ${allFeedback.length}

FEEDBACK BY CATEGORY:
${Object.entries(categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count} instances (${Math.round(count/allFeedback.length*100)}%)`).join('\n')}

FEEDBACK BY SEVERITY:
${Object.entries(severityBreakdown).map(([sev, count]) => `- ${sev}: ${count} instances`).join('\n')}

DETAILED FEEDBACK EXAMPLES:
${pendingData.slice(0, 10).map((t, i) => `
Example ${i + 1}: ${t.article_title}
Content Type: ${t.content_type}
Lesson: ${t.lesson_learned}
Key Feedback:
${(t.feedback_items || []).slice(0, 3).map((f, j) => `  ${j + 1}. [${f.category}] ${f.comment}`).join('\n')}
`).join('\n')}

COMMON PATTERNS IDENTIFIED:
${[...new Set(pendingData.map(t => t.pattern_type))].map(p => `- ${p}`).join('\n')}

YOUR TASK:
Analyze these patterns and create SPECIFIC, ACTIONABLE improvements to our system prompts.

Generate a JSON response with these improvements:
{
  "ranking_prompt_additions": "Specific instructions to add to ranking article prompts",
  "career_guide_prompt_additions": "Specific instructions to add to career guide prompts",
  "general_guidelines": "Universal guidelines for all content types",
  "tone_adjustments": "How to adjust tone based on feedback",
  "structure_improvements": "How to improve article structure",
  "compliance_rules": "New compliance rules to enforce",
  "quality_checklist": ["item1", "item2", "item3"],
  "implementation_summary": "Brief summary of changes being applied"
}

Be specific and actionable. Focus on the most impactful improvements.`;

      const improvements = await base44.integrations.Core.InvokeLLM({
        prompt: trainingPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            ranking_prompt_additions: { type: "string" },
            career_guide_prompt_additions: { type: "string" },
            general_guidelines: { type: "string" },
            tone_adjustments: { type: "string" },
            structure_improvements: { type: "string" },
            compliance_rules: { type: "string" },
            quality_checklist: {
              type: "array",
              items: { type: "string" }
            },
            implementation_summary: { type: "string" }
          }
        }
      });

      setTrainingStatus('Updating system prompts...');

      // Save improvements to system settings
      const timestamp = new Date().toISOString();
      await base44.entities.SystemSetting.create({
        setting_key: `ai_training_applied_${timestamp}`,
        setting_value: JSON.stringify(improvements),
        setting_type: 'ai',
        description: `AI training improvements applied on ${new Date().toLocaleDateString()}`
      });

      // Update system guidelines
      await base44.entities.SystemSetting.create({
        setting_key: 'ai_content_guidelines',
        setting_value: improvements.general_guidelines,
        setting_type: 'ai',
        description: 'Latest AI content generation guidelines from training'
      });

      setTrainingStatus('Marking training data as applied...');

      // Mark all training data as applied
      await Promise.all(
        pendingData.map(t => 
          base44.entities.TrainingData.update(t.id, { 
            status: 'applied',
            applied_to_system: true
          })
        )
      );

      return improvements;
    },
    onSuccess: (improvements) => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setIsTraining(false);
      setTrainingStatus('');
      
      alert(`✨ AI Training Complete!\n\n${improvements.implementation_summary}\n\nAll future articles will use these improved prompts.`);
    },
    onError: (error) => {
      setIsTraining(false);
      setTrainingStatus('');
      alert('Failed to apply training: ' + error.message);
    }
  });

  const handleApplyTraining = () => {
    const pendingCount = trainingData.filter(t => 
      t.status === 'pending_review' || t.status === 'approved'
    ).length;

    if (pendingCount === 0) {
      alert('No training data available to apply. Complete some article revisions first.');
      return;
    }

    if (confirm(`Apply training from ${pendingCount} revision(s)?\n\nThis will analyze all feedback and update AI prompts system-wide.`)) {
      setIsTraining(true);
      applyTrainingMutation.mutate();
    }
  };

  const pendingData = trainingData.filter(t => t.status === 'pending_review' || t.status === 'approved');
  const appliedData = trainingData.filter(t => t.status === 'applied');

  const patternColors = {
    tone_adjustment: 'bg-blue-100 text-blue-700',
    structure_improvement: 'bg-purple-100 text-purple-700',
    seo_optimization: 'bg-emerald-100 text-emerald-700',
    compliance_fix: 'bg-red-100 text-red-700',
    style_change: 'bg-amber-100 text-amber-700',
    accuracy_correction: 'bg-indigo-100 text-indigo-700'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Training Overlay */}
        <AnimatePresence>
          {isTraining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              >
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-10 h-10 text-purple-600 animate-pulse" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-transparent border-t-purple-400 rounded-full"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Training AI System
                    </h3>
                    <p className="text-purple-600 font-medium">
                      {trainingStatus}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>🧠 Analyzing editorial patterns</p>
                    <p>📝 Generating improved prompts</p>
                    <p>⚡ Updating system guidelines</p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      This takes about 60 seconds...
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  AI Training Center
                </h1>
                <p className="text-gray-600 mt-1">
                  Learn from editorial feedback to improve content generation
                </p>
              </div>
            </div>
            <Button
              onClick={handleApplyTraining}
              disabled={pendingData.length === 0 || isTraining}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2 shadow-lg"
              size="lg"
            >
              <Zap className="w-5 h-5" />
              Apply Training ({pendingData.length})
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Training Data</p>
                <p className="text-2xl font-bold text-gray-900">{trainingData.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingData.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Applied to System</p>
                <p className="text-2xl font-bold text-gray-900">{appliedData.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Impact Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trainingData.length > 0 
                    ? (trainingData.reduce((sum, t) => sum + (t.impact_score || 5), 0) / trainingData.length).toFixed(1)
                    : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        {pendingData.length > 0 && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Sparkles className="w-12 h-12" />
                  <div>
                    <h3 className="font-bold text-xl mb-1">
                      Ready to Train AI System
                    </h3>
                    <p className="text-purple-100">
                      {pendingData.length} revision{pendingData.length > 1 ? 's' : ''} with {pendingData.reduce((sum, t) => sum + (t.feedback_items?.length || 0), 0)} feedback items ready to improve prompts
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleApplyTraining}
                  className="bg-white text-purple-700 hover:bg-purple-50"
                >
                  Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-lg border-none">
            <TabsTrigger value="pending">Pending ({pendingData.length})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({appliedData.length})</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingData.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-lg">
                <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Training Data Yet</h3>
                <p className="text-gray-600">
                  Review and revise articles to generate training data
                </p>
              </Card>
            ) : (
              pendingData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {item.article_title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={patternColors[item.pattern_type]}>
                              {item.pattern_type?.replace(/_/g, ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {item.content_type}
                            </Badge>
                            <Badge variant="outline">
                              Impact: {item.impact_score}/10
                            </Badge>
                            <Badge variant="outline">
                              {item.feedback_items?.length || 0} feedback items
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                        <p className="text-sm font-medium text-blue-900 mb-1">Lesson Learned:</p>
                        <p className="text-sm text-blue-700">{item.lesson_learned}</p>
                      </div>

                      {item.feedback_items && item.feedback_items.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Key Feedback:</p>
                          {item.feedback_items.slice(0, 3).map((feedback, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded border text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {feedback.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {feedback.severity}
                                </Badge>
                              </div>
                              <p className="text-gray-700">{feedback.comment}</p>
                            </div>
                          ))}
                          {item.feedback_items.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{item.feedback_items.length - 3} more feedback items
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="applied" className="mt-6 space-y-4">
            {appliedData.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-lg">
                <p className="text-gray-500">No training has been applied yet</p>
              </Card>
            ) : (
              appliedData.map((item) => (
                <Card key={item.id} className="border-none shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.article_title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{item.lesson_learned}</p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-600 text-xs">Applied</Badge>
                          <Badge className={`${patternColors[item.pattern_type]} text-xs`}>
                            {item.pattern_type?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Training Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Pattern Distribution</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(
                      trainingData.reduce((acc, t) => {
                        acc[t.pattern_type] = (acc[t.pattern_type] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([pattern, count]) => (
                      <div key={pattern} className="p-3 bg-gray-50 rounded-lg">
                        <Badge className={`${patternColors[pattern]} mb-2`}>
                          {pattern.replace(/_/g, ' ')}
                        </Badge>
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">System Improvements</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-medium text-emerald-900">Training Sessions Applied</span>
                      <span className="text-lg font-bold text-emerald-700">{appliedData.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">Total Feedback Processed</span>
                      <span className="text-lg font-bold text-blue-700">
                        {trainingData.reduce((sum, t) => sum + (t.feedback_items?.length || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
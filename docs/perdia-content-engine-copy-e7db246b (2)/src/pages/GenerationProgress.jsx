import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GenerationProgress() {
  const urlParams = new URLSearchParams(window.location.search);
  const ideaId = urlParams.get('ideaId');
  
  const [generationSteps, setGenerationSteps] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const { data: idea } = useQuery({
    queryKey: ['idea', ideaId],
    queryFn: () => ideaId ? base44.entities.ContentIdea.filter({ id: ideaId }).then(r => r[0]) : null,
    enabled: !!ideaId
  });

  // Mock steps - in real implementation, this would come from the actual generation process
  useEffect(() => {
    if (!idea) return;

    const steps = [
      'Analyzing chosen topic...',
      'Scanning GetEducated.com for relevant articles to link to...',
      'Identifying key sub-topics and H2 structure...',
      'Performing keyword analysis...',
      'Searching for credible external sources and citations...',
      'Drafting introduction and outlining core arguments...',
      'Generating content for section: "Introduction"',
      'Generating content for section: "Main Content"',
      'Generating content for section: "Conclusion"',
      'Inserting internal links to related GetEducated articles...',
      'Adding external citations from trusted sources...',
      'Structuring content with appropriate HTML tags and headings...',
      'Generating initial FAQ section based on common user queries...',
      'Running quality checks: word count, readability, structure...',
      'Humanizing content to sound natural and authentic...',
      'Finalizing draft and preparing for review...'
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setGenerationSteps(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: steps[currentIndex]
        }]);
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [idea]);

  if (!idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            {isComplete ? (
              <CheckCircle2 className="w-10 h-10 text-blue-600" />
            ) : (
              <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isComplete ? 'Generation Complete!' : 'Generating Article'}
          </h1>
          <p className="text-xl text-gray-600 mb-1">{idea.title}</p>
          <p className="text-sm text-gray-500">
            {isComplete ? 'Article is now ready for review' : 'AI is working on your content...'}
          </p>
        </motion.div>

        {/* Progress Card */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`w-5 h-5 ${isComplete ? 'text-green-600' : 'text-blue-600 animate-spin'}`} />
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-xl p-6 max-h-[600px] overflow-y-auto space-y-2">
              <AnimatePresence>
                {generationSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="text-gray-400 text-xs mt-0.5 font-mono flex-shrink-0">
                      {step.timestamp}
                    </span>
                    <span className="text-gray-700 flex-1">
                      {step.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!isComplete && generationSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-blue-600 mt-4"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Processing...</span>
                </motion.div>
              )}

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-green-600 mt-4 p-3 bg-green-50 rounded-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Article successfully created and added to Review Queue!</span>
                </motion.div>
              )}
            </div>

            {isComplete && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-center text-gray-500 mt-4"
              >
                You can close this window and return to the dashboard.
              </motion.p>
            )}

            {!isComplete && (
              <p className="text-xs text-center text-gray-500 mt-4">
                This usually takes 30-60 seconds...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
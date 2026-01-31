import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

export default function DetailedProgressIndicator({ steps, isComplete }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="border-none shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Loader2 className="w-10 h-10 animate-spin" />
              )}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">
            {isComplete ? 'Article Generated Successfully!' : 'AI is Crafting Your Article'}
          </h2>
          <p className="text-center text-blue-100">
            {isComplete 
              ? 'Your article is ready for review and editing' 
              : 'Watch the AI at work - this typically takes 30-60 seconds'
            }
          </p>
        </div>

        <CardContent className="p-0">
          {/* Progress Log */}
          <div 
            ref={scrollRef}
            className="bg-gray-900 p-6 max-h-[600px] overflow-y-auto font-mono text-sm"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-3 flex items-start gap-3"
                >
                  <span className="text-cyan-400 flex-shrink-0 select-none">
                    [{step.timestamp}]
                  </span>
                  <div className="flex-1">
                    {step.message.includes('✓') ? (
                      <span className="text-green-400 font-medium">{step.message}</span>
                    ) : step.message.includes('✗') ? (
                      <span className="text-red-400 font-medium">{step.message}</span>
                    ) : step.message.includes('Generating content for section') ? (
                      <span className="text-yellow-300">{step.message}</span>
                    ) : step.message.includes('Invoking AI') ? (
                      <span className="text-purple-400 font-medium">{step.message}</span>
                    ) : (
                      <span className="text-gray-300">{step.message}</span>
                    )}
                  </div>
                  {!step.message.includes('✓') && !step.message.includes('✗') && index === steps.length - 1 && !isComplete && (
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Cursor */}
            {!isComplete && steps.length > 0 && (
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-green-400 ml-1"
              />
            )}
          </div>

          {/* Info Panel */}
          <div className="bg-gray-50 p-6 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Steps Completed</p>
                <p className="text-2xl font-bold text-blue-600">{steps.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-lg font-semibold text-gray-900">
                  {isComplete ? 'Complete' : 'Processing'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Quality</p>
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <p className="text-lg font-semibold text-gray-900">AI-Optimized</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Happening Info */}
      <Card className="border-none shadow-lg mt-6 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            What's Happening?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>AI analyzes your topic and keywords to understand search intent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Real-time data from BLS and trusted sources is gathered</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Content is structured following GetEducated's proven templates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>SEO best practices and internal linking opportunities are integrated</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Quality checks ensure compliance and readability</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Plus,
  ListChecks,
  Sparkles,
  FileText
} from "lucide-react";

export default function GenerationSuccess({ article, onNavigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* Success Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
        >
          <CheckCircle2 className="w-14 h-14 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 mb-3"
        >
          Article Generated Successfully! 🎉
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-gray-600"
        >
          Your AI-generated article is ready and has been added to the Review Queue
        </motion.p>
      </div>

      {/* Article Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-none shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h2>
                {article.excerpt && (
                  <p className="text-gray-600 mb-4">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-600 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    In Review Queue
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {article.type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {article.word_count.toLocaleString()} words
                  </Badge>
                  {article.faqs && article.faqs.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {article.faqs.length} FAQs
                    </Badge>
                  )}
                  {article.schema_valid && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      ✓ Schema Valid
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Article Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-lg font-bold text-emerald-600">In Review</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Quality</p>
                <div className="flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <p className="text-lg font-bold text-gray-900">AI-Optimized</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Target Keywords</p>
                <p className="text-lg font-bold text-gray-900">
                  {article.target_keywords?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid md:grid-cols-3 gap-4 mb-8"
      >
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer group">
          <CardContent 
            className="p-6 text-center"
            onClick={() => onNavigate(createPageUrl('ReviewQueue'))}
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ListChecks className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Go to Review Queue</h3>
            <p className="text-sm text-gray-600 mb-4">
              View all articles awaiting review
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Open Review Queue
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 hover:border-emerald-400 transition-all cursor-pointer group">
          <CardContent 
            className="p-6 text-center"
            onClick={() => onNavigate(createPageUrl('ArticleReview') + `?id=${article.id}`)}
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Eye className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Review This Article</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add comments and feedback
            </p>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Start Reviewing
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-200 hover:border-cyan-400 transition-all cursor-pointer group">
          <CardContent 
            className="p-6 text-center"
            onClick={() => onNavigate(createPageUrl('ArticleEditor') + `?id=${article.id}`)}
          >
            <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Edit3 className="w-7 h-7 text-cyan-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Edit Article Now</h3>
            <p className="text-sm text-gray-600 mb-4">
              Make changes before review
            </p>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
              Open Editor
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Another */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => onNavigate(createPageUrl('ArticleWizard'))}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Generate Another Article
        </Button>
      </motion.div>

      {/* What's Next Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-none shadow-lg mt-8 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              What's Next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span><strong>Review the article</strong> - Add comments on specific sections that need improvement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span><strong>Use AI Revise</strong> - Click "AI Revise" to automatically improve based on your feedback</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span><strong>Edit if needed</strong> - Make manual edits in the Article Editor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span><strong>Approve & Publish</strong> - Once satisfied, approve for publishing or publish immediately</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
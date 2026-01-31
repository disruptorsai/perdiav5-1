import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  Award, 
  Briefcase, 
  List, 
  BookOpen, 
  HelpCircle,
  Check
} from "lucide-react";

const contentTypes = [
  {
    id: 'ranking',
    name: 'Ranking / Best Buy List',
    icon: Award,
    description: 'Data-driven rankings of programs by cost and quality',
    structure: 'Opening, Statistics, Methodology, Rankings List, FAQs',
    wordCount: '1500-2000',
    bestFor: 'Degree programs, school comparisons',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'career_guide',
    name: 'Career Guide',
    icon: Briefcase,
    description: 'Step-by-step guide to entering a profession',
    structure: 'Overview, Requirements, Steps, Salary & Outlook, FAQs',
    wordCount: '2000-2500',
    bestFor: 'Career paths, job information',
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'listicle',
    name: 'Listicle',
    icon: List,
    description: 'Numbered list of jobs, programs, or opportunities',
    structure: 'Introduction, List (15-25 items), Outlook, FAQs',
    wordCount: '2500-3500',
    bestFor: 'Job lists, degree options, career opportunities',
    color: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'guide',
    name: 'Comprehensive Guide',
    icon: BookOpen,
    description: 'In-depth educational content on a topic',
    structure: 'Overview, Key Concepts, Process, Best Practices, Resources',
    wordCount: '1500-2500',
    bestFor: 'Educational topics, how-to content',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'faq',
    name: 'FAQ Article',
    icon: HelpCircle,
    description: 'Question-and-answer format covering a topic',
    structure: 'Introduction, Categorized FAQs (15-20 questions)',
    wordCount: '2000-3000',
    bestFor: 'Common questions, detailed explanations',
    color: 'from-purple-500 to-purple-600'
  }
];

export default function ContentTypeSelection({ selectedIdea, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Selected Idea Summary */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Selected Topic</h3>
              <p className="text-gray-700 font-medium mb-2">{selectedIdea.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedIdea.keywords.slice(0, 5).map((kw, i) => (
                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Article Type</h2>
        <p className="text-gray-600 mb-6">
          Select the content format that best suits your topic and goals
        </p>
      </div>

      {/* Content Type Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {contentTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group h-full"
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <type.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {type.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {type.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-1">Structure</p>
                    <p className="text-sm text-gray-700">{type.structure}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Word Count</p>
                      <p className="text-sm text-gray-900 font-semibold">{type.wordCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">Best For</p>
                      <p className="text-sm text-gray-900">{type.bestFor}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
                    <span>Select This Type</span>
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
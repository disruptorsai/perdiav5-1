import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListOrdered, BookOpen, Trophy, GraduationCap, HelpCircle } from "lucide-react";

const contentTypes = [
  {
    id: "ranking",
    name: "Rankings / Best Buy List",
    icon: Trophy,
    description: "Cost-focused rankings of degree programs",
    example: "The 27 Most Affordable Online Bachelor's in Business",
    color: "blue"
  },
  {
    id: "career_guide",
    name: "Career Guide",
    icon: GraduationCap,
    description: "Step-by-step guide to entering a profession",
    example: "How to Become a History Teacher",
    color: "green"
  },
  {
    id: "listicle",
    name: "Job Listicle",
    icon: ListOrdered,
    description: "Highest paying jobs with salary data",
    example: "24 Highest Paying Associate Degree Jobs",
    color: "purple"
  },
  {
    id: "guide",
    name: "Educational Guide",
    icon: BookOpen,
    description: "Consumer advice and educational information",
    example: "6 Ways to Get College Credit for Work Experience",
    color: "amber"
  },
  {
    id: "faq",
    name: "FAQ Page",
    icon: HelpCircle,
    description: "Common questions and answers",
    example: "Online Degree FAQs",
    color: "indigo"
  }
];

export default function ContentTypeSelector({ selectedType, onSelect }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contentTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-200 ${
              isSelected 
                ? `border-2 border-${type.color}-500 bg-${type.color}-50` 
                : 'hover:shadow-lg border-gray-200'
            }`}
            onClick={() => onSelect(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${type.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 text-${type.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{type.description}</p>
                  <p className="text-xs text-gray-500 italic">
                    "{type.example}"
                  </p>
                </div>
              </div>
              {isSelected && (
                <Badge className={`mt-3 bg-${type.color}-600`}>Selected</Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Code } from "lucide-react";

export default function SchemaGenerator({ article, onSchemaUpdate }) {
  const [faqs, setFaqs] = useState(article?.faqs || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleAddFaq = () => {
    if (newQuestion && newAnswer) {
      const updatedFaqs = [...faqs, { question: newQuestion, answer: newAnswer }];
      setFaqs(updatedFaqs);
      onSchemaUpdate(updatedFaqs, generateSchema(updatedFaqs));
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleRemoveFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
    onSchemaUpdate(updatedFaqs, generateSchema(updatedFaqs));
  };

  const generateSchema = (faqList) => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqList.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5" />
            Schema Generator
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-start gap-2 flex-1">
                <span className="font-semibold text-blue-600 text-sm mt-0.5">{index + 1}.</span>
                <p className="font-medium text-sm text-gray-900 flex-1">{faq.question}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFaq(index)}
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
            <p className="text-xs text-gray-600 ml-5">{faq.answer}</p>
          </div>
        ))}

        <div className="space-y-2 pt-4 border-t">
          <Input
            placeholder="FAQ Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="FAQ Answer"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button
            onClick={handleAddFaq}
            disabled={!newQuestion || !newAnswer}
            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add FAQ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
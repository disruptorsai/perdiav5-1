import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function QualityChecklist({ article, content, onQualityChange }) {
  const [checks, setChecks] = useState({});
  const [score, setScore] = useState(0);
  const [canPublish, setCanPublish] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });

  const getSettingValue = (key, defaultValue) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  useEffect(() => {
    if (!content || settings.length === 0) {
      onQualityChange({ canPublish: false, score: 0, checks: {} });
      return;
    }

    // Get quality settings
    const minWordCount = parseInt(getSettingValue('min_word_count', '800'));
    const minInternalLinks = parseInt(getSettingValue('min_internal_links', '3'));
    const minExternalLinks = parseInt(getSettingValue('min_external_links', '1'));
    const requireBLS = getSettingValue('require_bls_citation', 'false') === 'true';
    const requireFAQ = getSettingValue('require_faq_schema', 'false') === 'true';
    const requireHeadings = getSettingValue('require_headings', 'true') === 'true';
    const minHeadingCount = parseInt(getSettingValue('min_heading_count', '3'));
    const minImages = parseInt(getSettingValue('min_images', '1'));
    const requireImageAlt = getSettingValue('require_image_alt_text', 'true') === 'true';
    const keywordDensityMin = parseFloat(getSettingValue('keyword_density_min', '0.5'));
    const keywordDensityMax = parseFloat(getSettingValue('keyword_density_max', '2.5'));
    const minReadability = parseInt(getSettingValue('min_readability_score', '60'));
    const maxReadability = parseInt(getSettingValue('max_readability_score', '80'));

    // Calculate metrics
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).filter(w => w).length;
    const internalLinks = (content.match(/geteducated\.com/gi) || []).length;
    const externalLinks = (content.match(/<a href="http/gi) || []).length - internalLinks;
    const hasSchema = article?.faqs && article.faqs.length > 0;
    const hasBLSCitation = content.toLowerCase().includes('bls.gov') || content.toLowerCase().includes('bureau of labor');
    
    // Count headings
    const h2Count = (content.match(/<h2/gi) || []).length;
    const h3Count = (content.match(/<h3/gi) || []).length;
    const totalHeadings = h2Count + h3Count;
    
    // Count images
    const imageMatches = content.match(/<img[^>]*>/gi) || [];
    const imageCount = imageMatches.length;
    const imagesWithAlt = imageMatches.filter(img => /alt="[^"]+"/i.test(img)).length;
    
    // Calculate keyword density (if target keywords exist)
    let keywordDensity = 0;
    if (article?.target_keywords && article.target_keywords.length > 0) {
      const primaryKeyword = article.target_keywords[0].toLowerCase();
      const keywordOccurrences = (plainText.toLowerCase().match(new RegExp(primaryKeyword, 'g')) || []).length;
      keywordDensity = (keywordOccurrences / wordCount) * 100;
    }
    
    // Simple readability approximation (Flesch Reading Ease)
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim()).length;
    const syllables = plainText.split(/\s+/).reduce((count, word) => {
      return count + word.replace(/[^aeiou]/gi, '').length;
    }, 0);
    const readabilityScore = sentences > 0 && wordCount > 0 
      ? 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)
      : 0;

    const newChecks = {
      wordCount: {
        passed: wordCount >= minWordCount,
        critical: false, // Changed from true - word count is now a recommendation, not blocker
        label: `Minimum ${minWordCount} words`,
        value: `${wordCount} words`
      },
      internalLinks: {
        passed: internalLinks >= minInternalLinks,
        critical: false,
        label: `At least ${minInternalLinks} internal links`,
        value: `${internalLinks} link${internalLinks !== 1 ? 's' : ''}`
      },
      externalLinks: {
        passed: externalLinks >= minExternalLinks,
        critical: false,
        label: `At least ${minExternalLinks} external citation${minExternalLinks !== 1 ? 's' : ''}`,
        value: `${externalLinks} link${externalLinks !== 1 ? 's' : ''}`
      },
      schema: {
        passed: !requireFAQ || hasSchema,
        critical: requireFAQ,
        label: 'FAQ Schema markup',
        value: hasSchema ? 'Added' : 'Missing',
        enabled: requireFAQ
      },
      blsCitation: {
        passed: !requireBLS || hasBLSCitation,
        critical: requireBLS,
        label: 'BLS data citation',
        value: hasBLSCitation ? 'Present' : 'Missing',
        enabled: requireBLS
      },
      headings: {
        passed: !requireHeadings || totalHeadings >= minHeadingCount,
        critical: false,
        label: `At least ${minHeadingCount} headings (H2/H3)`,
        value: `${totalHeadings} heading${totalHeadings !== 1 ? 's' : ''}`,
        enabled: requireHeadings
      },
      images: {
        passed: imageCount >= minImages,
        critical: false,
        label: `At least ${minImages} image${minImages !== 1 ? 's' : ''}`,
        value: `${imageCount} image${imageCount !== 1 ? 's' : ''}`
      },
      imageAlt: {
        passed: !requireImageAlt || imageCount === 0 || imagesWithAlt === imageCount,
        critical: false,
        label: 'All images have alt text',
        value: `${imagesWithAlt}/${imageCount} with alt text`,
        enabled: requireImageAlt && imageCount > 0
      },
      keywordDensity: {
        passed: !article?.target_keywords || (keywordDensity >= keywordDensityMin && keywordDensity <= keywordDensityMax),
        critical: false,
        label: `Keyword density ${keywordDensityMin}%-${keywordDensityMax}%`,
        value: `${keywordDensity.toFixed(2)}%`,
        enabled: article?.target_keywords && article.target_keywords.length > 0
      },
      readability: {
        passed: readabilityScore >= minReadability && readabilityScore <= maxReadability,
        critical: false,
        label: `Readability score ${minReadability}-${maxReadability}`,
        value: `${readabilityScore.toFixed(1)} (${readabilityScore >= 60 ? 'Good' : 'Complex'})`
      }
    };

    // Filter enabled checks
    const enabledChecks = Object.entries(newChecks).reduce((acc, [key, check]) => {
      if (check.enabled === false) return acc;
      acc[key] = check;
      return acc;
    }, {});

    const totalChecks = Object.keys(enabledChecks).length;
    const passedChecks = Object.values(enabledChecks).filter(c => c.passed).length;
    const criticalFailed = Object.values(enabledChecks).some(c => c.critical && !c.passed);
    
    const newScore = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    const newCanPublish = !criticalFailed;

    setChecks(enabledChecks);
    setScore(newScore);
    setCanPublish(newCanPublish);

    onQualityChange({ 
      canPublish: newCanPublish, 
      score: newScore, 
      checks: enabledChecks 
    });
  }, [content, article, onQualityChange, settings]);

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quality Checklist</CardTitle>
          <Badge variant="outline" className={`${getScoreColor()} font-bold text-base`}>
            {score.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(checks).map(([key, check]) => (
          <div key={key} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2 flex-1">
              {check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : check.critical ? (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-sm text-gray-900">{check.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{check.value}</p>
                {check.critical && !check.passed && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Critical - blocks publishing</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {!canPublish && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-red-700 font-medium">
              Fix critical issues before publishing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

/**
 * Contributor display component for article cards
 */
export function ContributorBadge({ contributorId, contributorName }) {
  const { data: contributor } = useQuery({
    queryKey: ['contributor', contributorId],
    queryFn: () => contributorId 
      ? base44.entities.ArticleContributor.filter({ id: contributorId }).then(r => r[0])
      : null,
    enabled: !!contributorId && !contributorName
  });

  const displayName = contributorName || contributor?.name;

  if (!displayName) return null;

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
      <User className="w-3 h-3" />
      {displayName}
    </Badge>
  );
}

/**
 * Contributor selector dropdown component
 */
export function ContributorSelector({ value, onChange, contributors, className = "" }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const selected = contributors.find(c => c.id === e.target.value);
        onChange(e.target.value, selected?.name || '');
      }}
      className={`w-full p-2 border rounded-lg ${className}`}
    >
      <option value="">Select contributor...</option>
      {contributors.map(contributor => (
        <option key={contributor.id} value={contributor.id}>
          {contributor.name} — {contributor.title}
        </option>
      ))}
    </select>
  );
}
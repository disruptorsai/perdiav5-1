import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Copy } from "lucide-react";

export default function BLSCitationHelper({ onInsertCitation }) {
  const [occupation, setOccupation] = useState('');
  const [salary, setSalary] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [url, setUrl] = useState('https://www.bls.gov/ooh/');

  const generateCitation = () => {
    if (!occupation || !salary) {
      alert('Please fill in occupation and salary');
      return;
    }

    const citation = `<p>According to the <a href="${url}" target="_blank" rel="noopener">Bureau of Labor Statistics</a>, ${occupation} earned a median annual wage of $${salary} as of ${year}.</p>`;
    
    onInsertCitation(citation);
    
    // Copy to clipboard
    navigator.clipboard.writeText(citation);
    alert('BLS citation inserted and copied to clipboard!');
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          BLS Citation Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Occupation</Label>
          <Input
            placeholder="e.g., software developers"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Median Salary</Label>
          <Input
            placeholder="e.g., 120,730"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Year</Label>
          <Input
            placeholder="2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">BLS URL</Label>
          <Input
            placeholder="https://www.bls.gov/ooh/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        <Button
          onClick={generateCitation}
          disabled={!occupation || !salary}
          className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          size="sm"
        >
          <Copy className="w-4 h-4" />
          Generate & Insert Citation
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Citation will be added to the end of your article
        </p>
      </CardContent>
    </Card>
  );
}
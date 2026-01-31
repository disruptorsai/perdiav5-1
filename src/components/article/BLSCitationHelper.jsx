import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { FileText, Copy, Check, ExternalLink } from 'lucide-react'

// Common BLS occupation categories
const BLS_CATEGORIES = [
  { value: 'management', label: 'Management' },
  { value: 'business-financial', label: 'Business & Financial' },
  { value: 'computer-mathematical', label: 'Computer & Mathematical' },
  { value: 'architecture-engineering', label: 'Architecture & Engineering' },
  { value: 'life-physical-social-science', label: 'Life, Physical & Social Science' },
  { value: 'community-social-service', label: 'Community & Social Service' },
  { value: 'legal', label: 'Legal' },
  { value: 'education-training-library', label: 'Education, Training & Library' },
  { value: 'arts-design-entertainment-sports-media', label: 'Arts, Design & Entertainment' },
  { value: 'healthcare-practitioners-technical', label: 'Healthcare Practitioners' },
  { value: 'healthcare-support', label: 'Healthcare Support' },
  { value: 'protective-service', label: 'Protective Service' },
  { value: 'food-preparation-serving', label: 'Food Preparation & Serving' },
  { value: 'building-grounds-cleaning-maintenance', label: 'Building & Grounds Maintenance' },
  { value: 'personal-care-service', label: 'Personal Care & Service' },
  { value: 'sales', label: 'Sales' },
  { value: 'office-administrative-support', label: 'Office & Administrative Support' },
  { value: 'farming-fishing-forestry', label: 'Farming, Fishing & Forestry' },
  { value: 'construction-extraction', label: 'Construction & Extraction' },
  { value: 'installation-maintenance-repair', label: 'Installation, Maintenance & Repair' },
  { value: 'production', label: 'Production' },
  { value: 'transportation-material-moving', label: 'Transportation & Material Moving' },
]

// Citation templates
const CITATION_TEMPLATES = {
  salary: {
    label: 'Salary Citation',
    template: (data) =>
      `<p>According to the <a href="${data.url}" target="_blank" rel="noopener">Bureau of Labor Statistics</a>, ${data.occupation} earned a median annual wage of $${data.salary} as of ${data.year}.</p>`
  },
  outlook: {
    label: 'Job Outlook Citation',
    template: (data) =>
      `<p>The <a href="${data.url}" target="_blank" rel="noopener">Bureau of Labor Statistics</a> projects employment of ${data.occupation} to ${data.outlook} from ${data.year} to ${parseInt(data.year) + 10}, ${data.growthRate ? `about ${data.growthRate}% ${data.outlook === 'grow' ? 'growth' : 'decline'}` : 'on par with average occupations'}.</p>`
  },
  combined: {
    label: 'Combined Citation',
    template: (data) =>
      `<p>According to the <a href="${data.url}" target="_blank" rel="noopener">Bureau of Labor Statistics</a>, ${data.occupation} earned a median annual wage of $${data.salary} as of ${data.year}. Employment is projected to ${data.outlook || 'grow'} ${data.growthRate ? `${data.growthRate}%` : ''} over the next decade.</p>`
  }
}

/**
 * BLS Citation Helper Component
 * Generates properly formatted BLS citations
 */
export default function BLSCitationHelper({ onInsertCitation }) {
  const [occupation, setOccupation] = useState('')
  const [salary, setSalary] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [category, setCategory] = useState('')
  const [outlook, setOutlook] = useState('grow')
  const [growthRate, setGrowthRate] = useState('')
  const [citationType, setCitationType] = useState('salary')
  const [url, setUrl] = useState('https://www.bls.gov/ooh/')
  const [copied, setCopied] = useState(false)

  // Auto-generate URL based on category
  const handleCategoryChange = (value) => {
    setCategory(value)
    if (value) {
      setUrl(`https://www.bls.gov/ooh/${value}/`)
    }
  }

  const generateCitation = () => {
    if (!occupation || (citationType === 'salary' && !salary)) {
      return null
    }

    const template = CITATION_TEMPLATES[citationType]
    return template.template({
      occupation,
      salary: formatSalary(salary),
      year,
      url,
      outlook,
      growthRate
    })
  }

  const formatSalary = (value) => {
    const num = parseInt(value.replace(/,/g, ''))
    if (isNaN(num)) return value
    return num.toLocaleString()
  }

  const handleInsert = () => {
    const citation = generateCitation()
    if (!citation) {
      return
    }

    onInsertCitation?.(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Also copy to clipboard
    navigator.clipboard.writeText(citation).catch(console.error)
  }

  const handlePreview = () => {
    const citation = generateCitation()
    if (citation) {
      // Open preview in new window
      const previewWindow = window.open('', '_blank', 'width=600,height=300')
      previewWindow.document.write(`
        <html>
          <head><title>Citation Preview</title></head>
          <body style="font-family: system-ui; padding: 20px;">
            <h3>Citation Preview</h3>
            ${citation}
            <hr style="margin: 20px 0;">
            <h4>Raw HTML</h4>
            <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${citation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </body>
        </html>
      `)
    }
  }

  const isValid = occupation && (citationType !== 'salary' || salary)

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          BLS Citation Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Citation Type */}
        <div>
          <Label className="text-xs">Citation Type</Label>
          <Select value={citationType} onValueChange={setCitationType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CITATION_TEMPLATES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Occupation Category */}
        <div>
          <Label className="text-xs">Occupation Category</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {BLS_CATEGORIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Occupation Name */}
        <div>
          <Label className="text-xs">Occupation Name *</Label>
          <Input
            placeholder="e.g., software developers"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        {/* Salary (conditional) */}
        {(citationType === 'salary' || citationType === 'combined') && (
          <div>
            <Label className="text-xs">Median Annual Salary *</Label>
            <Input
              placeholder="e.g., 120,730"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="text-sm mt-1"
            />
          </div>
        )}

        {/* Job Outlook (conditional) */}
        {(citationType === 'outlook' || citationType === 'combined') && (
          <>
            <div>
              <Label className="text-xs">Job Outlook</Label>
              <Select value={outlook} onValueChange={setOutlook}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grow">Grow</SelectItem>
                  <SelectItem value="decline">Decline</SelectItem>
                  <SelectItem value="show little or no change">Little/No Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Growth Rate (%)</Label>
              <Input
                placeholder="e.g., 15"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </>
        )}

        {/* Year */}
        <div>
          <Label className="text-xs">Data Year</Label>
          <Input
            placeholder="2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm mt-1"
          />
        </div>

        {/* BLS URL */}
        <div>
          <Label className="text-xs">BLS URL</Label>
          <div className="flex gap-1 mt-1">
            <Input
              placeholder="https://www.bls.gov/ooh/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-sm flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(url, '_blank')}
              className="px-2"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleInsert}
            disabled={!isValid}
            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Inserted!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Insert Citation
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!isValid}
          >
            Preview
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Citation will be added at cursor position or end of article
        </p>
      </CardContent>
    </Card>
  )
}

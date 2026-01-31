import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

const CONTRIBUTORS = [
  {
    name: "Tony Huffman",
    slug: "tony-huffman",
    title: "Online Education Pioneer & Enrollment Expert",
    bio: "Tony Huffman is a pioneer in online education and enrollment strategy, specializing in helping students find affordable, accredited degree programs that deliver real value.",
    expertise_areas: ["rankings", "enrollment strategy", "affordability", "cost comparison", "value analysis", "financial aid", "tuition", "best online programs", "top degree programs"]
  },
  {
    name: "Kayleigh Gilbert",
    slug: "kayleigh-gilbert",
    title: "Higher Education Consumer Advocate & Researcher",
    bio: "Kayleigh Gilbert is a consumer advocate and researcher focused on protecting students from diploma mills, accreditation issues, and predatory institutions.",
    expertise_areas: ["accreditation", "diploma mills", "consumer advocacy", "quality assurance", "legitimacy", "scam prevention", "fraud detection", "institutional quality"]
  },
  {
    name: "Dr. Julia Tell",
    slug: "dr-julia-tell",
    title: "Instructional Design & eLearning Specialist",
    bio: "Dr. Julia Tell is an expert in instructional design and eLearning pedagogy, helping institutions and students understand effective online course design and learning outcomes.",
    expertise_areas: ["instructional design", "elearning", "pedagogy", "course design", "curriculum development", "learning outcomes", "educational technology", "teaching methods"]
  },
  {
    name: "Christopher \"Kif\" Richmann",
    slug: "kif-richmann",
    title: "Digital Learning & Career Development Writer",
    bio: "Kif Richmann specializes in career development content, connecting online degree programs with real-world job outcomes, salary data, and career advancement opportunities.",
    expertise_areas: ["career development", "job outlook", "salary analysis", "employment trends", "career paths", "professional skills", "workforce development", "career transitions"]
  },
  {
    name: "Melanie Krol",
    slug: "melanie-krol",
    title: "Higher Education Strategist & Instructional Content Creator",
    bio: "Melanie Krol is a higher education strategist specializing in leadership, ministry education, and faith-based learning programs.",
    expertise_areas: ["leadership education", "ministry programs", "faith-based learning", "christian education", "educational leadership", "instructional strategy", "administration"]
  },
  {
    name: "Alicia Carrasco",
    slug: "alicia-carrasco",
    title: "Alternative Education & Transformational Learning Specialist",
    bio: "Alicia Carrasco focuses on alternative and non-traditional education pathways, including competency-based education, experiential learning, and adult education.",
    expertise_areas: ["alternative education", "non-traditional learning", "transformational learning", "experiential education", "adult education", "competency-based education", "life experience credit"]
  },
  {
    name: "Daniel Catena",
    slug: "daniel-catena",
    title: "Digital Learning Content Expert",
    bio: "Daniel Catena creates marketing-focused education content, connecting students with business, entrepreneurship, and digital communication degree programs.",
    expertise_areas: ["digital marketing", "content strategy", "business education", "entrepreneurship", "marketing programs", "communication", "seo", "digital media"]
  },
  {
    name: "Sarah Raines",
    slug: "sarah-raines",
    title: "Education Writer & Digital Learning Researcher",
    bio: "Sarah Raines researches and writes about accessibility in online education, ADA compliance, inclusive course design, and universal learning principles.",
    expertise_areas: ["accessibility", "ada compliance", "inclusive education", "universal design", "digital course creation", "educational content", "online course accessibility"]
  },
  {
    name: "Wei Luo",
    slug: "wei-luo",
    title: "Online Learning Content Specialist",
    bio: "Wei Luo is a content specialist covering general online learning trends, distance education programs, and emerging technologies in virtual education.",
    expertise_areas: ["online learning", "distance education", "degree programs", "educational trends", "virtual learning", "mooc", "technology in education", "general education topics"]
  }
];

export default function ContributorSetup() {
  const queryClient = useQueryClient();
  const [setupStatus, setSetupStatus] = useState({ completed: false, message: '' });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const createdContributors = [];
      
      for (const contributor of CONTRIBUTORS) {
        const created = await base44.entities.ArticleContributor.create({
          name: contributor.name,
          slug: contributor.slug,
          title: contributor.title,
          bio: contributor.bio,
          expertise_areas: contributor.expertise_areas,
          is_active: true,
          article_count: 0
        });
        createdContributors.push(created);
      }
      
      return createdContributors;
    },
    onSuccess: (contributors) => {
      queryClient.invalidateQueries({ queryKey: ['contributors'] });
      setSetupStatus({
        completed: true,
        message: `Successfully created ${contributors.length} contributors!`
      });
    },
    onError: (error) => {
      setSetupStatus({
        completed: false,
        message: `Setup failed: ${error.message}`
      });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contributor Setup</h1>
          <p className="text-gray-600 mt-1">Initialize GetEducated Editorial Team contributors</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>GetEducated Editorial Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {CONTRIBUTORS.map((contributor) => (
              <div key={contributor.slug} className="border-b pb-4 last:border-b-0">
                <h3 className="font-semibold text-gray-900">{contributor.name}</h3>
                <p className="text-sm text-blue-600">{contributor.title}</p>
                <p className="text-sm text-gray-600 mt-1">{contributor.bio}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {contributor.expertise_areas.slice(0, 5).map((area, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4">
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending || setupStatus.completed}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Contributors...
                  </>
                ) : setupStatus.completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Setup Complete
                  </>
                ) : (
                  'Create All Contributors'
                )}
              </Button>

              {setupStatus.message && (
                <p className={`text-sm mt-2 text-center ${setupStatus.completed ? 'text-green-600' : 'text-red-600'}`}>
                  {setupStatus.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
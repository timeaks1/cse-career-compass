import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Filter, Calendar, Building, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";

interface Experience {
  id: string;
  company_name: string;
  experience_type: string;
  assessment_type: string;
  candidate_name: string;
  graduating_year: number;
  branch: string;
  result: string;
  experience_description: string;
  additional_tips?: string;
  created_at: string;
  experience_images?: { image_url: string; image_name: string }[];
}

const ViewExperiences = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    experienceType: "",
    assessmentType: "",
    result: "",
    graduatingYear: "",
    branch: "",
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [experiences, searchQuery, filters]);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          experience_images (
            image_url,
            image_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error("Error fetching experiences:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = experiences;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter((exp) =>
        Object.values(exp).some((value) =>
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const fieldMap: { [key: string]: keyof Experience } = {
          company: "company_name",
          experienceType: "experience_type",
          assessmentType: "assessment_type",
          result: "result",
          graduatingYear: "graduating_year",
          branch: "branch",
        };

        const field = fieldMap[key];
        if (field) {
          filtered = filtered.filter((exp) => {
            const expValue = exp[field];
            if (key === "graduatingYear") {
              return expValue?.toString() === value;
            }
            return expValue?.toString().toLowerCase().includes(value.toLowerCase());
          });
        }
      }
    });

    setFilteredExperiences(filtered);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "Selected":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "Waitlisted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "Rejected":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getUniqueValues = (field: keyof Experience) => {
    return Array.from(new Set(experiences.map((exp) => exp[field]).filter(Boolean)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading experiences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            Browse Experiences
          </h1>
          <p className="text-xl text-muted-foreground">
            Learn from real student experiences across top companies
          </p>
        </div>

        {/* Search and Filters */}
        <GlassCard className="mb-8">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search experiences, companies, technologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select value={filters.company} onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Companies</SelectItem>
                  {getUniqueValues("company_name").map((company) => (
                    <SelectItem key={company as string} value={company as string}>
                      {company as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.experienceType} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Intern">Internship</SelectItem>
                  <SelectItem value="Placement">Placement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.assessmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, assessmentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Assessments</SelectItem>
                  <SelectItem value="Online Assessment">Online Assessment</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.result} onValueChange={(value) => setFilters(prev => ({ ...prev, result: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Results</SelectItem>
                  <SelectItem value="Selected">Selected</SelectItem>
                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.graduatingYear} onValueChange={(value) => setFilters(prev => ({ ...prev, graduatingYear: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {getUniqueValues("graduating_year").map((year) => (
                    <SelectItem key={year as number} value={year?.toString() || ""}>
                      {year as number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.branch} onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Branches</SelectItem>
                  {getUniqueValues("branch").map((branch) => (
                    <SelectItem key={branch as string} value={branch as string}>
                      {branch as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing {filteredExperiences.length} of {experiences.length} experiences
            </p>
            <Button asChild className="bg-gradient-primary hover:glow-primary">
              <Link to="/add-experience">Share Your Experience</Link>
            </Button>
          </div>

          {filteredExperiences.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No experiences found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              <Button asChild variant="outline">
                <Link to="/add-experience">Be the first to share</Link>
              </Button>
            </GlassCard>
          ) : (
            <div className="grid gap-6">
              {filteredExperiences.map((experience) => (
                <GlassCard key={experience.id} className="hover:glow-accent transition-all duration-300">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-primary" />
                          <h3 className="text-2xl font-bold text-primary">{experience.company_name}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{experience.experience_type}</Badge>
                          <Badge variant="outline">{experience.assessment_type}</Badge>
                          <Badge className={getResultColor(experience.result)}>
                            {experience.result}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {experience.candidate_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {experience.graduating_year} | {experience.branch}
                        </div>
                      </div>
                    </div>

                    {/* Experience Description */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Experience:</h4>
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {experience.experience_description}
                      </p>
                    </div>

                    {/* Additional Tips */}
                    {experience.additional_tips && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-accent flex items-center gap-2">
                          <Award className="h-4 w-4" /> Additional Tips:
                        </h4>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {experience.additional_tips}
                        </p>
                      </div>
                    )}

                    {/* Images */}
                    {experience.experience_images && experience.experience_images.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Attachments:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {experience.experience_images.map((image, index) => (
                            <img
                              key={index}
                              src={image.image_url}
                              alt={image.image_name || `Attachment ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border/50 hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(image.image_url, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="text-xs text-muted-foreground pt-4 border-t border-border/50">
                      Shared on {new Date(experience.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewExperiences;
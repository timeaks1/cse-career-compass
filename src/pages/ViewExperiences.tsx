// pages/ViewExperiences.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  Award,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";

interface Experience {
  id: string;
  company_name: string;
  experience_type: string; // e.g. 'intern' | 'placement'
  assessment_type: string; // e.g. 'online_assessment' | 'interview'
  candidate_name: string;
  graduating_year: number;
  branch: string;
  result: string; // e.g. 'selected' | 'waitlisted' | 'rejected'
  experience_description: string;
  additional_tips?: string;
  created_at: string;
  experience_images?: { image_url: string; image_name: string }[];
}

/** Helper mapping between DB values and readable labels */
const LABELS = {
  experience_type: {
    intern: "Internship",
    placement: "Placement",
  },
  assessment_type: {
    online_assessment: "Online Assessment",
    interview: "Interview",
  },
  result: {
    selected: "Selected",
    waitlisted: "Waitlisted",
    rejected: "Rejected",
  },
};

const ALL_VALUE = "__all"; // non-empty sentinel (Radix disallows empty string as item value)

const ViewExperiences: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    company: ALL_VALUE,
    experienceType: ALL_VALUE,
    assessmentType: ALL_VALUE,
    result: ALL_VALUE,
    graduatingYear: ALL_VALUE,
    branch: ALL_VALUE,
  });

  useEffect(() => {
    fetchExperiences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiences, searchQuery, filters]);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          * ,
          experience_images (
            image_url,
            image_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExperiences((data as Experience[]) || []);
    } catch (err) {
      console.error("Error fetching experiences:", err);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = experiences.slice();
    const q = searchQuery.trim().toLowerCase();

    // Search across selected textual fields
    if (q) {
      filtered = filtered.filter((exp) => {
        const fieldsToSearch = [
          exp.company_name,
          exp.candidate_name,
          exp.experience_description,
          exp.branch,
          exp.experience_type,
          exp.assessment_type,
          exp.result,
        ];
        return fieldsToSearch.some((val) => (val ?? "").toString().toLowerCase().includes(q));
      });
    }

    // Apply filters only if not ALL_VALUE
    if (filters.company !== ALL_VALUE) {
      filtered = filtered.filter((exp) => (exp.company_name ?? "").toString() === filters.company);
    }
    if (filters.experienceType !== ALL_VALUE) {
      filtered = filtered.filter((exp) => (exp.experience_type ?? "").toString() === filters.experienceType);
    }
    if (filters.assessmentType !== ALL_VALUE) {
      filtered = filtered.filter((exp) => (exp.assessment_type ?? "").toString() === filters.assessmentType);
    }
    if (filters.result !== ALL_VALUE) {
      filtered = filtered.filter((exp) => (exp.result ?? "").toString() === filters.result);
    }
    if (filters.graduatingYear !== ALL_VALUE) {
      filtered = filtered.filter((exp) => exp.graduating_year?.toString() === filters.graduatingYear);
    }
    if (filters.branch !== ALL_VALUE) {
      filtered = filtered.filter((exp) =>
        (exp.branch ?? "").toString().toLowerCase().includes(filters.branch.toLowerCase())
      );
    }

    setFilteredExperiences(filtered);
  };

  const getResultColor = (result: string) => {
    // Expect DB lowercase values
    switch (result) {
      case "selected":
        return "bg-green-500/20 text-green-400 border border-green-500/50";
      case "waitlisted":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getUniqueValues = (field: keyof Experience) => {
    const set = new Set<string>();
    experiences.forEach((exp) => {
      const v = exp[field];
      if (v !== undefined && v !== null && String(v).trim() !== "") set.add(String(v));
    });
    return Array.from(set).sort();
  };

  // sanitize + return markup for dangerouslySetInnerHTML
  const createSanitizedMarkup = (html?: string | null) => {
    if (!html) return { __html: "" };
    // Basic DOMPurify sanitize. You can pass options to DOMPurify if you want to restrict tags.
    return { __html: DOMPurify.sanitize(html) };
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
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">Browse Experiences</h1>
          <p className="text-xl text-muted-foreground">Learn from real student experiences across top companies</p>
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
              <Select
                value={filters.company}
                onValueChange={(value) => setFilters((p) => ({ ...p, company: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Companies</SelectItem>
                  {getUniqueValues("company_name").map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.experienceType}
                onValueChange={(value) => setFilters((p) => ({ ...p, experienceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Types</SelectItem>
                  <SelectItem value="intern">{LABELS.experience_type.intern}</SelectItem>
                  <SelectItem value="placement">{LABELS.experience_type.placement}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.assessmentType}
                onValueChange={(value) => setFilters((p) => ({ ...p, assessmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Assessments</SelectItem>
                  <SelectItem value="online_assessment">{LABELS.assessment_type.online_assessment}</SelectItem>
                  <SelectItem value="interview">{LABELS.assessment_type.interview}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.result}
                onValueChange={(value) => setFilters((p) => ({ ...p, result: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Results</SelectItem>
                  <SelectItem value="selected">{LABELS.result.selected}</SelectItem>
                  <SelectItem value="waitlisted">{LABELS.result.waitlisted}</SelectItem>
                  <SelectItem value="rejected">{LABELS.result.rejected}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.graduatingYear}
                onValueChange={(value) => setFilters((p) => ({ ...p, graduatingYear: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Years</SelectItem>
                  {getUniqueValues("graduating_year").map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.branch}
                onValueChange={(value) => setFilters((p) => ({ ...p, branch: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Branches</SelectItem>
                  {getUniqueValues("branch").map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
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
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
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
                          <Badge variant="outline">
                            {LABELS.experience_type[experience.experience_type as keyof typeof LABELS.experience_type] ??
                              experience.experience_type}
                          </Badge>
                          <Badge variant="outline">
                            {LABELS.assessment_type[experience.assessment_type as keyof typeof LABELS.assessment_type] ??
                              experience.assessment_type}
                          </Badge>
                          <Badge className={getResultColor(experience.result)}>
                            {LABELS.result[experience.result as keyof typeof LABELS.result] ?? experience.result}
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
                        {/* Edit button (public edit) */}
                        <div className="pt-2">
                          <Button asChild size="sm" variant="outline" className="flex items-center gap-2">
                            <Link to={`/edit-experience/${experience.id}`}>
                              <Edit2 className="h-4 w-4 inline" /> Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Experience Description */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">Experience:</h4>
                      <div
                        className="text-foreground/90 leading-relaxed prose max-w-none"
                        // sanitize HTML before rendering
                        dangerouslySetInnerHTML={createSanitizedMarkup(experience.experience_description)}
                      />
                    </div>

                    {/* Additional Tips */}
                    {experience.additional_tips && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-accent flex items-center gap-2">
                          <Award className="h-4 w-4" /> Additional Tips:
                        </h4>
                        <div
                          className="text-foreground/90 leading-relaxed prose max-w-none"
                          dangerouslySetInnerHTML={createSanitizedMarkup(experience.additional_tips)}
                        />
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
                              onClick={() => window.open(image.image_url, "_blank")}
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

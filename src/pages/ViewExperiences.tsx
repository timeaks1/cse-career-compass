// pages/ViewExperiences.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Filter, Calendar, Building, Users, Trophy, Eye, Edit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  user_id?: string;
  experience_images?: { image_url: string; image_name: string }[];
}

const ViewExperiences: React.FC = () => {
  const { user, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    company: "",
    experienceType: "",
    assessmentType: "",
    result: "",
    graduatingYear: "",
    branch: ""
  });

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select(`
          *,
          experience_images (
            image_url,
            image_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading experiences:', error);
        return;
      }

      setExperiences(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = searchTerm === "" || 
      exp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.experience_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (filters.company === "" || exp.company_name.toLowerCase().includes(filters.company.toLowerCase())) &&
      (filters.experienceType === "" || exp.experience_type === filters.experienceType) &&
      (filters.assessmentType === "" || exp.assessment_type === filters.assessmentType) &&
      (filters.result === "" || exp.result === filters.result) &&
      (filters.graduatingYear === "" || exp.graduating_year.toString() === filters.graduatingYear) &&
      (filters.branch === "" || exp.branch.toLowerCase().includes(filters.branch.toLowerCase()));

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/10">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-card border-b border-border/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="glass-card">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Browse Experiences</h1>
              {isAuthenticated && (
                <p className="text-sm text-muted-foreground">Signed in as {user?.email?.split('@')[0]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button asChild className="bg-gradient-primary">
                  <Link to="/add-experience">Share Experience</Link>
                </Button>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 glass-card"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Search and Filters */}
        <GlassCard>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search experiences, companies, or candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select value={filters.experienceType} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="intern">Internship</SelectItem>
                  <SelectItem value="placement">Placement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.assessmentType} onValueChange={(value) => setFilters(prev => ({ ...prev, assessmentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Assessments</SelectItem>
                  <SelectItem value="online_assessment">Online Assessment</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.result} onValueChange={(value) => setFilters(prev => ({ ...prev, result: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Results</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Company"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
              />

              <Input
                placeholder="Year"
                value={filters.graduatingYear}
                onChange={(e) => setFilters(prev => ({ ...prev, graduatingYear: e.target.value }))}
              />

              <Input
                placeholder="Branch"
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
              />
            </div>
          </div>
        </GlassCard>

        {/* Results */}
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Showing {filteredExperiences.length} of {experiences.length} experiences
          </p>

          {filteredExperiences.map((exp) => (
            <GlassCard key={exp.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold">{exp.company_name}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {exp.candidate_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {exp.graduating_year}
                      </span>
                      <span>{exp.branch}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exp.experience_type === 'intern' ? 'default' : 'secondary'}>
                      {exp.experience_type === 'intern' ? 'Internship' : 'Placement'}
                    </Badge>
                    <Badge variant={exp.assessment_type === 'online_assessment' ? 'outline' : 'default'}>
                      {exp.assessment_type === 'online_assessment' ? 'Online Assessment' : 'Interview'}
                    </Badge>
                    <Badge variant={
                      exp.result === 'selected' ? 'default' : 
                      exp.result === 'waitlisted' ? 'secondary' : 'destructive'
                    }>
                      {exp.result === 'selected' ? 'Selected' : 
                       exp.result === 'waitlisted' ? 'Waitlisted' : 'Rejected'}
                    </Badge>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none" 
                     dangerouslySetInnerHTML={{ __html: exp.experience_description }} />

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="glass-card">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {/* Show Edit button only for own experiences */}
                    {isAuthenticated && user?.id === exp.user_id && (
                      <Button variant="outline" size="sm" asChild className="glass-card">
                        <Link to={`/edit-experience/${exp.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}

          {filteredExperiences.length === 0 && (
            <GlassCard className="text-center py-12">
              <p className="text-muted-foreground mb-4">No experiences found matching your criteria</p>
              {isAuthenticated && (
                <Button asChild className="bg-gradient-primary">
                  <Link to="/add-experience">Share Your Experience</Link>
                </Button>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewExperiences;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AddExperience = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    companyName: "",
    experienceType: "",
    assessmentType: "",
    candidateName: "",
    graduatingYear: "",
    branch: "",
    result: "",
    experienceDescription: "",
    additionalTips: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert experience data
      const { data: experience, error: experienceError } = await supabase
        .from("experiences")
        .insert([
          {
            company_name: formData.companyName,
            experience_type: formData.experienceType,
            assessment_type: formData.assessmentType,
            candidate_name: formData.candidateName,
            graduating_year: parseInt(formData.graduatingYear),
            branch: formData.branch,
            result: formData.result,
            experience_description: formData.experienceDescription,
            additional_tips: formData.additionalTips || null,
          },
        ])
        .select()
        .single();

      if (experienceError) throw experienceError;

      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `${experience.id}/${Date.now()}_${image.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from("experience-images")
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data: publicUrl } = supabase.storage
            .from("experience-images")
            .getPublicUrl(fileName);

          // Insert image record
          const { error: imageError } = await supabase
            .from("experience_images")
            .insert([
              {
                experience_id: experience.id,
                image_url: publicUrl.publicUrl,
                image_name: image.name,
              },
            ]);

          if (imageError) throw imageError;
        }
      }

      toast({
        title: "Experience shared successfully!",
        description: "Thank you for contributing to the community.",
      });

      navigate("/view-experiences");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to share experience. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            Share Your Experience
          </h1>
          <p className="text-xl text-muted-foreground">
            Help fellow students by sharing your internship or placement journey
          </p>
        </div>

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google, Microsoft, Amazon"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="candidateName">Your Name *</Label>
                <Input
                  id="candidateName"
                  placeholder="Your full name"
                  value={formData.candidateName}
                  onChange={(e) => handleInputChange("candidateName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Experience Type *</Label>
                <Select value={formData.experienceType} onValueChange={(value) => handleInputChange("experienceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intern">Internship</SelectItem>
                    <SelectItem value="Placement">Placement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assessment Type *</Label>
                <Select value={formData.assessmentType} onValueChange={(value) => handleInputChange("assessmentType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online Assessment">Online Assessment</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduatingYear">Graduating Year *</Label>
                <Input
                  id="graduatingYear"
                  type="number"
                  placeholder="e.g., 2024"
                  value={formData.graduatingYear}
                  onChange={(e) => handleInputChange("graduatingYear", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input
                  id="branch"
                  placeholder="e.g., CSE, ECE, Mechanical"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Result *</Label>
                <Select value={formData.result} onValueChange={(value) => handleInputChange("result", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Selected">Selected</SelectItem>
                    <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceDescription">Experience Description *</Label>
              <Textarea
                id="experienceDescription"
                placeholder="Describe your experience in detail - the process, questions asked, difficulty level, etc."
                value={formData.experienceDescription}
                onChange={(e) => handleInputChange("experienceDescription", e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalTips">Additional Tips</Label>
              <Textarea
                id="additionalTips"
                placeholder="Any additional tips or advice for future candidates"
                value={formData.additionalTips}
                onChange={(e) => handleInputChange("additionalTips", e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <Label>Upload Images (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Click to upload screenshots, coding problems, or any relevant images
                  </p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="bg-gradient-primary hover:glow-primary"
              >
                {loading ? "Sharing..." : "Share Experience"}
                <Plus className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddExperience;
// pages/AddExperience.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RichTextEditor from "@/components/RichTextEditor";

type PreviewItem = { file: File; preview: string };

const ALLOWED_EXPERIENCE = ["intern", "placement"];
const ALLOWED_ASSESSMENT = ["online_assessment", "interview"];
const ALLOWED_RESULT = ["selected", "waitlisted", "rejected"];

const BUCKET = "experience-images";

const AddExperience: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<PreviewItem[]>([]);
  const [formData, setFormData] = useState({
    companyName: "",
    experienceType: "",
    assessmentType: "",
    candidateName: "",
    graduatingYear: "",
    branch: "",
    result: "",
    experienceDescription: "", // will contain HTML from RichTextEditor
    additionalTips: "" // HTML too
  });

  useEffect(() => {
    return () => {
      images.forEach((i) => URL.revokeObjectURL(i.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) return "Company name is required.";
    if (!formData.candidateName.trim()) return "Your name is required.";
    if (!formData.experienceType) return "Please select experience type.";
    if (!formData.assessmentType) return "Please select assessment type.";
    if (!formData.graduatingYear.trim()) return "Graduating year is required.";
    if (!formData.branch.trim()) return "Branch is required.";
    if (!formData.result) return "Please select result.";
    if (!formData.experienceDescription.trim()) return "Experience description is required.";

    const gy = parseInt(formData.graduatingYear, 10);
    if (Number.isNaN(gy) || gy < 1900 || gy > 2100) return "Please enter a valid graduating year.";

    if (!ALLOWED_EXPERIENCE.includes(formData.experienceType))
      return "Invalid experience type selected.";
    if (!ALLOWED_ASSESSMENT.includes(formData.assessmentType))
      return "Invalid assessment type selected.";
    if (!ALLOWED_RESULT.includes(formData.result)) return "Invalid result selected.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const errMsg = validateForm();
      if (errMsg) {
        toast({ title: "Validation error", description: errMsg, variant: "destructive" });
        setLoading(false);
        return;
      }

      const graduatingYear = parseInt(formData.graduatingYear, 10);

      const payload = {
        company_name: formData.companyName.trim(),
        experience_type: formData.experienceType,
        assessment_type: formData.assessmentType,
        candidate_name: formData.candidateName.trim(),
        graduating_year: graduatingYear,
        branch: formData.branch.trim(),
        result: formData.result,
        // store HTML from the editors
        experience_description: formData.experienceDescription.trim(),
        additional_tips: formData.additionalTips?.trim() || null
      };

      // 1) Insert main experience row and get the id
      const { data: experienceRow, error: experienceError } = await supabase
        .from("experiences")
        .insert([payload])
        .select()
        .single();

      if (experienceError || !experienceRow) {
        console.error("Experience insert error:", experienceError);
        toast({
          title: "Insert error",
          description:
            experienceError?.message ||
            "Failed to create experience row. Check console for details.",
          variant: "destructive"
        });
        throw experienceError ?? new Error("No experience row returned");
      }

      const experienceId = experienceRow.id;
      if (!experienceId) {
        console.error("No experience id returned:", experienceRow);
        throw new Error("No experience id returned from insert");
      }

      // 2) If images exist, upload each to storage and insert metadata row
      if (images.length > 0) {
        const storage = supabase.storage.from(BUCKET);

        for (const item of images) {
          const safeName = item.file.name.replace(/\s+/g, "_");
          const filePath = `${experienceId}/${Date.now()}_${safeName}`;

          const { data: uploadData, error: uploadError } = await storage.upload(filePath, item.file, {
            cacheControl: "3600",
            upsert: false
          });

          if (uploadError) {
            console.error("Upload error for", filePath, uploadError);
            toast({
              title: "Upload failed",
              description: uploadError.message || "Failed to upload an image.",
              variant: "destructive"
            });
            throw uploadError;
          }

          const publicUrlResponse = storage.getPublicUrl(filePath);
          // @ts-ignore
          const publicUrl = (publicUrlResponse as any)?.data?.publicUrl ?? (publicUrlResponse as any)?.data?.publicURL ?? "";

          if (!publicUrl) {
            console.error("No public URL for", filePath, publicUrlResponse);
            toast({
              title: "Public URL error",
              description: "Unable to get public URL for uploaded image.",
              variant: "destructive"
            });
            throw new Error("No public URL returned");
          }

          const { data: imageInsert, error: imageInsertError } = await supabase
            .from("experience_images")
            .insert([
              {
                experience_id: experienceId,
                image_url: publicUrl,
                image_name: item.file.name
              }
            ])
            .select()
            .single();

          if (imageInsertError) {
            console.error("Image metadata insert error:", imageInsertError);
            toast({
              title: "Image metadata save failed",
              description: imageInsertError.message || "Failed to save image record.",
              variant: "destructive"
            });
            throw imageInsertError;
          }

          try {
            URL.revokeObjectURL(item.preview);
          } catch {
            /* ignore */
          }
        }
      }

      toast({
        title: "Experience shared",
        description: "Thank you for contributing to the community."
      });

      navigate("/view-experiences");
    } catch (error: any) {
      console.error("Error in AddExperience.handleSubmit:", error);
      const message = error?.message ?? "Failed to share experience.";
      toast({ title: "Error", description: message, variant: "destructive" });
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
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">Share Your Experience</h1>
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
                <Select
                  value={formData.experienceType}
                  onValueChange={(value) => handleInputChange("experienceType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Internship</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assessment Type *</Label>
                <Select
                  value={formData.assessmentType}
                  onValueChange={(value) => handleInputChange("assessmentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online_assessment">Online Assessment</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
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
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceDescription">Experience Description *</Label>
              <RichTextEditor
                value={formData.experienceDescription}
                onChange={(html) => handleInputChange("experienceDescription", html)}
                placeholder="Describe your experience in detail - the process, questions asked, difficulty level, etc."
                resourceId={null} // will upload under 'anon' prefix in editor
                bucket={BUCKET}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalTips">Additional Tips</Label>
              <RichTextEditor
                value={formData.additionalTips}
                onChange={(html) => handleInputChange("additionalTips", html)}
                placeholder="Any additional tips or advice for future candidates"
                resourceId={null}
                bucket={BUCKET}
              />
            </div>

            {/* <div className="space-y-4">
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
                  {images.map((item, index) => (
                    <div key={index} className="relative">
                      <img
                        src={item.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={loading} size="lg" className="bg-gradient-primary hover:glow-primary">
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

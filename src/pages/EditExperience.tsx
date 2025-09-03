// pages/EditExperience.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import RichTextEditor from "@/components/RichTextEditor";

type ExperienceRow = {
  id: string;
  company_name: string;
  experience_type: string;
  assessment_type: string;
  candidate_name: string;
  graduating_year: number | null;
  branch: string | null;
  result: string;
  experience_description: string | null;
  additional_tips?: string | null;
  created_at: string;
  user_id?: string | null;
  experience_images?: { id?: string; image_url: string; image_name?: string }[];
};

const ALLOWED_EXPERIENCE = ["intern", "placement"];
const ALLOWED_ASSESSMENT = ["online_assessment", "interview"];
const ALLOWED_RESULT = ["selected", "waitlisted", "rejected"];
const BUCKET = "experience-images";

const EditExperience: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [experience, setExperience] = useState<ExperienceRow | null>(null);

  const [imagesPreview, setImagesPreview] = useState<
    { url: string; name?: string; isExisting?: boolean; file?: File }[]
  >([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    companyName: "",
    experienceType: "",
    assessmentType: "",
    candidateName: "",
    graduatingYear: "",
    branch: "",
    result: "",
    experienceDescription: "",
    additionalTips: ""
  });

  useEffect(() => {
    if (!id) return;
    loadExperience();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadExperience = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select(`*, experience_images ( id, image_url, image_name )`)
        .eq("id", id)
        .single();

      if (error) throw error;
      const row = data as ExperienceRow;
      
      // Check if the current user owns this experience
      if (!isAuthenticated || user?.id !== row.user_id) {
        toast({ title: "Access Denied", description: "You can only edit your own experiences", variant: "destructive" });
        navigate("/view-experiences");
        return;
      }
      
      setExperience(row);

      setFormData({
        companyName: row.company_name ?? "",
        experienceType: row.experience_type ?? "",
        assessmentType: row.assessment_type ?? "",
        candidateName: row.candidate_name ?? "",
        graduatingYear: row.graduating_year?.toString() ?? "",
        branch: row.branch ?? "",
        result: row.result ?? "",
        experienceDescription: row.experience_description ?? "",
        additionalTips: row.additional_tips ?? ""
      });

      const existing = (row.experience_images ?? []).map((img) => ({
        url: img.image_url,
        name: img.image_name,
        isExisting: true
      }));
      setImagesPreview(existing);
    } catch (err: any) {
      console.error("Failed to load experience:", err);
      toast({ title: "Load error", description: err?.message ?? "Failed to load experience", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const previews = files.map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name, isExisting: false }));
    setImagesPreview((p) => [...p, ...previews]);
    setNewImageFiles((p) => [...p, ...files]);
  };

  const removePreviewImage = (index: number) => {
    const item = imagesPreview[index];
    if (!item) return;

    if (!item.isExisting && item.file) {
      try {
        URL.revokeObjectURL(item.url);
      } catch {}
      setNewImageFiles((files) => files.filter((f) => f.name !== item.name));
    }

    setImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper: attempt to remove storage object by path (best-effort)
  const removeStorageObject = async (objectPath: string) => {
    if (!objectPath) return { success: false, error: new Error("empty path") };
    const { error } = await supabase.storage.from(BUCKET).remove([objectPath]);
    if (error) return { success: false, error };
    return { success: true };
  };

  // Extract objectPath from a public URL: returns path after bucket (e.g., "experienceId/somefile.png")
  const getObjectPathFromPublicUrl = (publicUrl: string): string | null => {
    try {
      const url = new URL(publicUrl);
      // typical Supabase public URL: /storage/v1/object/public/<bucket>/<path...>
      const parts = url.pathname.split("/").filter(Boolean);
      const bucketIndex = parts.findIndex((p) => p === BUCKET);
      if (bucketIndex >= 0) {
        const objectPath = parts.slice(bucketIndex + 1).join("/");
        return objectPath || null;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // Delete a single existing image: DB row + storage object (best-effort)
  const deleteExistingImage = async (imageUrl: string) => {
    if (!window.confirm("Delete this image permanently? This will remove the DB record and attempt to delete the file from storage.")) return;
    try {
      // 1) delete DB row referencing this URL
      const { error: delErr } = await supabase.from("experience_images").delete().eq("image_url", imageUrl);
      if (delErr) throw delErr;

      // 2) try to delete storage object using object path extracted from URL
      const objectPath = getObjectPathFromPublicUrl(imageUrl);
      if (objectPath) {
        const { success, error } = await removeStorageObject(objectPath);
        if (!success) {
          console.warn("Storage object removal reported error:", error);
        }
      } else {
        // fallback: list files under folder with experience id and try to match by filename
        try {
          const prefix = `${id}/`;
          const { data: listData, error: listErr } = await supabase.storage.from(BUCKET).list(prefix);
          if (listErr) {
            console.warn("Could not list storage folder for fallback deletion:", listErr);
          } else if (Array.isArray(listData)) {
            // try to find a matching file by comparing public url built from file names
            const candidates = listData.map((f: any) => `${prefix}${f.name}`);
            // attempt to delete candidates that produce the same public URL (best-effort)
            for (const candidatePath of candidates) {
              try {
                const { data: urlData } = await supabase.storage.from(BUCKET).getPublicUrl(candidatePath);
                // @ts-ignore
                const publicUrl = (urlData as any)?.publicUrl ?? (urlData as any)?.publicURL ?? "";
                if (publicUrl === imageUrl) {
                  await removeStorageObject(candidatePath);
                  break;
                }
              } catch (innerErr) {
                // ignore per-file errors
                console.warn("Error checking candidate path:", candidatePath, innerErr);
              }
            }
          }
        } catch (fallbackErr) {
          console.warn("Fallback deletion attempt failed:", fallbackErr);
        }
      }

      // update UI
      setImagesPreview((prev) => prev.filter((p) => p.url !== imageUrl));
      await loadExperience();
      toast({ title: "Deleted", description: "Image removed." });
    } catch (err: any) {
      console.error("Failed to delete image:", err);
      toast({ title: "Error", description: err?.message ?? "Failed to delete image", variant: "destructive" });
    }
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !experience) return;
    setSaving(true);

    try {
      const err = validateForm();
      if (err) {
        toast({ title: "Validation error", description: err, variant: "destructive" });
        setSaving(false);
        return;
      }

      // update the experiences row (same id)
      const payload = {
        company_name: formData.companyName.trim(),
        candidate_name: formData.candidateName.trim(),
        experience_type: formData.experienceType,
        assessment_type: formData.assessmentType,
        graduating_year: parseInt(formData.graduatingYear, 10) || null,
        branch: formData.branch.trim(),
        result: formData.result,
        experience_description: formData.experienceDescription.trim(),
        additional_tips: formData.additionalTips?.trim() || null
      };

      const { data: updatedRow, error: updateError } = await supabase
        .from("experiences")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Supabase update error:", updateError);
        toast({
          title: "Update failed",
          description: updateError.message || "Check console for details",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // upload any newly added images and insert rows into experience_images
      if (newImageFiles.length > 0) {
        const storage = supabase.storage.from(BUCKET);
        for (const file of newImageFiles) {
          const safeName = file.name.replace(/\s+/g, "_");
          const filePath = `${id}/${Date.now()}_${safeName}`;
          try {
            const { data: upData, error: upErr } = await storage.upload(filePath, file, { cacheControl: "3600", upsert: false });
            if (upErr) {
              console.warn("Image upload failed for", file.name, upErr);
              continue;
            }
            const { data: urlData } = await storage.getPublicUrl(filePath);
            // @ts-ignore
            const publicUrl = (urlData as any)?.publicUrl ?? (urlData as any)?.publicURL ?? "";
            if (!publicUrl) {
              console.warn("No public url for", filePath, urlData);
              continue;
            }
            const { error: imgInsertErr } = await supabase.from("experience_images").insert([
              {
                experience_id: id,
                image_url: publicUrl,
                image_name: file.name
              }
            ]);
            if (imgInsertErr) console.warn("Failed to insert experience_images for", file.name, imgInsertErr);
          } catch (ie) {
            console.error("Error uploading an image:", ie);
          }
        }
      }

      toast({ title: "Saved", description: "Experience updated successfully." });
      // go back to listing
      navigate("/view-experiences");
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Error", description: err?.message ?? "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete the entire experience (DB row + storage files + image rows)
  const handleDeleteExperience = async () => {
    if (!id || !experience) return;
    const confirmMsg = `Are you sure you want to permanently delete this experience for ${experience.company_name}? This will remove the record and all attached images. This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      // 1) get list of images for this experience
      const { data: imagesData, error: imagesErr } = await supabase
        .from("experience_images")
        .select("image_url")
        .eq("experience_id", id);

      if (imagesErr) {
        console.warn("Couldn't fetch experience_images before delete:", imagesErr);
      }

      // 2) attempt to delete storage objects for these images (best-effort)
      if (Array.isArray(imagesData) && imagesData.length > 0) {
        const toRemovePaths: string[] = [];
        for (const row of imagesData) {
          const imgUrl = (row as any).image_url as string;
          const objectPath = getObjectPathFromPublicUrl(imgUrl);
          if (objectPath) {
            toRemovePaths.push(objectPath);
          }
        }

        // If we have explicit paths, try to remove them in one call
        if (toRemovePaths.length > 0) {
          const { error: rmErr } = await supabase.storage.from(BUCKET).remove(toRemovePaths);
          if (rmErr) {
            console.warn("Some storage deletes failed:", rmErr);
          }
        } else {
          // Fallback: try to list the experience folder and remove everything under it
          try {
            const prefix = `${id}/`;
            const { data: listData, error: listErr } = await supabase.storage.from(BUCKET).list(prefix);
            if (listErr) {
              console.warn("Could not list storage folder for cleanup:", listErr);
            } else if (Array.isArray(listData) && listData.length > 0) {
              const allPaths = listData.map((f: any) => `${prefix}${f.name}`);
              const { error: rmAllErr } = await supabase.storage.from(BUCKET).remove(allPaths);
              if (rmAllErr) console.warn("Failed to remove some files during cleanup:", rmAllErr);
            }
          } catch (fallbackErr) {
            console.warn("Fallback cleanup failed:", fallbackErr);
          }
        }
      }

      // 3) delete image metadata rows
      const { error: delImgsErr } = await supabase.from("experience_images").delete().eq("experience_id", id);
      if (delImgsErr) {
        console.warn("Failed to delete experience_images rows:", delImgsErr);
      }

      // 4) delete the experience row
      const { error: delExpErr } = await supabase.from("experiences").delete().eq("id", id);
      if (delExpErr) throw delExpErr;

      toast({ title: "Deleted", description: "Experience and attachments removed." });
      navigate("/view-experiences");
    } catch (err: any) {
      console.error("Failed to delete experience:", err);
      toast({ title: "Error", description: err?.message ?? "Failed to delete experience", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Experience not found</h3>
          <p className="text-muted-foreground mb-4">It may have been removed.</p>
          <Button asChild>
            <Link to="/view-experiences">Back to Experiences</Link>
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-4">
              <Link to="/view-experiences">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Experiences
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">Edit Experience</h1>
            <p className="text-sm text-muted-foreground">Edit the fields below and save to update the same row.</p>
          </div>

          <div className="flex gap-2 items-center">
            <Button variant="destructive" onClick={handleDeleteExperience} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Experience"}
            </Button>
          </div>
        </div>

        <GlassCard>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => handleInputChange("companyName", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input value={formData.candidateName} onChange={(e) => handleInputChange("candidateName", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Experience Type</Label>
                <Select value={formData.experienceType} onValueChange={(v) => handleInputChange("experienceType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Internship</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assessment Type</Label>
                <Select value={formData.assessmentType} onValueChange={(v) => handleInputChange("assessmentType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online_assessment">Online Assessment</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Graduating Year</Label>
                <Input type="number" value={formData.graduatingYear} onChange={(e) => handleInputChange("graduatingYear", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={formData.branch} onChange={(e) => handleInputChange("branch", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Result</Label>
                <Select value={formData.result} onValueChange={(v) => handleInputChange("result", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selected">Selected</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Experience Description</Label>
              <RichTextEditor
                value={formData.experienceDescription}
                onChange={(html) => handleInputChange("experienceDescription", html)}
                placeholder="Describe the experience..."
                resourceId={id}
                bucket={BUCKET}
              />
            </div>

            <div>
              <Label>Additional Tips</Label>
              <RichTextEditor
                value={formData.additionalTips}
                onChange={(html) => handleInputChange("additionalTips", html)}
                placeholder="Any additional tips..."
                resourceId={id}
                bucket={BUCKET}
              />
            </div>

            {/* <div className="space-y-2">
              <Label>Attachments (add more)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input id="edit-image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleSelectFiles} />
                <label htmlFor="edit-image-upload" className="cursor-pointer inline-flex items-center gap-2">
                  <Upload className="h-5 w-5" /> <span className="text-sm text-muted-foreground">Upload images</span>
                </label>

                {imagesPreview.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {imagesPreview.map((it, idx) => (
                      <div key={it.url + idx} className="relative">
                        <img src={it.url} alt={it.name ?? `img-${idx}`} className="w-full h-28 object-cover rounded-lg" />
                        {!it.isExisting ? (
                          <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0" onClick={() => removePreviewImage(idx)} aria-label="Remove">
                            <X className="h-3 w-3" />
                          </Button>
                        ) : (
                          <div className="absolute -top-2 -right-2 flex gap-2">
                            <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => removePreviewImage(idx)} aria-label="Remove preview">
                              <X className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => deleteExistingImage(it.url)} aria-label="Delete permanently">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div> */}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => navigate("/view-experiences")}>Cancel</Button>
              <Button type="submit" disabled={saving} onClick={handleSave} className="bg-gradient-primary hover:glow-primary">
                {saving ? "Saving..." : "Save Changes"} <Plus className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default EditExperience;

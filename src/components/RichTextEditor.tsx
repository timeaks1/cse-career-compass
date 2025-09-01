// components/RichTextEditor.tsx
import React, { useRef, useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  resourceId?: string | number | null;
  bucket?: string;
};

const DEFAULT_BUCKET = "experience-images";

const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder, resourceId = null, bucket }) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const storageBucket = bucket ?? DEFAULT_BUCKET;

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          [{ align: [] }],
          ["clean"]
        ],
        handlers: {
          image: function () {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;

              try {
                const idPart = resourceId ?? "anon";
                const safeName = file.name.replace(/\s+/g, "_");
                const filePath = `${idPart}/${Date.now()}_${safeName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from(storageBucket)
                  .upload(filePath, file, { cacheControl: "3600", upsert: false });

                if (uploadError) {
                  console.error("Supabase upload error:", uploadError);
                  alert("Image upload failed. See console for details.");
                  return;
                }

                const { data: urlData } = await supabase.storage
                  .from(storageBucket)
                  .getPublicUrl(filePath);

                // different SDK versions use publicUrl or publicURL
                // safe-guard to pick whichever exists
                // @ts-ignore
                
                const publicUrl = urlData?.publicUrl ?? urlData?.publicURL ?? null;

                if (!publicUrl) {
                  console.error("No public URL available for", filePath, urlData);
                  alert("No public URL available for uploaded image.");
                  return;
                }

                const editor = quillRef.current?.getEditor();
                const range = editor?.getSelection(true);
                const index = range?.index ?? editor?.getLength() ?? 0;
                editor?.insertEmbed(index, "image", publicUrl);
                editor?.setSelection({ index: (index as number) + 1, length: 0 });
              } catch (err) {
                console.error("Image handler error", err);
                alert("Image upload error. See console.");
              }
            };
          }
        }
      }
    }),
    [resourceId, storageBucket]
  );

  return (
    <ReactQuill
      ref={(el) => (quillRef.current = el)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      modules={modules}
      theme="snow"
    />
  );
};

export default RichTextEditor;

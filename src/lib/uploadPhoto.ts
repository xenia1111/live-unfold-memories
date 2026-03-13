import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a photo (base64 data URL or File) to task-photos bucket.
 * Returns the public URL string.
 */
export async function uploadTaskPhoto(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("task-photos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("task-photos").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Convert a base64 data URL to a File object.
 */
export function dataUrlToFile(dataUrl: string, filename = "photo.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

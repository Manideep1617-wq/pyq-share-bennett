import { supabase } from "@/integrations/supabase/client";

export async function getPaperFileUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("papers").createSignedUrl(filePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

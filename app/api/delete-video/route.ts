import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { video_id } = await req.json();

    if (!video_id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the video (RLS will ensure the user can only delete their own)
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("id", video_id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting video:", deleteError);
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("Delete Video Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete video" }, { status: 500 });
  }
}

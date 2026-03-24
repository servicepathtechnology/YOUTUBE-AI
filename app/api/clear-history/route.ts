import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all videos for this user
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error clearing history:", deleteError);
      return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
    }

    return NextResponse.json({ message: "History cleared successfully" });
  } catch (error: any) {
    console.error("Clear History Error:", error);
    return NextResponse.json({ error: error.message || "Failed to clear history" }, { status: 500 });
  }
}

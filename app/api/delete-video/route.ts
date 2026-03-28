import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { video_id } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete chats first (foreign key constraint)
    await supabase.from('chats').delete().eq('video_id', video_id)

    // Delete the video (ensure it belongs to this user)
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', video_id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete Video Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

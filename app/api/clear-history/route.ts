import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all chats for this user's videos first (foreign key)
    const { data: videos } = await supabase
      .from('videos')
      .select('id')
      .eq('user_id', user.id)

    if (videos && videos.length > 0) {
      const videoIds = videos.map((v) => v.id)
      await supabase.from('chats').delete().in('video_id', videoIds)
    }

    // Delete all videos for this user
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Clear History Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

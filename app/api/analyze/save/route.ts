import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase.from('videos').insert({
      user_id: user.id,
      video_url: body.url,
      video_id: body.videoId,
      title: body.title,
      transcript: body.transcript,
      summary: body.summary,
      bullet_points: body.bulletPoints,
      podcast_audio_url: body.podcastAudioUrl
    }).select().single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ id: data.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'

import { execSync } from 'child_process'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([^"&?\/\s]{11})/)
    const videoId = videoIdMatch ? videoIdMatch[1] : null
    
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    let title = `YouTube Video ${videoId}`
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json()
        title = oembedData.title
      }
    } catch(e) {}

    let transcriptText = ""
    
    // Method 1: Use Robust Python scraper script
    try {
      console.log(`Trying Robust Python scraper for ${videoId}...`)
      let output = ""
      try {
        output = execSync(`python utils/scraper.py ${videoId}`, { encoding: 'utf8' })
      } catch (e) {
        console.log("python command failed, trying py...")
        output = execSync(`py utils/scraper.py ${videoId}`, { encoding: 'utf8' })
      }
      
      const data = JSON.parse(output)
      
      if (data.transcript) {
        transcriptText = data.transcript
        console.log(`Python scraper success! Length: ${transcriptText.length}`)
      } else if (data.error) {
        console.log(`Python scraper returned error: ${data.error}`)
      }
    } catch (pyError: any) {
      console.log(`Python scraper failed to execute: ${pyError.message}. Trying Node fallback...`)
      
      // Fallback to Method 2: Custom Node.js Scraper
      try {
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/'
          }
        })
        const html = await res.text()
        const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/) || html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/)
        
        if (match) {
          const playerResponse = JSON.parse(match[1])
          if (playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks
            const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0]
            const transRes = await fetch(track.baseUrl + "&fmt=json3")
            const transJson = await transRes.json()
            if (transJson.events) {
              transcriptText = transJson.events
                .filter((event: any) => event.segs)
                .map((event: any) => event.segs.map((seg: any) => seg.utf8).join(''))
                .join(' ')
            }
          }
        }
      } catch (nodeError: any) {
        console.error("Node fallback failed:", nodeError.message)
      }
    }

    if (!transcriptText || transcriptText.trim() === '') {
       return NextResponse.json({ error: 'No transcript available for this video. This often happens with YouTube Shorts or videos without speech. Please try a standard video with audio.' }, { status: 400 })
    }

    return NextResponse.json({ transcript: transcriptText, videoId, title })
  } catch (error: any) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 })
  }
}

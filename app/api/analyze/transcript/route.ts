import { NextResponse } from 'next/server'


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
    
    // Pure Node.js Scraper - Optimized for Vercel
    const attemptScrape = async (userAgent: string) => {
      console.log(`Trying Node scraper with UA: ${userAgent.substring(0, 30)}...`)
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      })
      
      if (!res.ok) throw new Error(`YouTube returned status ${res.status}`)
      
      const html = await res.text()
      
      // Look for player response in multiple locations
      const regexes = [
        /ytInitialPlayerResponse\s*=\s*({.+?});/,
        /var ytInitialPlayerResponse\s*=\s*({.+?});/,
        /window\["ytInitialPlayerResponse"\]\s*=\s*({.+?});/
      ]
      
      let playerResponse = null
      for (const regex of regexes) {
        const match = html.match(regex)
        if (match) {
          try {
            playerResponse = JSON.parse(match[1])
            break
          } catch (e) {}
        }
      }

      if (!playerResponse) {
        // Check if there's a script tag with the data
        const scriptMatch = html.match(/"playerResponse":({.+?}),"/)
        if (scriptMatch) {
            try {
                playerResponse = JSON.parse(scriptMatch[1])
            } catch (e) {}
        }
      }

      if (playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
        const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks
        // Prioritize English, then English auto-generated, then anything else
        const track = tracks.find((t: any) => t.languageCode === 'en' && !t.kind) || 
                      tracks.find((t: any) => t.languageCode === 'en') || 
                      tracks[0]
        
        console.log(`Found track: ${track.languageCode} (${track.kind || 'manual'})`)
        
        const transRes = await fetch(track.baseUrl + "&fmt=json3")
        const transJson = await transRes.json()
        
        if (transJson.events) {
          return transJson.events
            .filter((event: any) => event.segs)
            .map((event: any) => event.segs.map((seg: any) => seg.utf8).join(''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()
        }
      }
      return null
    }

    try {
      // Try with modern Desktop UA
      transcriptText = await attemptScrape('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36') || ""
      
      // Fallback to Mobile UA if first attempt failed
      if (!transcriptText) {
        console.log("Desktop scraper returned no text. Trying Mobile UA...")
        transcriptText = await attemptScrape('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1') || ""
      }
    } catch (error: any) {
      console.error("Node scraper error:", error.message)
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

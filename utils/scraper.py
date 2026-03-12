from youtube_transcript_api import YouTubeTranscriptApi
import json
import sys

def get_transcript(video_id):
    try:
        # Instantiate and fetch
        client = YouTubeTranscriptApi()
        # By default it tries 'en'
        data = client.fetch(video_id)
        
        # Join the text parts
        transcript_text = " ".join([item.text for item in data])
        
        # Return as JSON
        print(json.dumps({
            "transcript": transcript_text,
            "videoId": video_id
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_transcript(sys.argv[1])

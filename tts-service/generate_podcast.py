
import os
import uuid
import asyncio
import requests
from flask import Flask, request, send_file
from elevenlabs.client import ElevenLabs
import edge_tts
from gtts import gTTS

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError as e:
    print(f"Pydub not available: {e}")
    PYDUB_AVAILABLE = False

app = Flask(__name__)

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# Neural Indian English Voices for old-way fallback
SPEAKER_CONFIG = {
    "Host": {"voice": "en-IN-NeerjaNeural"},
    "Expert": {"voice": "en-IN-PrabhatNeural"}
}
DEFAULT_SPEAKER = "Host"
PAUSE_DURATION = 800  # 800ms pause for clearer speaker transition

MASTER_PROMPT = """
Convert the following content into a highly natural, human-like podcast voiceover script.

Strict Requirements:
- Use simple and clear Indian English
- Ensure smooth pronunciation (avoid complex words)
- Add natural pauses using commas, periods, and line breaks
- Keep sentences short (8–14 words max)
- Add breathing gaps between sentences
- Make flow conversational, not robotic
- Use a warm, friendly, and confident tone
- Slight storytelling style (engaging but professional)
- Avoid jargon and tongue-twisters
- Ensure every sentence is easy for TTS engines to speak clearly

Voice Style:
- Indian English accent
- Sweet, soft, and clear female voice preferred
- Calm, confident, and slightly inspirational tone
- Clean pronunciation with natural pauses

Output:
- Only the final voiceover script
- Properly spaced lines for narration
"""

def optimize_script(script, prompt):
    # In a real implementation, you would use a library like openai or gemini to interact with a large language model.
    # For now, we return the script as is.
    return script

async def generate_edge_tts_segment(text, voice, output_path):
    """Generates audio segment using edge-tts (neural voices)"""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def generate_podcast_old_way(script_text):
    """The fallback 'old way' using edge-tts and gTTS."""
    lines = script_text.split('\n')
    
    combined_audio = None
    if PYDUB_AVAILABLE:
        combined_audio = AudioSegment.empty()
        pause = AudioSegment.silent(duration=PAUSE_DURATION)
    
    temp_files = []
    
    # We need an event loop for edge-tts
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        speaker = DEFAULT_SPEAKER
        text_to_speak = line
        
        # Detect speaker
        if ":" in line:
            parts = line.split(":", 1)
            speaker_prefix = parts[0].strip()
            if speaker_prefix in SPEAKER_CONFIG:
                speaker = speaker_prefix
                text_to_speak = parts[1].strip()

        config = SPEAKER_CONFIG.get(speaker, SPEAKER_CONFIG[DEFAULT_SPEAKER])
        
        # Generate temporary segment
        temp_filename = f"seg_{uuid.uuid4()}.mp3"
        temp_path = os.path.join(os.getcwd(), temp_filename)
        temp_files.append(temp_path)
        
        try:
            # Try high-quality Neural TTS first
            loop.run_until_complete(generate_edge_tts_segment(text_to_speak, config['voice'], temp_path))
        except Exception as e:
            print(f"Neural TTS failed for line: {e}. Falling back to gTTS.")
            # Fallback to gTTS if edge-tts fails
            tts = gTTS(text=text_to_speak, lang='en', tld='co.in')
            tts.save(temp_path)
        
        # Load segment if pydub is available
        if PYDUB_AVAILABLE and combined_audio is not None:
            try:
                segment = AudioSegment.from_mp3(temp_path)
                combined_audio += segment + pause
            except Exception as e:
                print(f"Warning: pydub load failed: {e}")

    loop.close()

    if not temp_files:
        return None

    # Export final podcast
    final_filename = f"podcast_{uuid.uuid4()}.mp3"
    final_path = os.path.join(os.getcwd(), final_filename)
    
    export_success = False
    if PYDUB_AVAILABLE and combined_audio is not None and len(combined_audio) > 0:
        try:
            combined_audio.export(final_path, format="mp3")
            export_success = True
        except Exception as e:
            print(f"pydub export failed: {e}")

    # Fallback to binary concatenation
    if not export_success:
        print("Using binary concatenation fallback (standard merge).")
        with open(final_path, "wb") as f_out:
            for f in temp_files:
                with open(f, "rb") as f_in:
                    f_out.write(f_in.read())

    # Cleanup
    for f in temp_files:
        try: os.remove(f)
        except: pass
            
    return final_path

@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    """
    Endpoint to generate a podcast mp3 from a script using high-quality neural voices.
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {"error": "Missing text in request"}, 400

        script_text = data['text']
        optimized_script = optimize_script(script_text, MASTER_PROMPT)

        final_path = None
        try:
            # Step 1: Try ElevenLabs (High quality)
            print("Attempting ElevenLabs generation...")
            client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            audio_generator = client.generate(
                text=optimized_script,
                voice="Rachel",
                model="eleven_multilingual_v2"
            )
            
            # Since generate returns a generator of bytes, we need to collect them
            audio_data = b"".join(audio_generator)
            
            final_filename = f"podcast_{uuid.uuid4()}.mp3"
            final_path = os.path.join(os.getcwd(), final_filename)
            with open(final_path, 'wb') as f:
                f.write(audio_data)
            
            print("ElevenLabs generation successful.")

        except Exception as e:
            print(f"ElevenLabs failed or limit reached: {e}. Switching to old way (edge-tts/gTTS)...")
            # Step 2: Fallback to old way
            final_path = generate_podcast_old_way(script_text)

        if final_path and os.path.exists(final_path):
            return send_file(final_path, mimetype='audio/mpeg', as_attachment=True, download_name='podcast.mp3')
        else:
            return {"error": "Failed to generate podcast file"}, 500

    except Exception as e:
        print(f"Critical error: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    # Render uses the PORT environment variable
    port = int(os.environ.get("PORT", 5001))
    app.run(port=port, debug=False, host='0.0.0.0')

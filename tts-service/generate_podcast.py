import os
import io
import asyncio
import re
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

LANGUAGE_VOICES = {
    "en": {"Host": "en-IN-NeerjaNeural", "Expert": "en-IN-PrabhatNeural"},
    "te": {"Host": "te-IN-ShrutiNeural", "Expert": "te-IN-MohanNeural"},
    "hi": {"Host": "hi-IN-SwaraNeural",  "Expert": "hi-IN-MadhurNeural"},
}

DEFAULT_SPEAKER = "Host"
PAUSE_DURATION = 800  # ms


def clean_text(text):
    text = re.sub(r'[*_]{1,3}', '', text)
    text = re.sub(r'#+', '', text)
    text = text.replace('\\', '')
    text = re.sub(r'[`~>\[\]()]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


async def _edge_tts_to_bytes(text, voice, rate="+20%"):
    """Generate audio via edge-tts and return raw bytes (no disk I/O)."""
    buf = io.BytesIO()
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    return buf.read()


def generate_podcast_in_memory(script_text, lang='en'):
    """Build podcast audio fully in memory — no files written to disk."""
    lines = script_text.split('\n')
    voices = LANGUAGE_VOICES.get(lang, LANGUAGE_VOICES['en'])

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    if PYDUB_AVAILABLE:
        combined = AudioSegment.empty()
        pause = AudioSegment.silent(duration=PAUSE_DURATION)

        for line in lines:
            line = line.strip()
            if not line:
                continue

            speaker = DEFAULT_SPEAKER
            text_to_speak = line

            if ":" in line:
                parts = line.split(":", 1)
                prefix = clean_text(parts[0])
                if prefix in voices:
                    speaker = prefix
                    text_to_speak = parts[1].strip()

            text_to_speak = clean_text(text_to_speak)
            if not text_to_speak:
                continue

            voice = voices.get(speaker, voices[DEFAULT_SPEAKER])

            try:
                audio_bytes = loop.run_until_complete(_edge_tts_to_bytes(text_to_speak, voice))
                segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="mp3")
            except Exception as e:
                print(f"edge-tts failed: {e}. Falling back to gTTS.")
                gtts_buf = io.BytesIO()
                tts = gTTS(text=text_to_speak, lang=lang, tld='co.in' if lang == 'en' else None)
                tts.write_to_fp(gtts_buf)
                gtts_buf.seek(0)
                segment = AudioSegment.from_file(gtts_buf, format="mp3")

            combined += segment + pause

        loop.close()

        out = io.BytesIO()
        combined.export(out, format="mp3")
        out.seek(0)
        return out

    else:
        # pydub not available — binary concat into memory
        chunks = []
        for line in lines:
            line = line.strip()
            if not line:
                continue

            speaker = DEFAULT_SPEAKER
            text_to_speak = line

            if ":" in line:
                parts = line.split(":", 1)
                prefix = clean_text(parts[0])
                if prefix in voices:
                    speaker = prefix
                    text_to_speak = parts[1].strip()

            text_to_speak = clean_text(text_to_speak)
            if not text_to_speak:
                continue

            voice = voices.get(speaker, voices[DEFAULT_SPEAKER])

            try:
                audio_bytes = loop.run_until_complete(_edge_tts_to_bytes(text_to_speak, voice))
                chunks.append(audio_bytes)
            except Exception as e:
                print(f"edge-tts failed: {e}. Falling back to gTTS.")
                gtts_buf = io.BytesIO()
                tts = gTTS(text=text_to_speak, lang=lang, tld='co.in' if lang == 'en' else None)
                tts.write_to_fp(gtts_buf)
                chunks.append(gtts_buf.getvalue())

        loop.close()
        out = io.BytesIO(b"".join(chunks))
        out.seek(0)
        return out


@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {"error": "Missing text in request"}, 400

        script_text = data['text']
        lang = data.get('lang', 'en')
        cleaned_script = clean_text(script_text)

        audio_buf = None

        # Try ElevenLabs first (English only)
        if ELEVENLABS_API_KEY and lang == 'en':
            try:
                print("Attempting ElevenLabs generation...")
                client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
                audio_generator = client.generate(
                    text=cleaned_script,
                    voice="Rachel",
                    model="eleven_multilingual_v2"
                )
                audio_buf = io.BytesIO(b"".join(audio_generator))
                audio_buf.seek(0)
                print("ElevenLabs generation successful.")
            except Exception as e:
                print(f"ElevenLabs failed: {e}. Falling back to edge-tts/gTTS...")
                audio_buf = None

        if audio_buf is None:
            audio_buf = generate_podcast_in_memory(script_text, lang=lang)

        if audio_buf is None:
            return {"error": "Failed to generate podcast audio"}, 500

        return send_file(audio_buf, mimetype='audio/mpeg', as_attachment=True, download_name='podcast.mp3')

    except Exception as e:
        print(f"Critical error: {e}")
        return {"error": str(e)}, 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(port=port, debug=False, host='0.0.0.0')

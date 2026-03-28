from flask import Flask, request, send_file
import os
import re
import uuid
import asyncio
import edge_tts

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError as e:
    print(f"Pydub not available: {e}")
    PYDUB_AVAILABLE = False

app = Flask(__name__)

# Voice config per language
# Each language has Host (female) and Expert (male)
VOICE_CONFIG = {
    "en": {
        "Host":   {"voice": "en-IN-NeerjaNeural",  "rate": "-5%",  "pitch": "+2Hz"},
        "Expert": {"voice": "en-IN-PrabhatNeural", "rate": "-3%",  "pitch": "-3Hz"},
    },
    "te": {
        "Host":   {"voice": "te-IN-ShrutiNeural",  "rate": "-5%",  "pitch": "+2Hz"},
        "Expert": {"voice": "te-IN-MohanNeural",   "rate": "-3%",  "pitch": "-3Hz"},
    },
    "hi": {
        "Host":   {"voice": "hi-IN-SwaraNeural",   "rate": "-5%",  "pitch": "+2Hz"},
        "Expert": {"voice": "hi-IN-MadhurNeural",  "rate": "-3%",  "pitch": "-3Hz"},
    },
}

DEFAULT_LANG     = "en"
DEFAULT_SPEAKER  = "Host"
PAUSE_BETWEEN_TURNS = 650
PAUSE_WITHIN_TURN   = 200

# Patterns to strip from script before TTS
JUNK_PATTERNS = [
    r"\*[^*]*\*",           # *stage directions* or *emphasis*
    r"\[[^\]]*\]",          # [laughs], [pause], [music], etc.
    r"\([^)]*\)",           # (laughs), (pause), etc.
    r"#+\s*",               # markdown headers
    r"_{1,3}[^_]*_{1,3}",  # _italic_ or __bold__
    r"ashtaros|asterisks?", # literal word artifacts
]
JUNK_RE = re.compile("|".join(JUNK_PATTERNS), re.IGNORECASE)


def clean_line(text: str) -> str:
    """Remove all junk patterns and extra whitespace from a line."""
    text = JUNK_RE.sub("", text)
    text = re.sub(r"\s{2,}", " ", text).strip()
    return text


async def generate_segment(text: str, voice: str, rate: str, pitch: str, output_path: str):
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(output_path)


@app.route("/", methods=["GET", "POST"])
def health():
    return {"status": "ok", "languages": list(VOICE_CONFIG.keys())}


@app.route("/generate-podcast", methods=["POST"])
def generate_podcast():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return {"error": "Missing 'text' in request body"}, 400

        script_text = data["text"]
        lang = data.get("lang", DEFAULT_LANG).lower()

        # Fallback to English if language not supported
        voices = VOICE_CONFIG.get(lang, VOICE_CONFIG[DEFAULT_LANG])

        lines = [l.strip() for l in script_text.split("\n") if l.strip()]
        if not lines:
            return {"error": "No valid lines in script"}, 400

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        temp_files = []
        segments = []
        prev_speaker = None

        for line in lines:
            speaker = DEFAULT_SPEAKER
            text_to_speak = line

            if ":" in line:
                parts = line.split(":", 1)
                candidate = parts[0].strip()
                if candidate in voices:
                    speaker = candidate
                    text_to_speak = parts[1].strip()

            # Clean junk from the text
            text_to_speak = clean_line(text_to_speak)
            if not text_to_speak:
                continue

            cfg = voices[speaker]
            temp_path = os.path.join(os.getcwd(), f"seg_{uuid.uuid4()}.mp3")
            temp_files.append(temp_path)

            try:
                loop.run_until_complete(
                    generate_segment(text_to_speak, cfg["voice"], cfg["rate"], cfg["pitch"], temp_path)
                )
                is_turn_change = (prev_speaker is not None and speaker != prev_speaker)
                segments.append((temp_path, is_turn_change))
                prev_speaker = speaker
            except Exception as e:
                print(f"edge-tts failed for '{text_to_speak[:40]}': {e}")
                temp_files.pop()

        loop.close()

        if not segments:
            return {"error": "No audio segments generated"}, 500

        final_filename = f"podcast_{uuid.uuid4()}.mp3"
        final_path = os.path.join(os.getcwd(), final_filename)

        if PYDUB_AVAILABLE:
            combined = AudioSegment.empty()
            turn_pause   = AudioSegment.silent(duration=PAUSE_BETWEEN_TURNS)
            within_pause = AudioSegment.silent(duration=PAUSE_WITHIN_TURN)

            for i, (path, is_turn_change) in enumerate(segments):
                try:
                    seg = AudioSegment.from_mp3(path)
                    if i > 0:
                        combined += turn_pause if is_turn_change else within_pause
                    combined += seg
                except Exception as e:
                    print(f"pydub load failed: {e}")

            try:
                combined.export(final_path, format="mp3", bitrate="128k")
            except Exception as e:
                print(f"pydub export failed: {e}")
                _binary_concat([p for p, _ in segments], final_path)
        else:
            _binary_concat([p for p, _ in segments], final_path)

        for f in temp_files:
            try:
                os.remove(f)
            except Exception:
                pass

        if os.path.exists(final_path):
            return send_file(final_path, mimetype="audio/mpeg", as_attachment=True, download_name="podcast.mp3")
        else:
            return {"error": "Failed to produce final podcast file"}, 500

    except Exception as e:
        print(f"Critical error: {e}")
        return {"error": str(e)}, 500


def _binary_concat(file_paths: list, output_path: str):
    with open(output_path, "wb") as out:
        for fp in file_paths:
            try:
                with open(fp, "rb") as f:
                    out.write(f.read())
            except Exception:
                pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Neural TTS Service on port {port}")
    app.run(port=port, debug=False, host="0.0.0.0")

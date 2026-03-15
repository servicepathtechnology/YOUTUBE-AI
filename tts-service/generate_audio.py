from flask import Flask, request, send_file
from gtts import gTTS
import os
import uuid
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError as e:
    print(f"Pydub not available (likely due to Python 3.13+ audioop removal): {e}")
    PYDUB_AVAILABLE = False

app = Flask(__name__)

# Speaker Configuration
# Teacher -> Indian accent (co.in) 
# Student -> Australian accent (com.au)
SPEAKER_CONFIG = {
    "Teacher": {"tld": "co.in"},
    "Student": {"tld": "com.au"}
}
DEFAULT_SPEAKER = "Teacher"
PAUSE_DURATION = 500  # 500ms pause

@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    """
    Endpoint to generate a podcast mp3 from a script.
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {"error": "Missing text in request"}, 400
        
        script_text = data['text']
        lines = script_text.split('\n')
        
        combined_audio = None
        if PYDUB_AVAILABLE:
            combined_audio = AudioSegment.empty()
            pause = AudioSegment.silent(duration=PAUSE_DURATION)
        
        temp_files = []
        
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
            
            tts = gTTS(text=text_to_speak, lang='en', tld=config['tld'])
            tts.save(temp_path)
            
            # Load segment if pydub is available
            if PYDUB_AVAILABLE and combined_audio is not None:
                try:
                    segment = AudioSegment.from_mp3(temp_path)
                    combined_audio += segment + pause
                except Exception as e:
                    print(f"Warning: pydub load failed: {e}")

        if not temp_files:
            return {"error": "No valid text lines found"}, 400

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
                
        if os.path.exists(final_path):
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

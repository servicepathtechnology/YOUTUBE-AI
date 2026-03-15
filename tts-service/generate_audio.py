from flask import Flask, request, send_file
from gtts import gTTS
import os
import uuid
from pydub import AudioSegment

app = Flask(__name__)

# Speaker Configuration
# Teacher -> Indian accent (co.in) - Using 'variety' option for more distinct voices
# Student -> Australian accent (com.au) - Using 'variety' option for more distinct voices
# Alternative (Standard):
# Teacher -> US accent (tld="com")
# Student -> UK accent (tld="co.uk")
SPEAKER_CONFIG = {
    "Teacher": {"tld": "co.in"},
    "Student": {"tld": "com.au"}
}
DEFAULT_SPEAKER = "Teacher"
PAUSE_DURATION = 500  # 500ms pause between speakers

@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    """
    Endpoint to generate a podcast mp3 from a script.
    Expects JSON: {"text": "Teacher: line1\nStudent: line2"}
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {"error": "Missing text in request"}, 400
        
        script_text = data['text']
        lines = script_text.split('\n')
        
        combined_audio = AudioSegment.empty()
        pause = AudioSegment.silent(duration=PAUSE_DURATION)
        
        temp_files = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            speaker = DEFAULT_SPEAKER
            text_to_speak = line
            
            # Detect speaker using "Speaker: text" format
            if ":" in line:
                parts = line.split(":", 1)
                speaker_prefix = parts[0].strip()
                if speaker_prefix in SPEAKER_CONFIG:
                    speaker = speaker_prefix
                    text_to_speak = parts[1].strip()
                else:
                    # If label is unknown, use default accent but keep line as is
                    speaker = DEFAULT_SPEAKER
                    text_to_speak = line
            else:
                # No speaker label found, use default accent
                speaker = DEFAULT_SPEAKER
                text_to_speak = line

            # Get accent configuration
            config = SPEAKER_CONFIG.get(speaker, SPEAKER_CONFIG[DEFAULT_SPEAKER])
            
            # Generate temporary segment
            temp_filename = f"seg_{uuid.uuid4()}.mp3"
            temp_path = os.path.join(os.getcwd(), temp_filename)
            temp_files.append(temp_path)
            
            print(f"Generating audio for {speaker} using TLD: {config['tld']}")
            tts = gTTS(text=text_to_speak, lang='en', tld=config['tld'])
            tts.save(temp_path)
            
            # Load segment and append to master audio
            try:
                segment = AudioSegment.from_mp3(temp_path)
                combined_audio += segment + pause
            except Exception as e:
                print(f"Warning: pydub could not load segment {temp_path}. Error: {e}")

        if not temp_files:
            return {"error": "No valid text lines found in script"}, 400

        # Final podcast output
        # Using a UUID in filename to avoid concurrent request issues, but return as podcast.mp3 download
        final_filename = f"podcast_{uuid.uuid4()}.mp3"
        final_path = os.path.join(os.getcwd(), final_filename)
        
        export_success = False
        if len(combined_audio) > 0:
            try:
                combined_audio.export(final_path, format="mp3")
                export_success = True
            except Exception as e:
                print(f"Error exporting with pydub: {e}")

        # Fallback to binary concatenation if pydub/ffmpeg fails
        if not export_success:
            print("Falling back to binary concatenation fallback.")
            with open(final_path, "wb") as f_out:
                for f in temp_files:
                    with open(f, "rb") as f_in:
                        f_out.write(f_in.read())

        # Cleanup temporary segments
        for f in temp_files:
            try:
                os.remove(f)
            except:
                pass
                
        # Return the final mp3 file, renaming it to podcast.mp3 for the browser/client
        if os.path.exists(final_path):
            return send_file(final_path, mimetype='audio/mpeg', as_attachment=True, download_name='podcast.mp3')
        else:
            return {"error": "Failed to generate podcast file"}, 500
        
    except Exception as e:
        print(f"Critical error: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(port=5001, debug=True, host='0.0.0.0')

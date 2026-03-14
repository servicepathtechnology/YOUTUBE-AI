from flask import Flask, request, send_file
from gtts import gTTS
import os
import uuid
import re
from pydub import AudioSegment

app = Flask(__name__)

# Speaker configuration
# Using the "Optional Improvements" for variety:
# Host -> Indian accent (co.in)
# Expert -> Australian accent (com.au)
SPEAKER_CONFIG = {
    "Host": {"tld": "co.in"},
    "Expert": {"tld": "com.au"}
}
DEFAULT_TLD = "co.in"

@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return {"error": "Missing text in request"}, 400
        
        script_text = data['text']
        
        # Split script into lines and process
        lines = script_text.split('\n')
        combined_audio = AudioSegment.empty()
        pause = AudioSegment.silent(duration=500) # 500ms pause
        
        temp_files = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            speaker = "Teacher"
            text_to_speak = line
            
            # Detect speaker
            if line.startswith("Host:"):
                speaker = "Host"
                text_to_speak = line.replace("Host:", "").strip()
            elif line.startswith("Expert:"):
                speaker = "Expert"
                text_to_speak = line.replace("Expert:", "").strip()
            elif line.startswith("Teacher:"): # Legacy support
                speaker = "Host"
                text_to_speak = line.replace("Teacher:", "").strip()
            elif line.startswith("Student:"): # Legacy support
                speaker = "Expert"
                text_to_speak = line.replace("Student:", "").strip()
            # If no label, default to Host (already set)
            # Get TLD for accent
            config = SPEAKER_CONFIG.get(speaker, {"tld": DEFAULT_TLD})
            
            # Generate temporary segment
            temp_filename = f"seg_{uuid.uuid4()}.mp3"
            temp_path = os.path.join(os.getcwd(), temp_filename)
            temp_files.append(temp_path)
            
            # Use gTTS with the specific TLD
            tts = gTTS(text=text_to_speak, lang='en', tld=config['tld'])
            tts.save(temp_path)
            
            # Try to build with pydub if possible
            try:
                segment = AudioSegment.from_mp3(temp_path)
                combined_audio += segment + pause
            except Exception as e:
                # If loading fails (no ffmpeg), the combined_audio will stay empty
                # We will handle the fallback merge later
                print(f"Failed to load segment with pydub: {e}")

        # Final podcast output
        final_filename = f"podcast_{uuid.uuid4()}.mp3"
        final_path = os.path.join(os.getcwd(), final_filename)
        
        # Robust Merging Logic
        processed_with_pydub = False
        if len(combined_audio) > 0:
            try:
                combined_audio.export(final_path, format="mp3")
                processed_with_pydub = True
            except Exception as e:
                print(f"Export failed even with segments loaded: {e}")

        if not processed_with_pydub:
            # Fallback: Binary Concatenation (Basic: no pauses, but works without ffmpeg)
            print("Using binary concatenation fallback.")
            with open(final_path, "wb") as f_out:
                for f in temp_files:
                    with open(f, "rb") as f_in:
                        f_out.write(f_in.read())

        # Cleanup segments
        for f in temp_files:
            try:
                os.remove(f)
            except:
                pass
                
        # Return the final mp3 file
        if os.path.exists(final_path):
            return send_file(final_path, mimetype='audio/mpeg')
        else:
            raise Exception("Failed to create final podcast file")
        
    except Exception as e:
        print(f"Error generating podcast: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    # Run on port 5001 as per Step 3
    app.run(port=5001, debug=False)

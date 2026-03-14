from gtts import gTTS
import os

t1 = gTTS("Hello", lang="en", tld="com")
t1.save("1.mp3")
t2 = gTTS("World", lang="en", tld="co.uk")
t2.save("2.mp3")

with open("combined.mp3", "wb") as f_out:
    for f in ["1.mp3", "2.mp3"]:
        with open(f, "rb") as f_in:
            f_out.write(f_in.read())

print("Created combined.mp3")
# You can't "play" it here but you can check size
print(f"Size: {os.path.getsize('combined.mp3')}")

from gtts import gTTS
import os

def generate_voiceover(text, filename="voice.mp3"):
    tts = gTTS(text)
    tts.save(filename)

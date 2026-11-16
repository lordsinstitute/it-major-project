import moviepy.editor as mpy
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np

def extract_story_from_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()

def create_caption_images(story, video_width, words_per_caption=5):
    words = story.split()
    caption_segments = [' '.join(words[i:i + words_per_caption]) for i in range(0, len(words), words_per_caption)]
    caption_images = []

    font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    if not os.path.exists(font_path):
        font_path = "arial.ttf"  # Fallback for Windows
    font = ImageFont.truetype(font_path, 40)

    for segment in caption_segments:
        img = Image.new('RGBA', (video_width, 100), (0, 0, 0, 100))
        d = ImageDraw.Draw(img)
        text_width, text_height = d.textsize(segment, font=font)
        d.text(((video_width - text_width) // 2, (100 - text_height) // 2), segment, fill=(255, 255, 255, 255), font=font)
        caption_images.append(np.array(img))

    return caption_images

def add_captions_to_video(video_path, caption_images, output_path):
    try:
        video_clip = mpy.VideoFileClip(video_path)
    except Exception as e:
        print(f"Error loading video: {e}")
        return

    duration_per_caption = video_clip.duration / len(caption_images)
    caption_clips = [
        mpy.ImageClip(img).set_duration(duration_per_caption).set_position(('center', 'bottom'))
        for img in caption_images
    ]

    final_clip = mpy.CompositeVideoClip([video_clip] + caption_clips)
    final_clip.write_videofile(output_path, codec="libx264", fps=video_clip.fps)

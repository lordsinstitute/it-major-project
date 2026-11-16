
from transformers import pipeline

def generate_story(prompt):
    generator = pipeline('text-generation', model='gpt2')
    story = generator(prompt, max_length=200, num_return_sequences=1)[0]['generated_text']
    return story

def save_story(story, filename="story.txt"):
    with open(filename, "w") as file:
        file.write(story)



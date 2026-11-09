import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
import re


#Advanced NLP usage. (Requires more refined logic)
def generate_comments_advanced(code_snippet):
  lines = code_snippet.split('\n')
  commented_lines = []
  for line in lines:
    line = line.strip()
    comment = ""

    if not line:
      commented_lines.append("")
      continue

    if "=" in line and not line.startswith("def") and not line.startswith("class"):
      variable_name = line.split("=")[0].strip()
      value = line.split("=")[1].strip()
      #Basic NLP to understand the value type.
      if value.isdigit():
          comment = f"# Variable: {variable_name} - Assigns the integer value {value}."
      elif value.replace('.','',1).isdigit():
          comment = f"# Variable: {variable_name} - Assigns the float value {value}."
      elif value.startswith('"') or value.startswith("'"):
          comment = f"# Variable: {variable_name} - Assigns the string value {value}."
      else:
          comment = f"# Variable: {variable_name} - [Describe variable purpose here]"

    else:
      comment = generate_basic_comment(line)
    if comment:
      commented_lines.append(f"{comment}\n{line}")
    else:
      commented_lines.append(line)
  return "\n".join(commented_lines)

def generate_basic_comment(line):
  #This is very basic and would need improvement.
  tokens = word_tokenize(line)
  tagged = pos_tag(tokens)
  comment = ""
  if len(tagged) > 1:
      if tagged[0][1].startswith('VB'): #Verb
          comment = "# Action: " + " ".join([word for word, tag in tagged if tag.startswith('VB')])
      elif tagged[0][1].startswith('NN'): #Noun
          comment = "# Data: " + " ".join([word for word, tag in tagged if tag.startswith('NN')])
  return comment

def getName(data):
  name = ""
  arr = data.split("\n")
  for i in range(len(arr)):
    values = arr[i]
    if "class" in values:
      values = values.split(" ")
      for k in range(len(values)):
        if values[k] == "class":
          name = values[k+1]
      break           
  return name



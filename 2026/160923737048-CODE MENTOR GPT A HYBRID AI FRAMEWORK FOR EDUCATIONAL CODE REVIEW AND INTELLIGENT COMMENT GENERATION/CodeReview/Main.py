#=================flask code starts here
from flask import Flask, render_template, request, redirect, url_for, session,send_from_directory
import pandas as pd #pandas to read and explore dataset
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer
from datasets import Dataset
import torch
import PythonComment
import os

app = Flask(__name__)
app.secret_key = 'welcome'
# Loading and initalizing GPT-4o tokenizer and model
gpt_tokenizer = AutoTokenizer.from_pretrained("model/gpt-4o")
gpt_model = AutoModelForCausalLM.from_pretrained("model/gpt-4o")
gpt_tokenizer.pad_token = gpt_tokenizer.eos_token # Or choose another appropriate token
print("GPT Model Loaded")

#function to generate review from given test code
def generateReview(test_code_file):
    with open(test_code_file, "rb") as file:
        code = file.read()
    file.close()
    code = code.decode()
    prompt = code+'<|endoftext|>Comment:'
    inputs = gpt_tokenizer(prompt, return_tensors="pt", truncation=True, padding=True, max_length=1024)#generate tokens
    with torch.no_grad():
        #apply GPT model to predict code review
        outputs = gpt_model.generate(inputs.input_ids, max_length=1024, num_return_sequences=1, temperature=0.7, do_sample=True,
                                            pad_token_id=gpt_tokenizer.eos_token_id)
        review = gpt_tokenizer.decode(outputs[0], skip_special_tokens=True)
    return code, review

#function to generate automatic comments
def generateComment(file_path):
    with open(file_path, "rb") as file:
        data = file.read()
    file.close()
    data = data.decode()
    comments = PythonComment.generate_comments_advanced(data)
    return comments


@app.route('/Predict', methods=['GET', 'POST'])
def predictView():
    return render_template('Predict.html', msg='')

@app.route('/index', methods=['GET', 'POST'])
def index():
    return render_template('index.html', msg='')

@app.route('/UserLogin', methods=['GET', 'POST'])
def UserLogin():
    return render_template('UserLogin.html', msg='')

@app.route('/UserLoginAction', methods=['GET', 'POST'])
def UserLoginAction():
    if request.method == 'POST' and 't1' in request.form and 't2' in request.form:
        user = request.form['t1']
        password = request.form['t2']
        if user == "admin" and password == "admin":
            return render_template('UserScreen.html', msg="<font size=3 color=blue>Welcome "+user+"</font>")
        else:
            return render_template('UserLogin.html', msg="<font size=3 color=red>Invalid login details</font>")

@app.route('/Logout')
def Logout():
    return render_template('index.html', msg='')

@app.route('/PredictAction', methods=['GET', 'POST'])
def PredictAction():
    if request.method == 'POST':
        file = request.files['t1']
        data = file.read()
        if os.path.exists("static/test.txt"):
            os.remove("static/test.txt")
        with open("static/test.txt", "wb") as file:
            file.write(data)
        file.close()    
        code, review = generateReview("static/test.txt")
        extension_auto_comments = generateComment("static/test.txt")
        output='<table border=1 align=center width=100%><tr><th><font size="3" color="black">Input Submitted Code</th><th><font size="3" color="black">Propose GPT-4o Generated Review Comment</th>'
        output+='<th><font size="3" color="black">Extension AI Auto Generated Comments</th></tr>'
        output+='<td><font size="3" color="black">'+str(code)+'</td><td><font size="3" color="black">'+str(review)+'</td><td><font size="3" color="black">'+str(extension_auto_comments)+'</td></tr>'
        output+= "</table></br></br></br></br>"
        return render_template('UserScreen.html', msg=output)

if __name__ == '__main__':
    app.run()    

from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
import os
from django.core.files.storage import FileSystemStorage
import pymysql
import pickle
import os
from datetime import date
import MCQ
from sklearn.feature_extraction.text import TfidfVectorizer #loading tfidf vector
from numpy import dot
from numpy.linalg import norm

global username

def EvaluateMCQ(request):
    if request.method == 'GET':
        return render(request, 'UploadMCQ.html', {})

def EvaluateMCQAction(request):
    if request.method == 'POST':
        global username
        myfile = request.FILES['t1'].read()
        fname = request.FILES['t1'].name
        if os.path.exists("EvaluateApp/static/"+fname):
            os.remove("EvaluateApp/static/"+fname)
        with open("EvaluateApp/static/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        img_b64 = MCQ.evaluateMCQ("EvaluateApp/static/"+fname)
        context= {'data':"Evaluation Output", 'img': img_b64}
        return render(request, 'UserScreen.html', context)

def EvaluateSubjective(request):
    if request.method == 'GET':
        return render(request, 'EvaluateSubjective.html', {})

def EvaluateSubjectiveAction(request):
    if request.method == 'POST':
        global username
        answer = request.POST.get('t1', False)
        myfile = request.FILES['t2'].read()
        fname = request.FILES['t2'].name
        if os.path.exists("EvaluateApp/static/"+fname):
            os.remove("EvaluateApp/static/"+fname)
        with open("EvaluateApp/static/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        subjective = MCQ.getSubjective("EvaluateApp/static/"+fname)
        answer = answer.strip().lower()
        subjective = subjective.strip().lower()
        vectorizer = TfidfVectorizer()
        X = vectorizer.fit_transform([answer]).toarray()
        Y = vectorizer.transform([subjective]).toarray()
        score = dot(X[0], Y[0]) / (norm(X[0])*norm(Y[0]))
        context= {'data':"<font size=3 color=blue>Your subjective score = "+str(score)+"</font>"}
        return render(request, 'UserScreen.html', context)    

def RegisterAction(request):
    if request.method == 'POST':
        global username
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        contact = request.POST.get('t3', False)
        email = request.POST.get('t4', False)
        address = request.POST.get('t5', False)               
        output = "none"
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'evaluate',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select username FROM register")
            rows = cur.fetchall()
            for row in rows:
                if row[0] == username:
                    output = username+" Username already exists"
                    break                
        if output == "none":
            db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'evaluate',charset='utf8')
            db_cursor = db_connection.cursor()
            student_sql_query = "INSERT INTO register VALUES('"+username+"','"+password+"','"+contact+"','"+email+"','"+address+"')"
            db_cursor.execute(student_sql_query)
            db_connection.commit()
            print(db_cursor.rowcount, "Record Inserted")
            if db_cursor.rowcount == 1:
                output = "Signup process completed. Login to perform Artificial Intelligence Paper Evaluation"
        context= {'data':output}
        return render(request, 'Register.html', context)        

def UserLoginAction(request):
    global username
    if request.method == 'POST':
        global username
        status = "none"
        users = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'evaluate',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select username,password FROM register")
            rows = cur.fetchall()
            for row in rows:
                if row[0] == users and row[1] == password:
                    username = users
                    status = "success"
                    break
        if status == 'success':
            context= {'data':'Welcome '+username}
            return render(request, "UserScreen.html", context)
        else:
            context= {'data':'Invalid username'}
            return render(request, 'UserLogin.html', context)

def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})         

def UserLogin(request):
    if request.method == 'GET':
       return render(request, 'UserLogin.html', {})

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})


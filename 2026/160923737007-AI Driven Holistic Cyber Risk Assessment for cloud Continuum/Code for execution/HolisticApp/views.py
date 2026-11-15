from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
import os
from django.core.files.storage import FileSystemStorage
import pandas as pd
import io
import base64
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt 
import seaborn as sns
import pymysql
from sklearn.ensemble import RandomForestClassifier

global username, X, Y, dataset
global rf_model
global X_train, X_test, y_train, y_test, labels
global accuracy

accuracy = []


def PredictRisk(request):
    if request.method == 'GET':
        return render(request, 'PredictRisk.html', {})

def UploadDataAction(request):
    if request.method == 'POST':
        global dataset, labels, Y, X, X_train, X_test, y_train, y_test
        myfile = request.FILES['t1'].read()
        fname = request.FILES['t1'].name
        if os.path.exists("HolisticApp/static/"+fname):
            os.remove("HolisticApp/static/"+fname)
        with open("HolisticApp/static/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        dataset = pd.read_csv("HolisticApp/static/"+fname)
        dataset.fillna(dataset.mean(), inplace = True)
        labels = np.unique(dataset['Risk'])
        le = LabelEncoder()
        dataset['Risk'] = pd.Series(le.fit_transform(dataset['Risk'].astype(str)))#encode all str columns to numeric
        Y = dataset['Risk'].ravel()
        dataset.drop(['Risk'], axis = 1,inplace=True)
        X = dataset.values
        X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)
        output = "Total records found in dataset = <font size=3 color=blue>"+str(X.shape[0])+"</font><br/>"
        output += "Total features found in Dataset = <font size=3 color=blue>"+str(X.shape[1])+"</font><br/>"
        output += "Unique Risk found in Dataset = <font size=3 color=blue>"+str(labels)+"</font><br/>"
        output += "80% dataset records used to train AI = <font size=3 color=blue>"+str(X_train.shape[0])+"</font><br/>"
        output += "20% dataset records used to test AI = <font size=3 color=blue>"+str(X_test.shape[0])+"</font><br/><br/>"
        columns = dataset.columns
        output+='<table border=1 align=center width=100%><tr>'
        for i in range(len(columns)):
            output += '<th><font size="3" color="black">'+columns[i]+'</font></th>'
        output += '</tr>'
        data = dataset.values
        for i in range(len(data)):
            output += '<tr>'
            for j in range(len(data[i])):
                output += '<td><font size="3" color="black">'+str(round(data[i,j],3))+'</font></td>'
            output += '</tr>'
        output+= "</table></br>"
        names, count = np.unique(Y, return_counts=True)
        height = count
        bars = labels
        y_pos = np.arange(len(bars))
        plt.figure(figsize = (4, 3)) 
        plt.bar(y_pos, height)
        plt.xticks(y_pos, bars)
        plt.xlabel("Risk Labels")
        plt.ylabel("Number of Instances")
        plt.title("Different Risk Labels Graph")
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        img_b64 = base64.b64encode(buf.getvalue()).decode()
        plt.clf()
        plt.cla()
        context= {'data':output, 'img': img_b64}
        return render(request, 'UserPage.html', context)

def calculateMetrics(algorithm, y_test, predict):
    global accuracy
    a = accuracy_score(y_test,predict)*100
    accuracy.append(round(a, 4))    

def PredictRiskAction(request):
    global username
    if request.method == 'POST':
        global rf_model, dataset, labels
        myfile = request.FILES['t1'].read()
        fname = request.FILES['t1'].name
        if os.path.exists("HolisticApp/static/"+fname):
            os.remove("HolisticApp/static/"+fname)
        with open("HolisticApp/static/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        testData = pd.read_csv("HolisticApp/static/"+fname)
        testData.fillna(dataset.mean(), inplace = True)
        testData = testData.values
        predict = rf_model.predict(testData)
        cols = ['Test Data', 'predicted Risk', 'Predicted Trust']
        output='<table border=1 align=center width=100%><tr>'
        for i in range(len(cols)):
            output += '<th><font size="3" color="black">'+cols[i]+'</font></th>'
        output += '</tr>'
        print(labels)
        for i in range(len(testData)):
            trust = testData[i,5] + testData[i,6]
            if trust > 100 and trust < 1000:
                trust = trust / 10
            if trust > 1000:
                trust = trust / 100
            trust = round(trust, 3)
            if labels[predict[i]] == "Low":
                trust = 1 - trust
            if labels[predict[i]] == "Medium":
                trust = trust/2    
            output += '<tr><td><font size="3" color="black">'+str(testData[i])+'</font></td>'
            output += '<td><font size="3" color="black">'+labels[predict[i]]+'</font></td>'
            output += '<td><font size="3" color="black">'+str(trust)+'</font></td></tr>'    
        output += "</table><br/><br/><br/>"
        context= {'data':output}
        return render(request, 'UserPage.html', context)                        

def TrainRisk(request):
    if request.method == 'GET':
        global dataset, labels, Y, X, X_train, X_test, y_train, y_test
        global accuracy, rf_model
        correct = 0
        for i in range(len(dataset)):
            cpu = dataset.iloc[i]['cpu_usage_list']
            memory = dataset.iloc[i]['mem_usage_percent_list']
            disk = dataset.iloc[i]['disk_read_list']
            net = dataset.iloc[i]['net_in_list']
            total = cpu + memory + disk + net
            if total > 100:
                total =  total / 10
            if total > 1000:
                total =  total / 100
            label = Y[i]
            predict = None
            if total > 30 and total < 60:
                predict = 1
            elif total >= 60 and total < 80:
                predict = 2   
            else:
                predict = 0
            if predict == label:
                correct += 1
        propose = round(correct / len(Y), 2)
        X = dataset.values
        X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)
        data = np.load("model/data.npy", allow_pickle=True)
        X_train, X_test, y_train, y_test = data
        rf_model = RandomForestClassifier()
        rf_model.fit(X_train, y_train)
        predict = rf_model.predict(X_test)
        extension = round(accuracy_score(y_test, predict),3)
        output='<table border=1 align=center width=100%><tr>'
        output += '<tr><th><font size="3" color="black">Algorithm Name</font></th>'
        output += '<th><font size="3" color="black">Accuracy</font></th>'
        output += '</tr>'
        output += '<tr><td><font size="3" color="black">Propose Holistic Risk Assessment</font></td>'
        output += '<td><font size="3" color="black">'+str(propose)+'</font></td></tr>'
        output += '<tr><td><font size="3" color="black">Extension AI</font></td>'
        output += '<td><font size="3" color="black">'+str(extension)+'</font></td></tr>'
        output += "</table><br/>"
        
        height = [propose, extension]
        bars = ['Propose Holistic', 'Extension AI']
        y_pos = np.arange(len(bars))
        plt.figure(figsize = (4, 3)) 
        plt.bar(y_pos, height)
        plt.xticks(y_pos, bars)
        plt.xlabel("Algorithm Names")
        plt.ylabel("Accuracy")
        plt.title("Accuracy Comparison Graph")
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        img_b64 = base64.b64encode(buf.getvalue()).decode()
        plt.clf()
        plt.cla()
        context= {'data':output, 'img': img_b64}
        return render(request, 'UserPage.html', context)

def UploadData(request):
    if request.method == 'GET':
        return render(request, 'UploadData.html', {})

def SignupAction(request):
    if request.method == 'POST':
        global username
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        contact = request.POST.get('t3', False)
        email = request.POST.get('t4', False)
        address = request.POST.get('t5', False)
               
        output = "none"
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'holistic',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select username FROM register")
            rows = cur.fetchall()
            for row in rows:
                if row[0] == username:
                    output = username+" Username already exists"
                    break                
        if output == "none":
            db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'holistic',charset='utf8')
            db_cursor = db_connection.cursor()
            student_sql_query = "INSERT INTO register VALUES('"+username+"','"+password+"','"+contact+"','"+email+"','"+address+"')"
            db_cursor.execute(student_sql_query)
            db_connection.commit()
            print(db_cursor.rowcount, "Record Inserted")
            if db_cursor.rowcount == 1:
                output = "Signup process completed. Login to perform Cyber Risk Assessment activities"
        context= {'data':output}
        return render(request, 'Signup.html', context)
        

def LoginAction(request):
    global username
    if request.method == 'POST':
        global username
        status = "none"
        users = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'holistic',charset='utf8')
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
            return render(request, "UserPage.html", context)
        else:
            context= {'data':'Invalid username'}
            return render(request, 'Login.html', context)

def Signup(request):
    if request.method == 'GET':
       return render(request, 'Signup.html', {})         

def Login(request):
    if request.method == 'GET':
       return render(request, 'Login.html', {})

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})


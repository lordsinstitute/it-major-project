from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
import os
import io
import base64
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.metrics import f1_score
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix
import os
import pymysql
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.ensemble import AdaBoostClassifier
import os
from lightgbm import LGBMClassifier

global username
global X_train, X_test, y_train, y_test, X, Y
accuracy = []
precision = []
recall = [] 
fscore = []
labels = ['Illegal', 'Legal']
deanonymize = pd.read_csv("Dataset/Result.csv")
dataset = pd.read_csv("Dataset/elliptic_txs_features.csv")
Y = dataset['class'].ravel()
dataset.drop(['class'], axis = 1,inplace=True)
X = dataset.values
features = X.shape[1]
X = X[:,0:10]
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)
data = np.load("model/data.npy", allow_pickle=True)
X_train, X_test, y_train, y_test = data

#function to calculate all metrics
def calculateMetrics(algorithm, y_test, predict):
    a = (accuracy_score(y_test,predict)*100)
    p = (precision_score(y_test, predict,average='macro') * 100)
    r = (recall_score(y_test, predict,average='macro') * 100)
    f = (f1_score(y_test, predict,average='macro') * 100)
    a = round(a, 3)
    p = round(p, 3)
    r = round(r, 3)
    f = round(f, 3)
    accuracy.append(a)
    precision.append(p)
    recall.append(r)
    fscore.append(f)
    return algorithm

rf_cls = RandomForestClassifier(n_estimators=30)
rf_cls.fit(X_train, y_train)
predict = rf_cls.predict(X_test)
calculateMetrics("Random Forest", y_test, predict)
xg_cls = XGBClassifier()
xg_cls.fit(X_train, y_train)
predict = xg_cls.predict(X_test)
calculateMetrics("XGBoost", y_test, predict)
ada_cls = AdaBoostClassifier()
ada_cls.fit(X_train, y_train)
predict = ada_cls.predict(X_test)
calculateMetrics("AdaBoost", y_test, predict)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
rf_cls = RandomForestClassifier(n_estimators=50)
rf_cls.fit(X_train, y_train)
predict = rf_cls.predict(X_test)
calculateMetrics("Random Forest with VTAC", y_test, predict)
xg_cls = XGBClassifier()
xg_cls.fit(X_train, y_train)
predict = xg_cls.predict(X_test)
calculateMetrics("XGBoost with VTAC", y_test, predict)
ada_cls = AdaBoostClassifier()
ada_cls.fit(X_train, y_train)
predict = ada_cls.predict(X_test)
calculateMetrics("AdaBoost with VTAC", y_test, predict)
rf_cls = RandomForestClassifier()
xg_cls = XGBClassifier()
estimators=[('rf', rf_cls), ('xg', xg_cls)]
hybrid = VotingClassifier(estimators=estimators, voting="hard")
hybrid.fit(X_train, y_train)
predict = hybrid.predict(X_test)
calculateMetrics("Extension1 Hybrid Model", y_test, predict)
data = np.load("model/data.npy", allow_pickle=True)
X_train, X_test, y_train, y_test = data
X_train, X_test1, y_train, y_test1 = train_test_split(X, Y, test_size=0.1)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
lg_cls = LGBMClassifier(n_estimators=500)
lg_cls.fit(X_train, y_train)
predict = lg_cls.predict(X_test)
calculateMetrics("Extension2 LightGBM", y_test, predict)
conf_matrix = confusion_matrix(y_test, predict)

def getProfile(tid, value):
    global deanonymize
    result = deanonymize[deanonymize['txId'] == tid]
    result = result.values
    return result[0,1], value

def Predict(request):
    if request.method == 'GET':
        return render(request, 'Predict.html', {})

def PredictAction(request):
    if request.method == 'POST':
        global labels, lg_cls, scaler
        myfile = request.FILES['t1'].read()
        if os.path.exists('LaunderingApp/static/test.csv'):
            os.remove('LaunderingApp/static/test.csv')
        with open('LaunderingApp/static/test.csv', "wb") as file:
            file.write(myfile)
        file.close()
        testData = pd.read_csv("LaunderingApp/static/test.csv")
        data = testData.values
        testData = testData.values
        testData = testData[:,0:10]
        testData = scaler.transform(testData)
        predict = lg_cls.predict(testData)
        output = '<table border=1 align=center width=100%><tr><th><font size="3" color="black">Transaction ID</th><th><font size="3" color="black">Hashcode</th>'
        output += '<th><font size="3" color="black">Value</th><th><font size="3" color="blue">Legality</th></tr>'
        print(predict)
        for i in range(len(predict)):
            details, value = getProfile(data[i,0], abs(data[i,5]))
            output += '<tr><td><font size="3" color="black">'+str(data[i,0])+'</td><td><font size="3" color="black">'+details+'</td>'
            output += '<td><font size="3" color="black">'+str(value)+'</td>'
            if predict[i] == 0:
                output += '<td><font size="4" color="red">'+labels[predict[i]]+'</td></tr>'
            else:
                output += '<td><font size="4" color="green">'+labels[predict[i]]+'</td></tr>'
        output+= "</table></br></br></br></br></br>"
        context= {'data':output}
        return render(request, 'UserScreen.html', context)        
        

def TrainModel(request):
    if request.method == 'GET':
        global X_train, X_test, y_train, y_test, labels
        global accuracy, precision, recall, fscore, conf_matrix
        output='<table border=1 align=center width=100%><tr><th><font size="3" color="black">Algorithm Name</th><th><font size="3" color="black">Accuracy</th>'
        output += '<th><font size="3" color="black">Precision</th><th><font size="3" color="black">Recall</th><th><font size="3" color="black">FSCORE</th></tr>'
        algorithms = ['Existing Random Forest', 'Existing XGBoost', 'Existing AdaBoost', 'Propose VTAC Random Forest', 'Propose VTAC XGBoost',
                      'Propose VTAC AdaBoost', 'Extension1 Hybrid Model', 'Extension2 LightGBM']
        for i in range(len(algorithms)):
            output += '<td><font size="3" color="black">'+algorithms[i]+'</td><td><font size="3" color="black">'+str(accuracy[i])+'</td><td><font size="3" color="black">'+str(precision[i])+'</td>'
            output += '<td><font size="3" color="black">'+str(recall[i])+'</td><td><font size="3" color="black">'+str(fscore[i])+'</td></tr>'
        output+= "</table></br>"
        figure, axis = plt.subplots(nrows=1, ncols=2,figsize=(10, 3))#display original and predicted segmented image
        axis[0].set_title("Confusion Matrix Prediction Graph")
        axis[1].set_title("All Algorithms Comparison Graph")
        ax = sns.heatmap(conf_matrix, xticklabels = labels, yticklabels = labels, annot = True, cmap="viridis" ,fmt ="g", ax=axis[0]);
        ax.set_ylim([0,len(labels)])    
        df = pd.DataFrame([['Existing RF','Accuracy',accuracy[0]],['Existing RF','Precision',precision[0]],['Existing RF','Recall',recall[0]],['Existing RF','FSCORE',fscore[0]],
                           ['Existing XGB','Accuracy',accuracy[1]],['Existing XGB','Precision',precision[1]],['Existing XGB','Recall',recall[1]],['Existing XGB','FSCORE',fscore[1]],
                           ['Existing ADB','Accuracy',accuracy[2]],['Existing ADB','Precision',precision[2]],['Existing ADB','Recall',recall[2]],['Existing ADB','FSCORE',fscore[2]],

                           ['Propose RF','Accuracy',accuracy[3]],['Propose RF','Precision',precision[3]],['Propose RF','Recall',recall[3]],['Propose RF','FSCORE',fscore[3]],
                           ['Propose XGB','Accuracy',accuracy[4]],['Propose XGB','Precision',precision[4]],['Propose XGB','Recall',recall[4]],['Propose XGB','FSCORE',fscore[4]],
                           ['Propose ADB','Accuracy',accuracy[5]],['Propose ADB','Precision',precision[5]],['Propose ADB','Recall',recall[5]],['Propose ADB','FSCORE',fscore[5]],

                           ['Extension1 Hybrid','Accuracy',accuracy[6]],['Extension1 Hybrid','Precision',precision[6]],['Extension1 Hybrid','Recall',recall[6]],['Extension1 Hybrid','FSCORE',fscore[6]],
                           ['Extension2 LightGBM','Accuracy',accuracy[7]],['Extension2 LightGBM','Precision',precision[7]],['Extension2 LightGBM','Recall',recall[7]],['Extension2 LightGBM','FSCORE',fscore[7]],
                          ],columns=['Parameters','Algorithms','Value'])
        df.pivot("Parameters", "Algorithms", "Value").plot(kind='bar', ax=axis[1])       
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        #plt.close()
        img_b64 = base64.b64encode(buf.getvalue()).decode()
        plt.clf()
        plt.cla()
        context= {'data':output, 'img': img_b64}
        return render(request, 'UserScreen.html', context)

def LoadDataset(request):    
    if request.method == 'GET':
        global X_train, X_test, y_train, y_test, X, Y, labels, dataset
        X_train11, X_test11, y_train11, y_test11 = train_test_split(X, Y, test_size=0.2) #split dataset into train and test
        output = '<font size="3" color="black">Elliptic Blockchain Dataset Loaded</font><br/>'
        output += '<font size="3" color="blue">Total records found in Dataset = '+str(X.shape[0])+'</font><br/>'
        output += '<font size="3" color="blue">Different Class Labels found in Dataset = '+str(labels)+'</font><br/><br/>'
        output += '<font size="3" color="black">Dataset Train & Test Split details</font><br/>'
        output += '<font size="3" color="blue">80% records used to train all Algorithms = '+str(X_train11.shape[0])+'</font><br/>'
        output += '<font size="3" color="blue">20% dataset records used to test all Algorithms = '+str(X_test11.shape[0])+'</font><br/><br/>Dataset Sample Values<br/>'
        output += str(dataset)
        context= {'data':output}
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
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'laundering',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select username FROM register")
            rows = cur.fetchall()
            for row in rows:
                if row[0] == username:
                    output = username+" Username already exists"
                    break                
        if output == "none":
            db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'laundering',charset='utf8')
            db_cursor = db_connection.cursor()
            student_sql_query = "INSERT INTO register(username,password,contact,email,address) VALUES('"+username+"','"+password+"','"+contact+"','"+email+"','"+address+"')"
            db_cursor.execute(student_sql_query)
            db_connection.commit()
            print(db_cursor.rowcount, "Record Inserted")
            if db_cursor.rowcount == 1:
                output = "Signup process completed. Login to perform Illicit Blockchain Transaction Detection"
        context= {'data':output}
        return render(request, 'Register.html', context)    

def UserLoginAction(request):
    global username
    if request.method == 'POST':
        global username
        status = "none"
        users = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'laundering',charset='utf8')
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

def UserLogin(request):
    if request.method == 'GET':
       return render(request, 'UserLogin.html', {})

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})

def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})

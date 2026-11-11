from django.shortcuts import render
from datetime import datetime
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
import os
import json
from web3 import Web3, HTTPProvider
import io
import base64
import matplotlib.pyplot as plt
from datetime import date

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from keras.utils.np_utils import to_categorical
from keras.layers import  MaxPooling2D
from keras.layers import Dense, Dropout, Activation, Flatten
from keras.layers import Convolution2D
from keras.models import Sequential, load_model, Model
import pickle
from keras.callbacks import ModelCheckpoint
from sklearn.metrics import f1_score
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score

global username, receiverList, usersList, trialList
global contract, web3

accuracy = []
precision = []
recall = [] 
fscore = []

#function to calculate all metrics
def calculateMetrics(algorithm, y_test, predict):
    a = accuracy_score(y_test,predict)*100
    p = precision_score(y_test, predict,average='macro') * 100
    r = recall_score(y_test, predict,average='macro') * 100
    f = f1_score(y_test, predict,average='macro') * 100
    a = round(a, 3)
    p = round(p, 3)
    r = round(r, 3)
    f = round(f, 3)
    accuracy.append(a)
    precision.append(p)
    recall.append(r)
    fscore.append(f)      

#function to call contract
def getContract():
    global contract, web3
    blockchain_address = 'http://127.0.0.1:9545'
    web3 = Web3(HTTPProvider(blockchain_address))
    web3.eth.defaultAccount = web3.eth.accounts[0]
    compiled_contract_path = 'Drug.json' #drug contract file
    deployed_contract_address = '0x7Dc25037e438719cD205F19B14E1D856b01E3229' #contract address
    with open(compiled_contract_path) as file:
        contract_json = json.load(file)  # load contract info as JSON
        contract_abi = contract_json['abi']  # fetch contract's abi - necessary to call its functions
    file.close()
    contract = web3.eth.contract(address=deployed_contract_address, abi=contract_abi)
getContract()

def getUsersList():
    global usersList, contract
    usersList = []
    count = contract.functions.getUserCount().call()
    for i in range(0, count):
        user = contract.functions.getUsername(i).call()
        password = contract.functions.getPassword(i).call()
        phone = contract.functions.getPhone(i).call()
        email = contract.functions.getEmail(i).call()
        address = contract.functions.getHomeAddress(i).call()
        usersList.append([user, password, phone, email, address])

def getTrialList():
    global trialList, contract
    trialList = []
    count = contract.functions.getTrialCount().call()
    for i in range(0, count):
        user = contract.functions.getUser(i).call()
        discussion = contract.functions.getDiscursion(i).call()
        company = contract.functions.getCompany(i).call()
        discuss_date = contract.functions.getDate(i).call()
        trialList.append([user, discussion, company, discuss_date])        

getUsersList()
getTrialList()

dataset = pd.read_csv("Dataset/DrugRepurpose.csv")
labels = np.unique(dataset['NewDisease']).ravel()
label_encoder = []
columns = dataset.columns
types = dataset.dtypes.values
for j in range(len(types)):
    name = types[j]
    if name == 'object': #finding column with object type
        le = LabelEncoder()
        dataset[columns[j]] = pd.Series(le.fit_transform(dataset[columns[j]].astype(str)))#encode all str columns to numeric
        label_encoder.append([columns[j], le])
dataset.fillna(dataset.mean(), inplace = True)#replace missing values

Y = dataset['NewDisease'].ravel()
dataset.drop(['NewDisease'], axis = 1,inplace=True)
X = dataset.values

scaler = StandardScaler()
X = scaler.fit_transform(X)

indices = np.arange(X.shape[0])
np.random.shuffle(indices)
X = X[indices]
Y = Y[indices]

X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2)

#training Random Forest ML algorithm on 80% training data and then evaluating performance on 20% test data
rf_cls = RandomForestClassifier(n_estimators=10)
#training on train data
rf_cls.fit(X_train, y_train)
#perfrom prediction on test data
predict = rf_cls.predict(X_test)
calculateMetrics("Random Forest", y_test, predict)

y_train1 = to_categorical(y_train)
y_test1 = to_categorical(y_test)
X_train1 = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1, 1))
X_test1 = np.reshape(X_test, (X_test.shape[0], X_train.shape[1], 1, 1))

cnn_model = Sequential()
cnn_model.add(Convolution2D(32, (1 , 1), input_shape = (X_train1.shape[1], X_train1.shape[2], X_train1.shape[3]), activation = 'relu'))
cnn_model.add(MaxPooling2D(pool_size = (1, 1)))
cnn_model.add(Convolution2D(32, (1, 1), activation = 'relu'))
cnn_model.add(MaxPooling2D(pool_size = (1, 1)))
cnn_model.add(Flatten())
cnn_model.add(Dense(units = 256, activation = 'relu'))
cnn_model.add(Dense(units = y_train1.shape[1], activation = 'softmax'))
cnn_model.compile(optimizer = 'adam', loss = 'categorical_crossentropy', metrics = ['accuracy'])
if os.path.exists("model/cnn_weights.hdf5") == False:
    model_check_point = ModelCheckpoint(filepath='model/cnn_weights.hdf5', verbose = 1, save_best_only = True)
    hist = cnn_model.fit(X_train1, y_train1, batch_size = 16, epochs = 280, validation_data=(X_test1, y_test1), callbacks=[model_check_point], verbose=1)
    f = open('model/cnn_history.pckl', 'wb')
    pickle.dump(hist.history, f)
    f.close()    
else:
    cnn_model.load_weights("model/cnn_weights.hdf5")
predict = cnn_model.predict(X_test1)
predict = np.argmax(predict, axis=1)
y_test1 = np.argmax(y_test1, axis=1)
calculateMetrics("CNN", y_test1, predict)

def ViewTrials(request):
    if request.method == 'GET':
        global trialList, username
        output = '<table border=1 align=center>'
        output+='<tr><th><font size=3 color=black>Username</font></th>'
        output+='<th><font size=3 color=black>Trial Discursion</font></th>'
        output+='<th><font size=3 color=black>Company Name</font></th>'
        output+='<th><font size=3 color=black>Discursion Date</font></th></tr>'
        for i in range(len(trialList)):
            plist = trialList[i]
            output+='<tr><td><font size=3 color=black>'+plist[0]+'</font></td>'
            output+='<td><font size=3 color=black>'+plist[1]+'</font></td>'
            output+='<td><font size=3 color=black>'+plist[2]+'</font></td>'
            output+='<td><font size=3 color=black>'+plist[3]+'</font></td></tr>'
        output += "</table><br/><br/><br/><br/>"
        context= {'data':output}        
        return render(request,'UserScreen.html', context)

def ShareTrialsAction(request):
    if request.method == 'POST':
        global trialList, username
        trial = request.POST.get('t1', False)
        company = request.POST.get('t2', False)
        dd = str(date.today())
        msg = contract.functions.saveTrial(username, trial, company, dd).transact()
        tx_receipt = web3.eth.waitForTransactionReceipt(msg)
        trialList.append([username, trial, company, dd])
        context= {'data':'<font size=3 color=blue>Trial discursion details added to Blockchain</font><br/><br/>'+str(tx_receipt)}
        return render(request, 'UserScreen.html', context)
        
def ShareTrials(request):
    if request.method == 'GET':
        return render(request,'ShareTrials.html', {})

def PredictAction(request):
    if request.method == 'POST':
        global scaler, label_encoder, labels
        myfile = request.FILES['t1'].read()
        fname = request.FILES['t1'].name
        if os.path.exists("DrugApp/static/"+fname):
            os.remove("DrugApp/static/"+fname)
        with open("DrugApp/static/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        testData = pd.read_csv("DrugApp/static/"+fname, encoding='cp1252')
        temp = pd.read_csv("DrugApp/static/"+fname, encoding='cp1252')
        for j in range(len(label_encoder)-1):
            le = label_encoder[j]
            testData[le[0]] = pd.Series(le[1].transform(testData[le[0]].astype(str)))#encode all str columns to numeric
        testData.fillna(0, inplace = True)
        testData = testData.values
        testData = scaler.transform(testData)
        testData = np.reshape(testData, (testData.shape[0], testData.shape[1], 1,1 ))
        cnn_model = load_model("model/cnn_weights.hdf5")
        predict = cnn_model.predict(testData)
        predict = np.argmax(predict, axis=1)
        columns = temp.columns
        temp = temp.values
        output='<table border=1 align=center width=100%><tr>'
        for i in range(len(columns)):
            output += '<th><font size="3" color="black">'+columns[i]+'</th>'
        output += '<th><font size="3" color="black">New Disease Usage</th></tr>'
        for i in range(len(temp)):
            output += '<tr>'
            for j in range(len(temp[i])):
                output += '<td><font size="3" color="black">'+str(temp[i,j])+'</td>'
            output += '<td><font size="3" color="blue">Can be used for New Disease = '+labels[predict[i]]+'</font></td>'    
            output += '</tr>'
        output+= "</table></br></br></br></br>"
        context= {'data':output}
        return render(request, 'UserScreen.html', context)     

def Predict(request):
    if request.method == 'GET':
        return render(request,'Predict.html', {})

def TrainModels(request):
    if request.method == 'GET':
        global accuracy, precision, recall, fscore
        output='<table border=1 align=center width=100%><tr><th><font size="" color="black">Algorithm Name</th><th><font size="" color="black">Accuracy</th>'
        output += '<th><font size="" color="black">Precision</th><th><font size="" color="black">Recall</th><th><font size="" color="black">FSCORE</th>'
        output+='</tr>'
        algorithms = ['Random Forest', 'CNN2D']
        for i in range(len(algorithms)):
            output += '<td><font size="" color="black">'+algorithms[i]+'</td><td><font size="" color="black">'+str(accuracy[i])+'</td><td><font size="" color="black">'+str(precision[i])+'</td>'
            output += '<td><font size="" color="black">'+str(recall[i])+'</td><td><font size="" color="black">'+str(fscore[i])+'</td></tr>'
        output+= "</table></br>"
        df = pd.DataFrame([['Random Forest','Accuracy',accuracy[0]],['Random Forest','Precision',precision[0]],['Random Forest','Recall',recall[0]],['Random Forest','FSCORE',fscore[0]],
                           ['CNN2D','Accuracy',accuracy[1]],['CNN2D','Precision',precision[1]],['CNN2D','Recall',recall[1]],['CNN2D','FSCORE',fscore[1]],
                          ],columns=['Parameters','Algorithms','Value'])           
        df.pivot("Parameters", "Algorithms", "Value").plot(kind='bar', figsize=(6, 3))
        plt.title("All Algorithms Performance Graph")
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        img_b64 = base64.b64encode(buf.getvalue()).decode()
        plt.clf()
        plt.cla()
        context= {'data':output, 'img': img_b64}
        return render(request, 'UserScreen.html', context)

def LoadDataset(request):
    if request.method == 'GET':
        return render(request,'LoadDataset.html', {})

def LoadDatasetAction(request):
    if request.method == 'POST':
        global X, Y, labels
        output = "Total Records found in Dataset = "+str(X.shape[0])+"<br/>"
        output += "Dataset Train & Test Split Details<br/>"
        output += "80% records using to train AI Algorithms : "+str(X_train.shape[0])+"<br/>"
        output += "20% records using to test AI Algorithms : "+str(X_test.shape[0])+"<br/><br/>"
        dataset = pd.read_csv("Dataset/DrugRepurpose.csv")
        columns = dataset.columns
        dataset = dataset.values
        output+='<table border=1 align=center width=100%><tr>'
        for i in range(len(columns)):
            output += '<th><font size="3" color="black">'+columns[i]+'</th>'
        output += '</tr>'
        for i in range(len(dataset)):
            output += '<tr>'
            for j in range(len(dataset[i])):
                output += '<td><font size="3" color="black">'+str(dataset[i,j])+'</td>'
            output += '</tr>'
        output+= "</table></br></br></br></br>"
        #print(output)
        context= {'data':output}
        return render(request, 'UserScreen.html', context)      

def index(request):
    if request.method == 'GET':
        return render(request,'index.html', {})

def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})
    
def UserLogin(request):
    if request.method == 'GET':
       return render(request, 'UserLogin.html', {})

def RegisterAction(request):
    if request.method == 'POST':
        global usersList
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        contact = request.POST.get('t3', False)
        email = request.POST.get('t4', False)
        address = request.POST.get('t5', False)
        status = "none"
        for i in range(len(usersList)):
            users = usersList[i]
            if username == users[0]:
                status = "exists"
                break
        if status == "none":
            msg = contract.functions.saveUser(username, password, contact, email, address).transact()
            tx_receipt = web3.eth.waitForTransactionReceipt(msg)
            usersList.append([username, password, contact, email, address])
            context= {'data':'<font size=3 color=blue>Signup Process Completed</font><br/>'+str(tx_receipt)}
            return render(request, 'Register.html', context)
        else:
            context= {'data':'Given username already exists'}
            return render(request, 'Register.html', context)

def UserLoginAction(request):
    if request.method == 'POST':
        global username, contract, usersList
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        status = 'none'
        for i in range(len(usersList)):
            ulist = usersList[i]
            user1 = ulist[0]
            pass1 = ulist[1]
            utype = ulist[3]
            if user1 == username and pass1 == password:
                status = "success"
                break
        if status == 'success':
            output = 'Welcome '+username
            context= {'data':output}
            return render(request, "UserScreen.html", context)
        if status == 'none':
            context= {'data':'Invalid login details'}
            return render(request, 'UserLogin.html', context)        

      


        

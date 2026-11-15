import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from catboost import CatBoostClassifier
from sklearn.ensemble import RandomForestClassifier
#=================flask code starts here
from flask import Flask, render_template, request, redirect, url_for, session,send_from_directory


app = Flask(__name__)
app.secret_key = 'welcome'

dataset = pd.read_csv("Dataset/borg_traces_data.csv")
dataset.drop(['Unnamed: 0','user', 'tail_cpu_usage_distribution', 'resource_request', 'start_after_collection_ids'], axis = 1,inplace=True)
label_encoder = []
columns = dataset.columns
types = dataset.dtypes.values
for j in range(len(types)):
    name = types[j]
    if name == 'object': #finding column with object type
        le = LabelEncoder()
        dataset[columns[j]] = pd.Series(le.fit_transform(dataset[columns[j]].astype(str)))#encode all str columns to numeric
        label_encoder.append([columns[j], le])
dataset.fillna(dataset.mean(), inplace = True)
failed = dataset['failed']
dataset.drop(['failed'], axis = 1,inplace=True)
dataset.fillna(dataset.mean(), inplace = True)#replace missing values with 0
X = dataset.values
indices = np.arange(X.shape[0])
np.random.shuffle(indices)#shuffling the dataset to distribute classes at random position
X = X[indices]
failed = failed[indices]
#split dataset features into train (80% & test (20%)
X_train, X_test, y_train, y_test = train_test_split(X, failed, test_size=0.2)
# Split dataset into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X, failed,
    test_size=0.2,
    random_state=42,
    stratify=failed
)
train_failed_type = X_train[:,27]
test_failed_type = X_test[:,27]
X_train = X_train[:,0:X_train.shape[1]-1]
X_test = X_test[:,0:X_test.shape[1]-1]
scaler = MinMaxScaler((0,1))
X_train = scaler.fit_transform(X_train)#normalize training X features
X_test = scaler.transform(X_test)
cb_cls = CatBoostClassifier()
cb_cls.fit(X_train, y_train)
train_prob = cb_cls.predict_proba(X_train)#getting probabilities from train and test data
test_prob = cb_cls.predict_proba(X_test) 
train_prob = np.hstack((X_train, train_prob))
test_prob = np.hstack((X_test, test_prob))
#training random forest with probabilities and model weight values
rf_cls = RandomForestClassifier(max_depth=5)
rf_cls.fit(train_prob, train_failed_type)

@app.route('/')
def home():
    return render_template('index.html', msg='')

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
        global rf_cls, label_encoder, scaler, cb_cls
        labels = ['Success', 'Failed']
        test_data = pd.read_csv("Dataset/testData.csv")#loading test data
        data = test_data.values
        #remove irrelevant columns
        test_data.drop(['Unnamed: 0','user', 'tail_cpu_usage_distribution', 'resource_request', 'start_after_collection_ids'], axis = 1,inplace=True)
        for i in range(len(label_encoder)-1):
            le = label_encoder[i]
            test_data[le[0]] = pd.Series(le[1].transform(test_data[le[0]].astype(str)))#label encoding
        test_data.fillna(dataset.mean(), inplace = True)#replace missing values with 0    
        test_data = test_data.values
        test_data = scaler.fit_transform(test_data)#normalizing test data
        predict = cb_cls.predict(test_data)
        prob = cb_cls.predict_proba(test_data) #extension catboot model to predict job failure
        prob = np.hstack((test_data, prob))
        failed_predict_type = rf_cls.predict(prob).astype(int)#random forest to predict failure type
        labs = ['Evict','Fail','Finish','Kill','Lost']
        output = '<table border=1 align=center width=100%><tr>'
        output += '<th><font size="3" color="black">Cloud Job Test Data</font></th>'
        output += '<th><font size="3" color="blue">Predicted Failure Status</font></th>'
        output += '<th><font size="3" color="blue">Predicted Failure Type</font></th></tr>'
        for i in range(len(predict)):
            output += "<tr>"
            output += '<td><font size="3" color="black">'+str(data[i][0:30])+'</font></td>'
            output += '<td><font size="4" color="blue">'+labels[predict[i]]+'</font></td>'
            output += '<td><font size="4" color="green">'+labs[failed_predict_type[i]]+'</font></td></tr>'
        output += "</table><br/><br/><br/><br/>"             
        return render_template('UserScreen.html', msg=output)

if __name__ == '__main__':
    app.run()    

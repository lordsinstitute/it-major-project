from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
import os
import pymysql
from django.core.files.storage import FileSystemStorage
from datetime import date
import numpy as np
import io
import base64
import os
import matplotlib.pyplot as plt
from nltk.sentiment.vader import SentimentIntensityAnalyzer

global username
analyzer = SentimentIntensityAnalyzer()

def analyze_sentiment(text):
    global analyzer
    scores = analyzer.polarity_scores(text)
    if scores['compound'] >= 0.05:
        return "Positive"
    elif scores['compound'] <= -0.05:
        return "Negative"
    else:
        return "Neutral"

def getImage(name):
    pimage = ""
    con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
    with con:
        cur = con.cursor()
        cur.execute("select filename FROM product where product_name='"+name+"'")
        rows = cur.fetchall()
        for row in rows:
            pimage = row[0]
            break
    return pimage

def Analysis(request):
    if request.method == 'GET':
        name = []
        count = []
        values = {"1":0, "2":0, "3":0, "4":0, "5":0}
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select overall_rating FROM reviews")
            rows = cur.fetchall()
            for row in rows:
                ratings = str(row[0]).split(" ")
                values[ratings[0]] = values[ratings[0]] + 1
        for k, v in values.items():
            if v > 0:
                name.append(k)
                count.append(v)
        plt.pie(count, labels=name, autopct='%1.1f%%')
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.title("Overall Ratings Analysis Graph")
        plt.close()
        img_b64 = base64.b64encode(buf.getvalue()).decode()    
        context= {'data':"Overall Ratings Analysis Graph", 'img': img_b64}
        return render(request, 'AdminScreen.html', context)                 

def ViewUserReviews(request):
    if request.method == 'GET':
        global username
        output = '<table border=1 align=center width=100%><tr><th><font size="" color="black">Username</th><th><font size="" color="black">Product Name</th>'
        output+='<th><font size="" color="black">Front Camera</th>'
        output+='<th><font size="" color="black">Rear Camera</th>'
        output+='<th><font size="" color="black">Speaker</th>'
        output+='<th><font size="" color="black">Screen</th>'
        output+='<th><font size="" color="black">Overall Ratings</th>'
        output+='<th><font size="" color="black">Sentiments</th>'
        output+='<th><font size="" color="black">Image</th></tr>'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select * FROM reviews")
            rows = cur.fetchall()
            for row in rows:
                user = str(row[0])
                name = row[1]
                front = row[2].strip().split(" ")
                rear = row[3].strip().split(" ")
                speaker = row[4].strip().split(" ")
                screen = row[5].strip().split(" ")
                overall = row[6].strip().split(" ")
                sentiment = row[7]
                image = getImage(name)
                output += '<tr><td><font size="" color="black">'+str(user)+'</td><td><font size="" color="black">'+str(name)+'</td>'
                output += '<td><font size="" color="black">'+str(front[0]+" / "+front[1])+'</td><td><font size="" color="black">'+rear[0]+" / "+rear[1]+'</td>'
                output += '<td><font size="" color="black">'+speaker[0]+" / "+speaker[1]+'</td><td><font size="" color="black">'+screen[0]+" / "+screen[1]+'</td>'
                output += '<td><font size="" color="black">'+overall[0]+" / "+overall[1]+'</td>'
                output += '<td><font size="" color="black">'+sentiment+'</td>'
                output += '<td><img src="static/files/'+image+'" width="300" height="300"/></td></tr>'
        output += "</table><br/><br/><br/><br/>"    
        context= {'data':output}
        return render(request, 'AdminScreen.html', context)

def ReviewsAction(request):
    if request.method == 'POST':
        global username
        name = request.POST.get('name', False)
        output = '<table border=1 align=center width=100%><tr><th><font size="" color="black">Username</th><th><font size="" color="black">Product Name</th>'
        output+='<th><font size="" color="black">Front Camera</th>'
        output+='<th><font size="" color="black">Rear Camera</th>'
        output+='<th><font size="" color="black">Speaker</th>'
        output+='<th><font size="" color="black">Screen</th>'
        output+='<th><font size="" color="black">Overall Ratings</th>'
        output+='<th><font size="" color="black">Sentiments</th>'
        output+='<th><font size="" color="black">Image</th></tr>'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select * FROM reviews where product_name='"+name+"'")
            rows = cur.fetchall()
            for row in rows:
                user = str(row[0])
                name = row[1]
                front = row[2].strip().split(" ")
                rear = row[3].strip().split(" ")
                speaker = row[4].strip().split(" ")
                screen = row[5].strip().split(" ")
                overall = row[6].strip().split(" ")
                sentiment = row[7]
                image = getImage(name)
                output += '<tr><td><font size="" color="black">'+str(user)+'</td><td><font size="" color="black">'+str(name)+'</td>'
                output += '<td><font size="" color="black">'+str(front[0]+" / "+front[1])+'</td><td><font size="" color="black">'+rear[0]+" / "+rear[1]+'</td>'
                output += '<td><font size="" color="black">'+speaker[0]+" / "+speaker[1]+'</td><td><font size="" color="black">'+screen[0]+" / "+screen[1]+'</td>'
                output += '<td><font size="" color="black">'+overall[0]+" / "+overall[1]+'</td>'
                output += '<td><font size="" color="black">'+sentiment+'</td>'
                output += '<td><img src="static/files/'+image+'" width="300" height="300"/></td></tr>'
        output += "</table><br/><br/><br/><br/>"    
        context= {'data':output}
        return render(request, 'UserScreen.html', context)     

def Reviews(request):
    if request.method == 'GET':
        output = '<tr><td><font size="3" color="black">Choose&nbsp;Product</td><td><select name="name">'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select product_name FROM product")
            rows = cur.fetchall()
            for row in rows:
                output += '<option value="'+row[0]+'">'+row[0]+"</option>"
        output += "</select></td></tr>"        
        context= {'data1':output}
        return render(request, 'Reviews.html', context)    

def FeaturesAction(request):
    if request.method == 'POST':
        global username
        output = "Error in collecting comments from you"
        name = request.POST.get('name', False)
        front = request.POST.get('t1', False)
        comment1 = request.POST.get('t2', False)
        rear = request.POST.get('t3', False)
        comment2 = request.POST.get('t4', False)
        speaker = request.POST.get('t5', False)
        comment3 = request.POST.get('t6', False)
        screen = request.POST.get('t7', False)
        comment4 = request.POST.get('t8', False)
        overall = request.POST.get('t9', False)
        comment5 = request.POST.get('t10', False)
        sentiment = analyze_sentiment(comment1+" "+comment2+" "+comment3+" "+comment4+" "+comment5)
        db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        db_cursor = db_connection.cursor()
        student_sql_query = "INSERT INTO reviews VALUES('"+str(username)+"','"+name+"','"+front+" "+comment1+"','"+rear+" "+comment2+"','"+speaker+" "+comment3+"','"+screen+" "+comment4+"','"+overall+" "+comment5+"','"+sentiment+"')"
        db_cursor.execute(student_sql_query)
        db_connection.commit()
        print(db_cursor.rowcount, "Record Inserted")
        if db_cursor.rowcount == 1:
            output = "Your Reveiws & Comments Accepted<br/>Your Sentiment = "+sentiment
        context= {'data':output}
        return render(request, 'UserScreen.html', context)        

def Features(request):
    if request.method == 'GET':
        output = '<tr><td><font size="3" color="black">Choose&nbsp;Product</td><td><select name="name">'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select product_name FROM product")
            rows = cur.fetchall()
            for row in rows:
                output += '<option value="'+row[0]+'">'+row[0]+"</option>"
        output += "</select></td></tr>"        
        context= {'data1':output}
        return render(request, 'Features.html', context)

def SearchProductAction(request):
    if request.method == 'POST':
        global username
        name = request.POST.get('t1', False)
        output = '<table border=1 align=center width=100%><tr><th><font size="" color="black">Product ID</th><th><font size="" color="black">Product Name</th>'
        output+='<th><font size="" color="black">Product Price</th>'
        output+='<th><font size="" color="black">Description</th>'
        output+='<th><font size="" color="black">Company Name</th>'
        output+='<th><font size="" color="black">Paying Mode</th>'
        output+='<th><font size="" color="black">Product Type</th>'
        output+='<th><font size="" color="black">Product Image</th></tr>'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select product_id,product_name,price,description,company_name,paying_mode,product_type,filename FROM product where product_name='"+name+"'")
            rows = cur.fetchall()
            for row in rows:
                pid = str(row[0])
                pname = row[1]
                price = row[2]
                desc = row[3]
                company = row[4]
                mode = row[5]
                ptype = row[6]
                image = row[7]
                output += '<tr><td><font size="" color="black">'+str(pid)+'</td><td><font size="" color="black">'+str(pname)+'</td>'
                output += '<td><font size="" color="black">'+str(price)+'</td><td><font size="" color="black">'+str(desc)+'</td>'
                output += '<td><font size="" color="black">'+str(company)+'</td><td><font size="" color="black">'+str(mode)+'</td>'
                output += '<td><font size="" color="black">'+str(ptype)+'</td>'
                output += '<td><img src="static/files/'+image+'" width="300" height="300"/></td></tr>'
        output += "</table><br/><br/><br/><br/>"    
        context= {'data':output}
        return render(request, 'UserScreen.html', context) 

def SearchProduct(request):
    if request.method == 'GET':
        output = '<tr><td><font size="3" color="black">Choose&nbsp;Product</td><td><select name="t1">'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select product_name FROM product")
            rows = cur.fetchall()
            for row in rows:
                output += '<option value="'+row[0]+'">'+row[0]+"</option>"
        output += "</select></td></tr>"        
        context= {'data1':output}
        return render(request, 'SearchProduct.html', context)

def RemoveProductAction(request):
    if request.method == 'GET':
        name = request.GET.get('requester', False)
        db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        db_cursor = db_connection.cursor()
        student_sql_query = "delete from product where product_id='"+name+"'"
        db_cursor.execute(student_sql_query)
        db_connection.commit()
        output = "Error in removing product details"
        if db_cursor.rowcount == 1:
            output = "Product details successfully deleted"
        context= {'data':output}
        return render(request, 'AdminScreen.html', context)

def RemoveProduct(request):
    if request.method == 'GET':        
        output = '<table border=1 align=center width=100%><tr><th><font size="" color="black">Product ID</th><th><font size="" color="black">Product Name</th>'
        output+='<th><font size="" color="black">Product Price</th>'
        output+='<th><font size="" color="black">Company Name</th>'
        output+='<th><font size="" color="black">Product Image</th>'
        output+='<th><font size="" color="black">Delete Product</th></tr>'
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select product_id,product_name,price,company_name,filename FROM product")
            rows = cur.fetchall()
            for row in rows:
                pid = str(row[0])
                pname = row[1]
                price = row[2]
                company = row[3]
                image = row[4]
                output += '<tr><td><font size="" color="black">'+str(pid)+'</td><td><font size="" color="black">'+str(pname)+'</td>'
                output += '<td><font size="" color="black">'+str(price)+'</td><td><font size="" color="black">'+str(company)+'</td>'
                output += '<td><img src="static/files/'+image+'" width="300" height="300"/></td>'
                output +='<td><a href=\'RemoveProductAction?requester='+pid+'\'><font size=3 color=black>Delete Product</font></a></td></tr>'
        output += "</table><br/><br/><br/><br/>"    
        context= {'data':output}
        return render(request, 'AdminScreen.html', context) 

def AddProduct(request):
    if request.method == 'GET':
        return render(request, 'AddProduct.html', {})

def AddProductAction(request):
    if request.method == 'POST':
        global username
        name = request.POST.get('t1', False)
        price = request.POST.get('t2', False)
        buying = request.POST.get('t3', False)
        qty = request.POST.get('t4', False)
        desc = request.POST.get('t5', False)
        suggest = request.POST.get('t6', False)
        company = request.POST.get('t7', False)
        details = request.POST.get('t8', False)
        paying = request.POST.get('t9', False)
        mode = request.POST.get('t10', False)
        ptype = request.POST.get('t11', False)        
        myfile = request.FILES['t12'].read()
        fname = request.FILES['t12'].name
        output = "Error in adding product details"
        if os.path.exists("RatingApp/static/files/"+fname):
            os.remove("RatingApp/static/files/"+fname)        
        with open("RatingApp/static/files/"+fname, "wb") as file:
            file.write(myfile)
        file.close()
        pid = 0
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select max(product_id) FROM product")
            rows = cur.fetchall()
            for row in rows:
                pid = row[0]  
        if pid is not None:
            pid += 1
        else:
            pid = 1
        dd = str(date.today())    
        db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        db_cursor = db_connection.cursor()
        student_sql_query = "INSERT INTO product VALUES('"+str(pid)+"','"+name+"','"+price+"','"+buying+"','"+qty+"','"+desc+"','"+suggest+"','"+company+"','"+details+"','"+paying+"','"+mode+"','"+ptype+"','"+fname+"','"+dd+"')"
        db_cursor.execute(student_sql_query)
        db_connection.commit()
        print(db_cursor.rowcount, "Record Inserted")
        if db_cursor.rowcount == 1:
            output = "New Product details added with product id = "+str(pid)
        context= {'data':output}
        return render(request, 'AddProduct.html', context)         

def RegisterAction(request):
    if request.method == 'POST':
        global username
        username = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        contact = request.POST.get('t3', False)
        email = request.POST.get('t4', False)
        address = request.POST.get('t5', False)
        
        output = "none"
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
        with con:
            cur = con.cursor()
            cur.execute("select username FROM register")
            rows = cur.fetchall()
            for row in rows:
                if row[0] == username:
                    output = username+" Username already exists"
                    break                
        if output == "none":
            db_connection = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
            db_cursor = db_connection.cursor()
            student_sql_query = "INSERT INTO register(username,password,contact,email,address) VALUES('"+username+"','"+password+"','"+contact+"','"+email+"','"+address+"')"
            db_cursor.execute(student_sql_query)
            db_connection.commit()
            print(db_cursor.rowcount, "Record Inserted")
            if db_cursor.rowcount == 1:
                output = "Signup process completed. Login to perform ratings activities"
        context= {'data':output}
        return render(request, 'Register.html', context)
        

def UserLoginAction(request):
    global username
    if request.method == 'POST':
        global username
        status = "none"
        users = request.POST.get('t1', False)
        password = request.POST.get('t2', False)
        con = pymysql.connect(host='127.0.0.1',port = 3306,user = 'root', password = 'root', database = 'featurerating',charset='utf8')
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

def AdminLoginAction(request):
    global username
    if request.method == 'POST':
        global username
        status = "none"
        users = request.POST.get('t1', False)
        password = request.POST.get('t2', False)        
        if users == 'admin' and password == 'admin':
            username = users
            context= {'data':'Welcome '+username}
            return render(request, "AdminScreen.html", context)
        else:
            context= {'data':'Invalid username'}
            return render(request, 'AdminLogin.html', context)        

def AdminLogin(request):
    if request.method == 'GET':
       return render(request, 'AdminLogin.html', {})

def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})

def UserLogin(request):
    if request.method == 'GET':
       return render(request, 'UserLogin.html', {})

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})


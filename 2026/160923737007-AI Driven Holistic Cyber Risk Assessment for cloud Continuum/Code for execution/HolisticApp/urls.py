from django.urls import path

from . import views

urlpatterns = [path("index.html", views.index, name="index"),
		     path("Login.html", views.Login, name="Login"),
		     path("LoginAction", views.LoginAction, name="LoginAction"),
	             path("Signup.html", views.Signup, name="Signup"),
		     path("SignupAction", views.SignupAction, name="SignupAction"),
		     path("UploadData.html", views.UploadData, name="UploadData"),
		     path("UploadDataAction", views.UploadDataAction, name="UploadDataAction"),
		     path("TrainRisk", views.TrainRisk, name="TrainRisk"),
		     path("PredictRisk", views.PredictRisk, name="PredictRisk"),
		     path("PredictRiskAction", views.PredictRiskAction, name="PredictRiskAction"),
		     	
		    ]
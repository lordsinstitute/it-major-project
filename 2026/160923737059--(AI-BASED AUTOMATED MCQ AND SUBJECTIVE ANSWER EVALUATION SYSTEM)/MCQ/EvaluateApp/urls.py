from django.urls import path

from . import views

urlpatterns = [path("index.html", views.index, name="index"),
		     path("UserLogin.html", views.UserLogin, name="UserLogin"),
		     path("UserLoginAction", views.UserLoginAction, name="UserLoginAction"),
		     path("Register.html", views.Register, name="Register"),
		     path("RegisterAction", views.RegisterAction, name="RegisterAction"),
		     path("EvaluateMCQ.html", views.EvaluateMCQ, name="EvaluateMCQ"),
		     path("EvaluateMCQAction", views.EvaluateMCQAction, name="EvaluateMCQAction"),
		     path("EvaluateSubjective", views.EvaluateSubjective, name="EvaluateSubjective"),
		     path("EvaluateSubjectiveAction", views.EvaluateSubjectiveAction, name="EvaluateSubjectiveAction"),
		     	     
		    ]
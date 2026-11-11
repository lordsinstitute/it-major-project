from django.urls import path

from . import views

urlpatterns = [path("index.html", views.index, name="index"),
               path("UserLogin.html", views.UserLogin, name="UserLogin"),	      
               path("UserLoginAction", views.UserLoginAction, name="UserLoginAction"),
               path("Register.html", views.Register, name="Register"),
               path("RegisterAction", views.RegisterAction, name="RegisterAction"),
               path("LoadDataset.html", views.LoadDataset, name="LoadDataset"),
	       path("LoadDatasetAction", views.LoadDatasetAction, name="LoadDatasetAction"),
	       path("TrainModels", views.TrainModels, name="TrainModels"),
	       path("Predict", views.Predict, name="Predict"),
	       path("PredictAction", views.PredictAction, name="PredictAction"),
               path("ShareTrials", views.ShareTrials, name="ShareTrials"),	    
	       path("ShareTrialsAction", views.ShareTrialsAction, name="ShareTrialsAction"),
               path("ViewTrials", views.ViewTrials, name="ViewTrials"),	
]

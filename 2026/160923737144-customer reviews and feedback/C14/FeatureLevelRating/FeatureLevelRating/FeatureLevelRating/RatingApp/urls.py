from django.urls import path

from . import views

urlpatterns = [path("index.html", views.index, name="index"),
	             path("UserLogin.html", views.UserLogin, name="UserLogin"),
		     path("Register.html", views.Register, name="Register"),
		     path("RegisterAction", views.RegisterAction, name="RegisterAction"),
		     path("UserLoginAction", views.UserLoginAction, name="UserLoginAction"),
		     path("AdminLogin.html", views.AdminLogin, name="AdminLogin"),
		     path("AdminLoginAction", views.AdminLoginAction, name="AdminLoginAction"),
		     path("AddProduct.html", views.AddProduct, name="AddProduct"),
		     path("AddProductAction", views.AddProductAction, name="AddProductAction"),
		     path("SearchProduct.html", views.SearchProduct, name="SearchProduct"),
		     path("SearchProductAction", views.SearchProductAction, name="SearchProductAction"),
		     path("Reviews", views.Reviews, name="Reviews"),
		     path("ReviewsAction", views.ReviewsAction, name="ReviewsAction"),
		     path("Features", views.Features, name="Features"),
		     path("FeaturesAction", views.FeaturesAction, name="FeaturesAction"),	
		     path("RemoveProduct", views.RemoveProduct, name="RemoveProduct"),
		      path("RemoveProductAction", views.RemoveProductAction, name="RemoveProductAction"),
		     path("ViewUserReviews", views.ViewUserReviews, name="ViewUserReviews"),
		     path("Analysis", views.Analysis, name="Analysis"),
		    ]
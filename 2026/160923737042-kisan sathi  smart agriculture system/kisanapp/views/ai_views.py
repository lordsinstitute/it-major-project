"""
AI Module Views - Disease Detection, Yield Prediction, Fertilizer Recommendation
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from kisanapp.ai_engine import predict_disease, suggest_pesticide, predict_yield, recommend_fertilizer
from kisanapp.models import AIResult, FarmerProfile


def farmer_required(view_func):
    @login_required
    def _wrapped(request, *args, **kwargs):
        try:
            profile = request.user.farmer_profile
            if not profile.is_approved:
                messages.error(request, 'Your account is not approved.')
                return redirect('farmer_login')
        except FarmerProfile.DoesNotExist:
            messages.error(request, 'Farmer access required.')
            return redirect('home')
        return view_func(request, *args, **kwargs)
    return _wrapped


@farmer_required
def ai_dashboard(request):
    return render(request, 'ai_module/dashboard.html')


@farmer_required
def disease_detection(request):
    result = None
    pesticide_suggestion = None

    if request.method == 'POST':
        image = request.FILES.get('image')
        crop_type = request.POST.get('crop_type', 'default')

        if image:
            # predict_disease is the shared function used by both Farmer and Expert.
            prediction = predict_disease(image, crop_type)
            disease = prediction['disease']
            confidence = prediction['confidence']
            pesticide = suggest_pesticide(disease) if not prediction['is_low_conf'] else ''
            result = disease
            pesticide_suggestion = pesticide

            AIResult.objects.create(
                user=request.user,
                prediction_type='disease',
                input_data={'crop_type': crop_type},
                result=f"Disease: {disease} | Confidence: {confidence:.0%} | Pesticide: {pesticide}",
                image=image
            )
        else:
            messages.error(request, 'Please upload a crop image.')

    crop_choices = [
        ('default', 'General/Unknown'),
        ('wheat', 'Wheat'),
        ('rice', 'Rice/Paddy'),
        ('maize', 'Maize/Corn'),
        ('cotton', 'Cotton'),
        ('tomato', 'Tomato'),
    ]
    return render(request, 'ai_module/disease_detection.html', {
        'result': result,
        'pesticide_suggestion': pesticide_suggestion,
        'crop_choices': crop_choices,
    })


@farmer_required
def yield_prediction(request):
    result = None
    unit = None

    if request.method == 'POST':
        crop = request.POST.get('crop', '').strip()
        area = request.POST.get('area_acres', '').strip()
        weather = request.POST.get('weather_condition', 'average')

        if crop and area:
            try:
                predicted, unit = predict_yield(crop, float(area), weather)
                result = predicted
                AIResult.objects.create(
                    user=request.user,
                    prediction_type='yield',
                    input_data={'crop': crop, 'area': area, 'weather': weather},
                    result=f"{predicted} {unit}"
                )
            except ValueError:
                messages.error(request, 'Please enter a valid area value.')
        else:
            messages.error(request, 'Please fill in all fields.')

    weather_choices = [
        ('excellent', 'Excellent (Ideal conditions)'),
        ('good', 'Good (Slightly above average)'),
        ('average', 'Average (Normal conditions)'),
        ('poor', 'Poor (Below average)'),
        ('drought', 'Drought conditions'),
        ('flood', 'Flood/Waterlogging'),
    ]
    crop_choices = [
        'Wheat', 'Rice', 'Paddy', 'Maize', 'Corn', 'Cotton',
        'Sugarcane', 'Soybean', 'Groundnut', 'Sunflower',
        'Tomato', 'Onion', 'Potato', 'Chilli', 'Turmeric'
    ]
    return render(request, 'ai_module/yield_prediction.html', {
        'result': result,
        'unit': unit,
        'weather_choices': weather_choices,
        'crop_choices': crop_choices,
    })


@farmer_required
def fertilizer_recommendation(request):
    result = None

    if request.method == 'POST':
        crop = request.POST.get('crop', '').strip()
        soil_type = request.POST.get('soil_type', 'loamy')
        weather = request.POST.get('weather_condition', 'normal')

        if crop and soil_type:
            recommendation = recommend_fertilizer(crop, soil_type, weather)
            result = recommendation
            AIResult.objects.create(
                user=request.user,
                prediction_type='fertilizer',
                input_data={'crop': crop, 'soil_type': soil_type, 'weather': weather},
                result=recommendation
            )
        else:
            messages.error(request, 'Please fill in all fields.')

    soil_choices = [
        ('sandy', 'Sandy Soil'),
        ('clay', 'Clay Soil'),
        ('loamy', 'Loamy Soil'),
        ('silty', 'Silty Soil'),
        ('peaty', 'Peaty Soil'),
        ('chalky', 'Chalky Soil'),
    ]
    weather_choices = [
        ('normal', 'Normal'),
        ('dry', 'Dry/Hot'),
        ('humid', 'Humid'),
        ('rainy', 'Rainy Season'),
    ]
    crop_choices = [
        'Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane',
        'Soybean', 'Groundnut', 'Tomato', 'Onion', 'Potato'
    ]
    return render(request, 'ai_module/fertilizer_recommendation.html', {
        'result': result,
        'soil_choices': soil_choices,
        'weather_choices': weather_choices,
        'crop_choices': crop_choices,
    })


@farmer_required
def ai_history(request):
    results = AIResult.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'ai_module/history.html', {'results': results})

"""
Farmer Views - Dashboard, queries, chatbot, guides, schemes, crop prices
"""
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from kisanapp.models import Query, Response, ChatbotFAQ, CropPrice, Scheme, Guide, FarmerProfile
import json


def farmer_required(view_func):
    @login_required
    def _wrapped(request, *args, **kwargs):
        try:
            profile = request.user.farmer_profile
            if not profile.is_approved:
                messages.error(request, 'Your account is not approved.')
                return redirect('farmer_login')
        except FarmerProfile.DoesNotExist:
            messages.error(request, 'Access denied. Farmer account required.')
            return redirect('home')
        return view_func(request, *args, **kwargs)
    return _wrapped


@farmer_required
def dashboard(request):
    farmer = request.user.farmer_profile
    total_queries = Query.objects.filter(farmer=request.user).count()
    answered_queries = Query.objects.filter(farmer=request.user, status='answered').count()
    pending_queries = Query.objects.filter(farmer=request.user, status='pending').count()
    recent_queries = Query.objects.filter(farmer=request.user)[:5]
    context = {
        'farmer': farmer,
        'total_queries': total_queries,
        'answered_queries': answered_queries,
        'pending_queries': pending_queries,
        'recent_queries': recent_queries,
    }
    return render(request, 'farmer/dashboard.html', context)


@farmer_required
def view_schemes(request):
    schemes = Scheme.objects.filter(is_active=True).order_by('-created_at')
    return render(request, 'farmer/schemes.html', {'schemes': schemes})


@farmer_required
def view_crop_prices(request):
    prices = CropPrice.objects.all().order_by('crop_name')
    return render(request, 'farmer/crop_prices.html', {'prices': prices})


@farmer_required
def post_query(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        crop = request.POST.get('crop', '').strip()
        if title and description:
            Query.objects.create(
                farmer=request.user,
                title=title,
                description=description,
                crop=crop
            )
            messages.success(request, 'Your query has been submitted to experts!')
            return redirect('farmer_query_result')
        else:
            messages.error(request, 'Please fill in all required fields.')
    return render(request, 'farmer/post_query.html')


@farmer_required
def query_result(request):
    queries = Query.objects.filter(farmer=request.user).prefetch_related('responses')
    return render(request, 'farmer/query_result.html', {'queries': queries})


@farmer_required
def view_guides(request):
    language = request.GET.get('language', 'english')
    guides = Guide.objects.filter(is_active=True)
    context = {
        'guides': guides,
        'selected_language': language,
        'languages': [('english', 'English'), ('telugu', 'Telugu'), ('hindi', 'Hindi')],
    }
    return render(request, 'farmer/guides.html', context)


@farmer_required
def connect_farmers(request):
    crop = request.GET.get('crop', '')
    farmer_profile = request.user.farmer_profile
    if not crop:
        crop = farmer_profile.crop_grown

    similar_farmers = []
    if crop:
        profiles = FarmerProfile.objects.filter(
            crop_grown__icontains=crop,
            is_approved=True
        ).exclude(user=request.user)
        for p in profiles:
            similar_farmers.append({
                'name': p.user.get_full_name() or p.user.username,
                'phone': p.phone,
                'crop': p.crop_grown,
                'state': p.state,
                'land_area': p.land_area,
            })

    all_crops = FarmerProfile.objects.filter(is_approved=True).values_list(
        'crop_grown', flat=True).distinct()
    context = {
        'similar_farmers': similar_farmers,
        'searched_crop': crop,
        'all_crops': [c for c in all_crops if c],
    }
    return render(request, 'farmer/connect_farmers.html', context)


@farmer_required
def chatbot(request):
    return render(request, 'farmer/chatbot.html')


def chatbot_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '').lower().strip()
        except Exception:
            user_message = request.POST.get('message', '').lower().strip()

        response_text = get_chatbot_response(user_message)
        return JsonResponse({'response': response_text})
    return JsonResponse({'response': 'Please send a POST request.'})


def get_chatbot_response(message):
    # Check database FAQs first
    faqs = ChatbotFAQ.objects.filter(is_active=True)
    for faq in faqs:
        if faq.question_keyword.lower() in message:
            return faq.answer

    # Check query responses from experts
    responses = Response.objects.all().select_related('query')
    for resp in responses:
        if any(word in message for word in resp.query.title.lower().split()):
            return f"Based on expert advice: {resp.answer[:300]}..."

    # Hardcoded rule-based responses
    rules = {
        ('disease', 'pest', 'insect', 'blight', 'wilt', 'rot'):
            "For crop diseases, please upload an image in the AI Disease Detection section. Common diseases include fungal infections, bacterial blight, and viral diseases. Use neem oil spray as a first treatment.",
        ('fertilizer', 'manure', 'nutrient', 'npk', 'urea'):
            "Fertilizer recommendation depends on soil type and crop. Common fertilizers: Urea (nitrogen), DAP (phosphorus), MOP (potassium). Use our AI Fertilizer Recommendation tool for personalized advice.",
        ('water', 'irrigation', 'drip', 'flood'):
            "Drip irrigation saves 40-60% water compared to flood irrigation. Water your crops early morning or evening. Monitor soil moisture regularly.",
        ('wheat', 'paddy', 'rice', 'maize', 'corn', 'cotton', 'sugarcane', 'soybean'):
            "For crop-specific guidance, visit the Guides section. You can also post a query to our agricultural experts for personalized advice.",
        ('yield', 'production', 'harvest', 'output'):
            "To improve yield: use quality seeds, proper irrigation, balanced fertilizers, and timely pest control. Check our AI Yield Prediction tool for estimates.",
        ('price', 'market', 'mandi', 'rate', 'sell'):
            "Check current crop prices in the 'View Crop Prices' section. For market information, contact your local APMC mandi.",
        ('scheme', 'government', 'subsidy', 'loan', 'insurance'):
            "Check the 'Government Schemes' section for latest subsidies, loans, and insurance schemes like PM-KISAN, Fasal Bima Yojana, Kisan Credit Card.",
        ('soil', 'sandy', 'clay', 'loamy', 'ph'):
            "Soil health is crucial. Get a soil test done from your local KVK (Krishi Vigyan Kendra). pH 6-7 is ideal for most crops.",
        ('weather', 'rain', 'monsoon', 'temperature', 'climate'):
            "Monitor weather forecasts regularly. Our AI Yield Prediction considers weather conditions. Visit IMD website for weather updates.",
        ('hello', 'hi', 'hey', 'namaste', 'namaskar'):
            "Namaste! I am KisanSathi AI Chatbot. I can help you with crop diseases, fertilizers, schemes, prices, and more. What would you like to know?",
        ('help', 'support', 'assist'):
            "I can help you with: 1) Crop diseases 2) Fertilizer recommendations 3) Government schemes 4) Crop prices 5) Yield prediction. Just ask your question!",
        ('expert', 'query', 'question', 'ask'):
            "You can post queries to our agricultural experts using the 'Post Query' section. Experts will respond within 24 hours.",
        ('thank', 'thanks', 'dhanyawad'):
            "You're welcome! Happy farming! For more help, feel free to ask any time.",
    }

    for keywords, response in rules.items():
        if any(kw in message for kw in keywords):
            return response

    return ("I'm KisanSathi AI Assistant. I didn't fully understand your question. "
            "Please try asking about: crop diseases, fertilizers, government schemes, "
            "crop prices, weather, or soil health. You can also post a query to our experts!")

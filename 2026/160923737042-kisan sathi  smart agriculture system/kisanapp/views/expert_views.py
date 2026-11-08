"""
Expert Views - Dashboard, guide upload, query responses, AI verification
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from kisanapp.models import Guide, Query, Response, ExpertProfile
from kisanapp.ai_engine import predict_disease, suggest_pesticide


def expert_required(view_func):
    @login_required
    def _wrapped(request, *args, **kwargs):
        try:
            profile = request.user.expert_profile
            if not profile.is_approved:
                messages.error(request, 'Your account is not approved.')
                return redirect('expert_login')
        except ExpertProfile.DoesNotExist:
            messages.error(request, 'Access denied. Expert account required.')
            return redirect('home')
        return view_func(request, *args, **kwargs)
    return _wrapped


@expert_required
def dashboard(request):
    expert_profile = request.user.expert_profile
    total_guides = Guide.objects.filter(expert=request.user).count()
    pending_queries = Query.objects.filter(status='pending').count()
    answered_queries = Response.objects.filter(expert=request.user).count()
    recent_queries = Query.objects.filter(status='pending')[:5]
    context = {
        'expert': expert_profile,
        'total_guides': total_guides,
        'pending_queries': pending_queries,
        'answered_queries': answered_queries,
        'recent_queries': recent_queries,
    }
    return render(request, 'expert/dashboard.html', context)


@expert_required
def upload_guide(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        crop = request.POST.get('crop', '').strip()
        description = request.POST.get('description', '').strip()
        content_english = request.POST.get('content_english', '').strip()
        content_telugu = request.POST.get('content_telugu', '').strip()
        content_hindi = request.POST.get('content_hindi', '').strip()
        file = request.FILES.get('file')

        if title and crop and description:
            Guide.objects.create(
                expert=request.user,
                title=title, crop=crop, description=description,
                content_english=content_english,
                content_telugu=content_telugu,
                content_hindi=content_hindi,
                file=file,
            )
            messages.success(request, 'Guide uploaded successfully!')
            return redirect('expert_guides')
        else:
            messages.error(request, 'Please fill in all required fields.')

    return render(request, 'expert/upload_guide.html')


@expert_required
def view_guides(request):
    guides = Guide.objects.filter(expert=request.user).order_by('-created_at')
    return render(request, 'expert/guides.html', {'guides': guides})


@expert_required
def view_queries(request):
    queries = Query.objects.all().order_by('-created_at')
    return render(request, 'expert/queries.html', {'queries': queries})


@expert_required
def respond_query(request, query_id):
    query = get_object_or_404(Query, id=query_id)

    if request.method == 'POST':
        answer = request.POST.get('answer', '').strip()
        if answer:
            Response.objects.create(query=query, expert=request.user, answer=answer)
            query.status = 'answered'
            query.save()
            messages.success(request, 'Response submitted successfully!')
            return redirect('expert_queries')
        else:
            messages.error(request, 'Please enter a response.')

    existing_responses = Response.objects.filter(query=query)
    return render(request, 'expert/respond_query.html', {
        'query': query,
        'existing_responses': existing_responses
    })


@expert_required
def ai_suggestion_verify(request):
    result = None
    if request.method == 'POST':
        image = request.FILES.get('image')
        crop_type = request.POST.get('crop_type', 'default')
        if image:
            # Uses the SAME shared predict_disease() function as the Farmer view.
            prediction = predict_disease(image, crop_type)
            disease = prediction['disease']
            confidence = prediction['confidence']
            pesticide = suggest_pesticide(disease) if not prediction['is_low_conf'] else ''
            result = {
                'disease':    disease,
                'pesticide':  pesticide,
                'confidence': f"{confidence:.0%}",
                'is_low_conf': prediction['is_low_conf'],
            }
        else:
            messages.error(request, 'Please upload an image.')
    return render(request, 'expert/ai_verify.html', {'result': result})

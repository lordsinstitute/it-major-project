from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from kisanapp.models import CropPrice, Scheme, FarmerProfile, ExpertProfile, Query, Response


def admin_required(view_func):
    @login_required
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_staff:
            messages.error(request, 'Admin access required.')
            return redirect('admin_login')
        return view_func(request, *args, **kwargs)
    return _wrapped


@admin_required
def dashboard(request):
    context = {
        'total_farmers': FarmerProfile.objects.count(),
        'approved_farmers': FarmerProfile.objects.filter(is_approved=True).count(),
        'total_experts': ExpertProfile.objects.count(),
        'approved_experts': ExpertProfile.objects.filter(is_approved=True).count(),
        'total_queries': Query.objects.count(),
        'pending_queries': Query.objects.filter(status='pending').count(),
        'total_schemes': Scheme.objects.count(),
        'total_crop_prices': CropPrice.objects.count(),
    }
    return render(request, 'adminpanel/dashboard.html', context)


@admin_required
def approve_accounts(request):
    context = {
        'pending_farmers': FarmerProfile.objects.filter(is_approved=False),
        'pending_experts': ExpertProfile.objects.filter(is_approved=False),
        'approved_farmers': FarmerProfile.objects.filter(is_approved=True),
        'approved_experts': ExpertProfile.objects.filter(is_approved=True),
    }
    return render(request, 'adminpanel/approve_accounts.html', context)


@admin_required
def approve_farmer(request, farmer_id):
    profile = get_object_or_404(FarmerProfile, id=farmer_id)
    profile.is_approved = True
    profile.save()
    messages.success(request, f'Farmer {profile.user.username} approved successfully!')
    return redirect('admin_approve_accounts')


@admin_required
def approve_expert(request, expert_id):
    profile = get_object_or_404(ExpertProfile, id=expert_id)
    profile.is_approved = True
    profile.save()
    messages.success(request, f'Expert {profile.user.username} approved successfully!')
    return redirect('admin_approve_accounts')


@admin_required
def update_prices(request):
    prices = CropPrice.objects.all().order_by('crop_name')

    if request.method == 'POST':
        crop_name = request.POST.get('crop_name', '').strip()
        crop_type = request.POST.get('crop_type', 'other')
        price = request.POST.get('price_per_quintal', '').strip()
        market = request.POST.get('market_location', 'National Average').strip()

        if crop_name and price:
            obj, created = CropPrice.objects.get_or_create(
                crop_name=crop_name,
                defaults={'crop_type': crop_type, 'market_location': market, 'price_per_quintal': float(price) }
            )
            obj.price_per_quintal = float(price)
            obj.crop_type = crop_type
            obj.market_location = market
            obj.save()
            action = 'added' if created else 'updated'
            messages.success(request, f'Price for {crop_name} {action} successfully!')
            return redirect('admin_update_prices')
        else:
            messages.error(request, 'Please fill all required fields.')

    return render(request, 'adminpanel/update_prices.html', {
        'prices': prices,
        'crop_choices': CropPrice.CROP_CHOICES
    })


@admin_required
def delete_price(request, price_id):
    price = get_object_or_404(CropPrice, id=price_id)
    price.delete()
    messages.success(request, 'Price entry deleted.')
    return redirect('admin_update_prices')


@admin_required
def manage_schemes(request):
    schemes = Scheme.objects.all().order_by('-created_at')

    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        category = request.POST.get('category', 'scheme')
        description = request.POST.get('description', '').strip()
        eligibility = request.POST.get('eligibility', '').strip()
        benefits = request.POST.get('benefits', '').strip()
        how_to_apply = request.POST.get('how_to_apply', '').strip()
        deadline = request.POST.get('deadline') or None
        website_link = request.POST.get('website_link', '').strip()

        if title and description:
            Scheme.objects.create(
                title=title, category=category, description=description,
                eligibility=eligibility, benefits=benefits,
                how_to_apply=how_to_apply, deadline=deadline,
                website_link=website_link
            )
            messages.success(request, f'Scheme "{title}" added successfully!')
            return redirect('admin_schemes')
        else:
            messages.error(request, 'Please fill in title and description.')

    return render(request, 'adminpanel/schemes.html', {
        'schemes': schemes,
        'category_choices': Scheme.CATEGORY_CHOICES
    })


@admin_required
def delete_scheme(request, scheme_id):
    scheme = get_object_or_404(Scheme, id=scheme_id)
    scheme.delete()
    messages.success(request, 'Scheme deleted.')
    return redirect('admin_schemes')


@admin_required
def view_all_queries(request):
    queries = Query.objects.all().prefetch_related('responses').order_by('-created_at')
    return render(request, 'adminpanel/all_queries.html', {'queries': queries})

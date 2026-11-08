"""
Accounts Views - Registration, login, logout for all roles
"""
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from kisanapp.models import FarmerProfile, ExpertProfile
from django.contrib.auth.decorators import login_required


def farmer_signup(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        confirm_password = request.POST.get('confirm_password', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        phone = request.POST.get('phone', '').strip()
        address = request.POST.get('address', '').strip()
        land_area = request.POST.get('land_area', 0)
        crop_grown = request.POST.get('crop_grown', '').strip()
        state = request.POST.get('state', '').strip()

        if password != confirm_password:
            messages.error(request, 'Passwords do not match!')
            return render(request, 'accounts/farmer_signup.html')
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists!')
            return render(request, 'accounts/farmer_signup.html')

        user = User.objects.create_user(
            username=username, password=password,
            email=email, first_name=first_name, last_name=last_name
        )
        FarmerProfile.objects.create(
            user=user, phone=phone, address=address,
            land_area=float(land_area) if land_area else 0.0,
            crop_grown=crop_grown, state=state, is_approved=False
        )
        messages.success(request, 'Farmer registration successful! Please wait for admin approval.')
        return redirect('farmer_login')

    return render(request, 'accounts/farmer_signup.html')


def expert_signup(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        confirm_password = request.POST.get('confirm_password', '').strip()
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()
        phone = request.POST.get('phone', '').strip()
        qualification = request.POST.get('qualification', '').strip()
        specialization = request.POST.get('specialization', 'general')
        experience_years = request.POST.get('experience_years', 0)
        organization = request.POST.get('organization', '').strip()

        if password != confirm_password:
            messages.error(request, 'Passwords do not match!')
            return render(request, 'accounts/expert_signup.html')
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists!')
            return render(request, 'accounts/expert_signup.html')

        user = User.objects.create_user(
            username=username, password=password,
            email=email, first_name=first_name, last_name=last_name
        )
        ExpertProfile.objects.create(
            user=user, phone=phone, qualification=qualification,
            specialization=specialization,
            experience_years=int(experience_years) if experience_years else 0,
            organization=organization, is_approved=False
        )
        messages.success(request, 'Expert registration successful! Please wait for admin approval.')
        return redirect('expert_login')

    specializations = ExpertProfile.SPECIALIZATION_CHOICES
    return render(request, 'accounts/expert_signup.html', {'specializations': specializations})


def farmer_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        user = authenticate(request, username=username, password=password)
        if user:
            try:
                profile = user.farmer_profile
                if not profile.is_approved:
                    messages.error(request, 'Your account is not approved yet. Please contact admin.')
                    return render(request, 'accounts/farmer_login.html')
                login(request, user)
                return redirect('farmer_dashboard')
            except FarmerProfile.DoesNotExist:
                messages.error(request, 'No farmer account found with these credentials.')
        else:
            messages.error(request, 'Invalid username or password!')
    return render(request, 'accounts/farmer_login.html')


def expert_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        user = authenticate(request, username=username, password=password)
        if user:
            try:
                profile = user.expert_profile
                if not profile.is_approved:
                    messages.error(request, 'Your account is not approved yet. Please contact admin.')
                    return render(request, 'accounts/expert_login.html')
                login(request, user)
                return redirect('expert_dashboard')
            except ExpertProfile.DoesNotExist:
                messages.error(request, 'No expert account found with these credentials.')
        else:
            messages.error(request, 'Invalid username or password!')
    return render(request, 'accounts/expert_login.html')


def admin_login(request):
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        user = authenticate(request, username=username, password=password)
        if user and user.is_staff:
            login(request, user)
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid admin credentials!')
    return render(request, 'accounts/admin_login.html')


@login_required
def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('home')

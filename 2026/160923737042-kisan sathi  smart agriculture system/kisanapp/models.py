"""
KisanSathi - kisanapp/models.py
Combined models from: accounts, farmer, expert, adminpanel, ai_module
"""
from django.db import models
from django.contrib.auth.models import User


# ── Accounts / Profile Models ───────────────────────────────────────────────

class UserProfile(models.Model):
    """Extended User Profile with role information"""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('farmer', 'Farmer'),
        ('expert', 'Expert'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='farmer')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class FarmerProfile(models.Model):
    """Farmer-specific profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    phone = models.CharField(max_length=15)
    address = models.TextField()
    land_area = models.FloatField(default=0.0, help_text='Land area in acres')
    crop_grown = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Farmer: {self.user.get_full_name() or self.user.username}"


class ExpertProfile(models.Model):
    """Expert-specific profile"""
    SPECIALIZATION_CHOICES = [
        ('crop_disease', 'Crop Disease'),
        ('soil_science', 'Soil Science'),
        ('pesticides', 'Pesticides'),
        ('fertilizers', 'Fertilizers'),
        ('general', 'General Agriculture'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='expert_profile')
    phone = models.CharField(max_length=15)
    qualification = models.CharField(max_length=200)
    specialization = models.CharField(max_length=50, choices=SPECIALIZATION_CHOICES, default='general')
    experience_years = models.IntegerField(default=0)
    organization = models.CharField(max_length=200, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Expert: {self.user.get_full_name() or self.user.username}"


# ── Farmer App Models ───────────────────────────────────────────────────────

class Query(models.Model):
    """Farmer queries posted to experts"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('answered', 'Answered'),
    ]
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queries')
    title = models.CharField(max_length=200)
    description = models.TextField()
    crop = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Query: {self.title} by {self.farmer.username}"

    class Meta:
        ordering = ['-created_at']


class Response(models.Model):
    """Expert responses to farmer queries"""
    query = models.ForeignKey(Query, on_delete=models.CASCADE, related_name='responses')
    expert = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expert_responses')
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response to: {self.query.title}"

    class Meta:
        ordering = ['-created_at']


class ChatbotFAQ(models.Model):
    """Rule-based chatbot FAQs"""
    question_keyword = models.CharField(max_length=200, help_text='Keyword to match in user input')
    answer = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"FAQ: {self.question_keyword}"


# ── Expert App Models ───────────────────────────────────────────────────────

class Guide(models.Model):
    """Expert-uploaded guidance materials"""
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('telugu', 'Telugu'),
        ('hindi', 'Hindi'),
    ]
    expert = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guides')
    title = models.CharField(max_length=200)
    crop = models.CharField(max_length=100)
    description = models.TextField()
    content_english = models.TextField(blank=True, help_text='Content in English')
    content_telugu = models.TextField(blank=True, help_text='Content in Telugu')
    content_hindi = models.TextField(blank=True, help_text='Content in Hindi')
    file = models.FileField(upload_to='guides/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Guide: {self.title} by {self.expert.username}"

    class Meta:
        ordering = ['-created_at']


# ── AdminPanel Models ───────────────────────────────────────────────────────

class CropPrice(models.Model):
    """Current market prices for crops"""
    CROP_CHOICES = [
        ('wheat', 'Wheat'),
        ('rice', 'Rice/Paddy'),
        ('maize', 'Maize/Corn'),
        ('cotton', 'Cotton'),
        ('sugarcane', 'Sugarcane'),
        ('soybean', 'Soybean'),
        ('groundnut', 'Groundnut'),
        ('sunflower', 'Sunflower'),
        ('tomato', 'Tomato'),
        ('onion', 'Onion'),
        ('potato', 'Potato'),
        ('chilli', 'Chilli'),
        ('turmeric', 'Turmeric'),
        ('other', 'Other'),
    ]
    crop_name = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=20, choices=CROP_CHOICES, default='other')
    price_per_quintal = models.DecimalField(max_digits=10, decimal_places=2,
                                            help_text='Price in INR per quintal')
    market_location = models.CharField(max_length=100, default='National Average')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.crop_name} - ₹{self.price_per_quintal}/qtl"

    class Meta:
        ordering = ['crop_name']


class Scheme(models.Model):
    """Government schemes and news"""
    CATEGORY_CHOICES = [
        ('scheme', 'Government Scheme'),
        ('insurance', 'Insurance'),
        ('loan', 'Loan/Credit'),
        ('subsidy', 'Subsidy'),
        ('news', 'Agricultural News'),
    ]
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='scheme')
    description = models.TextField()
    eligibility = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    how_to_apply = models.TextField(blank=True)
    deadline = models.DateField(null=True, blank=True)
    website_link = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.category})"

    class Meta:
        ordering = ['-created_at']


# ── AI Module Models ────────────────────────────────────────────────────────

class AIResult(models.Model):
    """Stores results of AI predictions"""
    PREDICTION_TYPES = [
        ('disease', 'Disease Detection'),
        ('yield', 'Yield Prediction'),
        ('fertilizer', 'Fertilizer Recommendation'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_results')
    prediction_type = models.CharField(max_length=20, choices=PREDICTION_TYPES)
    input_data = models.TextField(default='{}', help_text='Input parameters as JSON')
    result = models.TextField()
    image = models.ImageField(upload_to='crop_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI {self.prediction_type} for {self.user.username} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']

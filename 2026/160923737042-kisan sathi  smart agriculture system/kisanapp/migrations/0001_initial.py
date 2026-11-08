# Generated migration for kisanapp (combined from all original apps)

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Accounts / Profile Models ────────────────────────────────────
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('farmer', 'Farmer'), ('expert', 'Expert')], default='farmer', max_length=10)),
                ('phone', models.CharField(blank=True, max_length=15)),
                ('address', models.TextField(blank=True)),
                ('is_approved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='FarmerProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=15)),
                ('address', models.TextField()),
                ('land_area', models.FloatField(default=0.0, help_text='Land area in acres')),
                ('crop_grown', models.CharField(blank=True, max_length=100)),
                ('state', models.CharField(blank=True, max_length=50)),
                ('is_approved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='farmer_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ExpertProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=15)),
                ('qualification', models.CharField(max_length=200)),
                ('specialization', models.CharField(choices=[('crop_disease', 'Crop Disease'), ('soil_science', 'Soil Science'), ('pesticides', 'Pesticides'), ('fertilizers', 'Fertilizers'), ('general', 'General Agriculture')], default='general', max_length=50)),
                ('experience_years', models.IntegerField(default=0)),
                ('organization', models.CharField(blank=True, max_length=200)),
                ('is_approved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='expert_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        # ── Farmer App Models ────────────────────────────────────────────
        migrations.CreateModel(
            name='Query',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('crop', models.CharField(blank=True, max_length=100)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('answered', 'Answered')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('farmer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queries', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Response',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('answer', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='kisanapp.Query')),
                ('expert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expert_responses', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='ChatbotFAQ',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_keyword', models.CharField(help_text='Keyword to match in user input', max_length=200)),
                ('answer', models.TextField()),
                ('category', models.CharField(blank=True, max_length=100)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        # ── Expert App Models ────────────────────────────────────────────
        migrations.CreateModel(
            name='Guide',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('crop', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('content_english', models.TextField(blank=True, help_text='Content in English')),
                ('content_telugu', models.TextField(blank=True, help_text='Content in Telugu')),
                ('content_hindi', models.TextField(blank=True, help_text='Content in Hindi')),
                ('file', models.FileField(blank=True, null=True, upload_to='guides/')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('expert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='guides', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        # ── AdminPanel Models ────────────────────────────────────────────
        migrations.CreateModel(
            name='CropPrice',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('crop_name', models.CharField(max_length=100)),
                ('crop_type', models.CharField(choices=[('wheat', 'Wheat'), ('rice', 'Rice/Paddy'), ('maize', 'Maize/Corn'), ('cotton', 'Cotton'), ('sugarcane', 'Sugarcane'), ('soybean', 'Soybean'), ('groundnut', 'Groundnut'), ('sunflower', 'Sunflower'), ('tomato', 'Tomato'), ('onion', 'Onion'), ('potato', 'Potato'), ('chilli', 'Chilli'), ('turmeric', 'Turmeric'), ('other', 'Other')], default='other', max_length=20)),
                ('price_per_quintal', models.DecimalField(decimal_places=2, help_text='Price in INR per quintal', max_digits=10)),
                ('market_location', models.CharField(default='National Average', max_length=100)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['crop_name']},
        ),
        migrations.CreateModel(
            name='Scheme',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('category', models.CharField(choices=[('scheme', 'Government Scheme'), ('insurance', 'Insurance'), ('loan', 'Loan/Credit'), ('subsidy', 'Subsidy'), ('news', 'Agricultural News')], default='scheme', max_length=20)),
                ('description', models.TextField()),
                ('eligibility', models.TextField(blank=True)),
                ('benefits', models.TextField(blank=True)),
                ('how_to_apply', models.TextField(blank=True)),
                ('deadline', models.DateField(blank=True, null=True)),
                ('website_link', models.URLField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        # ── AI Module Models ─────────────────────────────────────────────
        migrations.CreateModel(
            name='AIResult',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prediction_type', models.CharField(choices=[('disease', 'Disease Detection'), ('yield', 'Yield Prediction'), ('fertilizer', 'Fertilizer Recommendation')], max_length=20)),
                ('input_data', models.TextField(default='{}', help_text='Input parameters as JSON')),
                ('result', models.TextField()),
                ('image', models.ImageField(blank=True, null=True, upload_to='crop_images/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_results', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]

"""
Management command to set up initial data for KisanSathi.
Usage: python manage.py setup_initial_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from kisanapp.models import CropPrice, Scheme, ChatbotFAQ, FarmerProfile, ExpertProfile


class Command(BaseCommand):
    help = 'Load initial sample data for KisanSathi'

    def handle(self, *args, **kwargs):
        self.stdout.write('Setting up KisanSathi initial data...\n')

        # ── Admin user ──────────────────────────────────────────────────
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin', password='admin',
                email='admin@kisansathi.com',
                first_name='Government', last_name='Admin'
            )
            self.stdout.write(self.style.SUCCESS('✓ Admin user created (admin/admin)'))
        else:
            self.stdout.write('  Admin user already exists.')

        # ── Crop Prices ─────────────────────────────────────────────────
        prices = [
            ('Wheat',      'wheat',      2150.00, 'National Average'),
            ('Rice/Paddy', 'rice',       1940.00, 'National Average'),
            ('Maize',      'maize',      1870.00, 'National Average'),
            ('Cotton',     'cotton',     6620.00, 'National Average'),
            ('Sugarcane',  'sugarcane',   315.00, 'National Average'),
            ('Soybean',    'soybean',    4300.00, 'National Average'),
            ('Groundnut',  'groundnut',  5550.00, 'National Average'),
            ('Sunflower',  'sunflower',  5800.00, 'National Average'),
            ('Tomato',     'tomato',     1200.00, 'Hyderabad Mandi'),
            ('Onion',      'onion',      1800.00, 'Lasalgaon Mandi'),
            ('Potato',     'potato',     1200.00, 'Agra Mandi'),
            ('Chilli',     'chilli',     7500.00, 'Guntur Mandi'),
            ('Turmeric',   'other',      7200.00, 'Nizamabad Mandi'),
        ]
        for name, ctype, price, market in prices:
            CropPrice.objects.get_or_create(
                crop_name=name,
                defaults={'crop_type': ctype, 'price_per_quintal': price,
                          'market_location': market}
            )
        self.stdout.write(self.style.SUCCESS(f'✓ {len(prices)} crop prices loaded'))

        # ── Government Schemes ──────────────────────────────────────────
        schemes = [
            {
                'title': 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
                'category': 'scheme',
                'description': 'Financial support of Rs. 6000 per year to all landholding farmer families across India.',
                'eligibility': 'All landholding farmers with cultivable land.',
                'benefits': 'Rs. 6000/year in 3 equal installments of Rs. 2000 directly to bank account.',
                'how_to_apply': 'Register at local CSC center or pmkisan.gov.in with Aadhaar and bank details.',
                'website_link': 'https://pmkisan.gov.in',
            },
            {
                'title': 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
                'category': 'insurance',
                'description': 'Comprehensive crop insurance scheme to provide financial support in case of crop loss due to natural calamities.',
                'eligibility': 'All farmers growing notified crops in notified areas.',
                'benefits': 'Insurance coverage for crop loss. Premium: 2% for Kharif, 1.5% for Rabi crops.',
                'how_to_apply': 'Apply through nearest bank or agriculture department before sowing season.',
                'website_link': 'https://pmfby.gov.in',
            },
            {
                'title': 'Kisan Credit Card (KCC)',
                'category': 'loan',
                'description': 'Easy credit facility for farmers to meet agricultural needs including crop production, post-harvest expenses.',
                'eligibility': 'All farmers including tenant farmers, sharecroppers, and SHG members.',
                'benefits': 'Credit up to Rs. 3 lakh at 4% interest per annum with 3% interest subvention.',
                'how_to_apply': 'Apply at nearest bank branch with land documents and Aadhaar card.',
                'website_link': 'https://agricoop.nic.in',
            },
            {
                'title': 'Soil Health Card Scheme',
                'category': 'scheme',
                'description': 'Provides farmers with soil health cards showing nutrient status and personalized fertilizer recommendations.',
                'eligibility': 'All farmers across India.',
                'benefits': 'Free soil testing every 2 years. Personalized fertilizer dose recommendations.',
                'how_to_apply': 'Contact nearest Krishi Vigyan Kendra (KVK) or agriculture department office.',
                'website_link': 'https://soilhealth.dac.gov.in',
            },
            {
                'title': 'PM Krishi Sinchai Yojana (PMKSY)',
                'category': 'subsidy',
                'description': 'Har Khet Ko Pani - Aur Paani Ka Sahi Istemal. Subsidy on micro-irrigation systems.',
                'eligibility': 'All farmers with agricultural land.',
                'benefits': 'Up to 90% subsidy on drip/sprinkler irrigation for SC/ST farmers; 75% for general category.',
                'how_to_apply': 'Apply through state agriculture department or online at pmksy.gov.in.',
                'website_link': 'https://pmksy.gov.in',
            },
        ]
        for s in schemes:
            Scheme.objects.get_or_create(title=s['title'], defaults=s)
        self.stdout.write(self.style.SUCCESS(f'✓ {len(schemes)} schemes loaded'))

        # ── Chatbot FAQs ────────────────────────────────────────────────
        faqs = [
            ('paddy', 'Paddy needs well-drained clay soils (pH 5.5–6.5). Temperature 21–37°C. Apply 120kg Urea + 60kg DAP + 30kg MOP per acre in split doses.', 'crops'),
            ('neem', 'Neem oil (1500 ppm) is organic and safe. Mix 5ml per litre of water and spray. Effective against aphids, whitefly, and leaf miners.', 'pesticides'),
            ('drip irrigation', 'Drip irrigation saves 40–60% water. Govt subsidy up to 90% for SC/ST under PMKSY. Cost: Rs 40,000–80,000 per acre.', 'irrigation'),
            ('organic', 'Organic farming avoids synthetic chemicals. Use compost, vermicompost, bio-pesticides. APEDA certification needed for organic premium pricing.', 'general'),
            ('msp', 'MSP (Minimum Support Price) is set by CACP and approved by Cabinet. Check current MSP at agricoop.nic.in or contact your local mandi.', 'market'),
            ('sowing', 'Sowing time: Wheat - Nov (Rabi), Rice - June-July (Kharif), Cotton - April-May. Use certified seeds for better germination.', 'crops'),
        ]
        for kw, ans, cat in faqs:
            ChatbotFAQ.objects.get_or_create(
                question_keyword=kw,
                defaults={'answer': ans, 'category': cat, 'is_active': True}
            )
        self.stdout.write(self.style.SUCCESS(f'✓ {len(faqs)} chatbot FAQs loaded'))

        # ── Sample Expert ───────────────────────────────────────────────
        if not User.objects.filter(username='expert1').exists():
            eu = User.objects.create_user(
                username='expert1', password='expert123',
                email='expert@kisansathi.com',
                first_name='Dr. Rajesh', last_name='Kumar'
            )
            ExpertProfile.objects.create(
                user=eu, phone='9876543210',
                qualification='Ph.D. Agriculture, IARI New Delhi',
                specialization='crop_disease', experience_years=15,
                organization='Indian Council of Agricultural Research (ICAR)',
                is_approved=True
            )
            self.stdout.write(self.style.SUCCESS('✓ Sample expert created (expert1/expert123)'))

        # ── Sample Farmer ───────────────────────────────────────────────
        if not User.objects.filter(username='farmer1').exists():
            fu = User.objects.create_user(
                username='farmer1', password='farmer123',
                email='farmer@kisansathi.com',
                first_name='Ramesh', last_name='Yadav'
            )
            FarmerProfile.objects.create(
                user=fu, phone='9123456789',
                address='Village Rampur, Dist. Warangal, Telangana',
                land_area=5.0, crop_grown='Rice',
                state='Telangana', is_approved=True
            )
            self.stdout.write(self.style.SUCCESS('✓ Sample farmer created (farmer1/farmer123)'))

        self.stdout.write('\n' + self.style.SUCCESS(
            '✅ KisanSathi setup complete!\n'
            '   Admin:   admin / admin\n'
            '   Expert:  expert1 / expert123\n'
            '   Farmer:  farmer1 / farmer123\n'
        ))

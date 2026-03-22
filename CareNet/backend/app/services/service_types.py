"""
Service Types Configuration for CareNet Platform
Defines all available service types with pricing, descriptions, and requirements
"""

SERVICE_TYPES = {
    'medical': {
        'name': 'Medical Appointment',
        'price': 45,
        'description': 'Accompany to doctor visits, hospital appointments, or medical procedures',
        'duration_hours': 2,
        'required_skills': ['healthcare', 'first_aid', 'patience'],
        'icon': '🏥',
        'category': 'health'
    },
    'medication': {
        'name': 'Medication Management',
        'price': 35,
        'description': 'Help organize, remind, and administer medications safely',
        'duration_hours': 1,
        'required_skills': ['healthcare', 'organization', 'attention_to_detail'],
        'icon': '💊',
        'category': 'health'
    },
    'personal_care': {
        'name': 'Personal Care & Hygiene',
        'price': 40,
        'description': 'Assistance with bathing, dressing, grooming, and personal hygiene',
        'duration_hours': 1.5,
        'required_skills': ['healthcare', 'dignity', 'patience', 'sensitivity'],
        'icon': '🧴',
        'category': 'personal'
    },
    'meal_prep': {
        'name': 'Meal Preparation',
        'price': 35,
        'description': 'Prepare nutritious meals, help with eating, and meal planning',
        'duration_hours': 1.5,
        'required_skills': ['cooking', 'nutrition', 'food_safety'],
        'icon': '🍳',
        'category': 'household'
    },
    'house_cleaning': {
        'name': 'House Cleaning',
        'price': 30,
        'description': 'Light cleaning, tidying, laundry, and household organization',
        'duration_hours': 2,
        'required_skills': ['cleaning', 'organization', 'physical_work'],
        'icon': '🧹',
        'category': 'household'
    },
    'errands': {
        'name': 'Shopping & Errands',
        'price': 30,
        'description': 'Grocery shopping, picking up prescriptions, post office runs',
        'duration_hours': 1.5,
        'required_skills': ['shopping', 'transportation', 'organization'],
        'icon': '🛒',
        'category': 'errands'
    },
    'transportation': {
        'name': 'Transportation',
        'price': 25,
        'description': 'Safe transportation to appointments, shopping, or social activities',
        'duration_hours': 1,
        'required_skills': ['driving', 'safety', 'navigation'],
        'icon': '🚗',
        'category': 'transportation'
    },
    'companionship': {
        'name': 'Companionship & Chat',
        'price': 25,
        'description': 'Friendly conversation, emotional support, and social interaction',
        'duration_hours': 1,
        'required_skills': ['communication', 'listening', 'patience'],
        'icon': '💬',
        'category': 'social'
    },
    'tech_help': {
        'name': 'Technology Help',
        'price': 30,
        'description': 'Help with smartphones, computers, smart home devices, and online services',
        'duration_hours': 1,
        'required_skills': ['technology', 'teaching', 'patience'],
        'icon': '📱',
        'category': 'technology'
    },
    'gardening': {
        'name': 'Gardening & Yard Work',
        'price': 35,
        'description': 'Light gardening, plant care, and outdoor maintenance',
        'duration_hours': 1.5,
        'required_skills': ['gardening', 'physical_work', 'plants'],
        'icon': '🌱',
        'category': 'outdoor'
    },
    'pet_care': {
        'name': 'Pet Care',
        'price': 25,
        'description': 'Feed, walk, and care for pets while owner is away',
        'duration_hours': 1,
        'required_skills': ['animals', 'responsibility', 'care'],
        'icon': '🐕',
        'category': 'pet'
    },
    'light_repairs': {
        'name': 'Light Repairs',
        'price': 40,
        'description': 'Basic home repairs, bulb changes, and minor maintenance',
        'duration_hours': 1.5,
        'required_skills': ['repairs', 'tools', 'handyman'],
        'icon': '🔧',
        'category': 'maintenance'
    },
    'social_activities': {
        'name': 'Social Activities',
        'price': 30,
        'description': 'Accompany to community events, classes, or social gatherings',
        'duration_hours': 2,
        'required_skills': ['social', 'companionship', 'organization'],
        'icon': '🎭',
        'category': 'social'
    },
    'reading': {
        'name': 'Reading & Storytelling',
        'price': 25,
        'description': 'Read books, newspapers, or share stories and memories',
        'duration_hours': 1,
        'required_skills': ['reading', 'communication', 'patience'],
        'icon': '📖',
        'category': 'social'
    },
    'exercise': {
        'name': 'Light Exercise & Mobility',
        'price': 35,
        'description': 'Gentle exercises, walking assistance, and mobility support',
        'duration_hours': 1,
        'required_skills': ['fitness', 'healthcare', 'motivation'],
        'icon': '🏃‍♂️',
        'category': 'health'
    },
    'memory_games': {
        'name': 'Memory Games & Activities',
        'price': 30,
        'description': 'Cognitive games, puzzles, and memory-enhancing activities',
        'duration_hours': 1,
        'required_skills': ['cognitive', 'patience', 'teaching'],
        'icon': '🧠',
        'category': 'cognitive'
    },
    'mail_bills': {
        'name': 'Mail & Bill Management',
        'price': 25,
        'description': 'Sort mail, pay bills, and manage important paperwork',
        'duration_hours': 1,
        'required_skills': ['organization', 'administration', 'attention_to_detail'],
        'icon': '📬',
        'category': 'administrative'
    },
    'laundry': {
        'name': 'Laundry & Ironing',
        'price': 30,
        'description': 'Wash, dry, fold clothes and light ironing',
        'duration_hours': 1,
        'required_skills': ['housekeeping', 'organization', 'care'],
        'icon': '👔',
        'category': 'household'
    },
    'plant_care': {
        'name': 'Plant Care',
        'price': 20,
        'description': 'Water plants, light gardening, and indoor plant maintenance',
        'duration_hours': 0.5,
        'required_skills': ['plants', 'care', 'responsibility'],
        'icon': '🌿',
        'category': 'household'
    }
}

# Service categories for grouping
SERVICE_CATEGORIES = {
    'health': ['medical', 'medication', 'personal_care', 'exercise'],
    'household': ['meal_prep', 'house_cleaning', 'laundry', 'plant_care'],
    'social': ['companionship', 'social_activities', 'reading'],
    'errands': ['errands', 'transportation'],
    'technology': ['tech_help'],
    'outdoor': ['gardening'],
    'pet': ['pet_care'],
    'maintenance': ['light_repairs'],
    'cognitive': ['memory_games'],
    'administrative': ['mail_bills']
}

def get_service_info(service_type):
    """Get detailed information about a service type."""
    return SERVICE_TYPES.get(service_type)

def get_services_by_category(category):
    """Get all services in a specific category."""
    if category not in SERVICE_CATEGORIES:
        return []
    return [SERVICE_TYPES[service_id] for service_id in SERVICE_CATEGORIES[category]]

def get_all_service_types():
    """Get all available service types."""
    return list(SERVICE_TYPES.keys())

def calculate_service_price(service_type, duration_hours=None):
    """Calculate price for a service (hourly or fixed rate)."""
    service = get_service_info(service_type)
    if not service:
        return 0

    if duration_hours:
        # Calculate hourly rate
        base_price = service['price']
        standard_duration = service['duration_hours']
        hourly_rate = base_price / standard_duration
        return round(hourly_rate * duration_hours, 2)
    else:
        return service['price']
"""
Demo data and persistent storage for SOS application
This module handles demo users and persistent alert storage
"""
import json
import os
from datetime import datetime
from typing import Dict, List

# Path to persistent storage file
STORAGE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
ALERTS_FILE = os.path.join(STORAGE_DIR, 'alerts.json')
USERS_FILE = os.path.join(STORAGE_DIR, 'users.json')

# Ensure data directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)

# Demo Users with predefined roles
DEMO_USERS = {
    # Admin
    "+919876543210": {
        "id": "admin-001",
        "phone": "+919876543210",
        "name": "Admin User",
        "role": "admin",
        "email": "admin@safenow.com",
        "is_verified": True
    },
    
    # Volunteers (Responders)
    "+919876543211": {
        "id": "volunteer-001",
        "phone": "+919876543211",
        "name": "John Doe",
        "role": "volunteer",
        "email": "john.doe@safenow.com",
        "is_verified": True,
        "specialization": "Medical"
    },
    "+919876543212": {
        "id": "volunteer-002",
        "phone": "+919876543212",
        "name": "Jane Smith",
        "role": "volunteer",
        "email": "jane.smith@safenow.com",
        "is_verified": True,
        "specialization": "Fire & Rescue"
    },
    "+919876543213": {
        "id": "volunteer-003",
        "phone": "+919876543213",
        "name": "Mike Johnson",
        "role": "volunteer",
        "email": "mike.johnson@safenow.com",
        "is_verified": True,
        "specialization": "Police"
    },
    
    # Regular Citizens
    "+919876543214": {
        "id": "citizen-001",
        "phone": "+919876543214",
        "name": "Alice Brown",
        "role": "citizen",
        "email": "alice.brown@example.com",
        "is_verified": True
    },
    "+919876543215": {
        "id": "citizen-002",
        "phone": "+919876543215",
        "name": "Bob Wilson",
        "role": "citizen",
        "email": "bob.wilson@example.com",
        "is_verified": True
    },
    "+919876543216": {
        "id": "citizen-003",
        "phone": "+919876543216",
        "name": "Carol Davis",
        "role": "citizen",
        "email": "carol.davis@example.com",
        "is_verified": True
    },
    "+919876543217": {
        "id": "citizen-004",
        "phone": "+919876543217",
        "name": "David Miller",
        "role": "citizen",
        "email": "david.miller@example.com",
        "is_verified": True
    },
    "+919876543218": {
        "id": "citizen-005",
        "phone": "+919876543218",
        "name": "Emma Garcia",
        "role": "citizen",
        "email": "emma.garcia@example.com",
        "is_verified": True
    }
}

# OTP codes for demo users (for easy login)
DEMO_OTP = "123456"


def load_alerts() -> Dict:
    """Load alerts from persistent storage"""
    if os.path.exists(ALERTS_FILE):
        try:
            with open(ALERTS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading alerts: {e}")
    return {}


def save_alerts(alerts: Dict):
    """Save alerts to persistent storage"""
    try:
        with open(ALERTS_FILE, 'w') as f:
            json.dump(alerts, f, indent=2, default=str)
        print(f"Saved {len(alerts)} alerts to persistent storage")
    except Exception as e:
        print(f"Error saving alerts: {e}")


def load_users() -> Dict:
    """Load users from persistent storage"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r') as f:
                stored_users = json.load(f)
                # Merge with demo users (demo users take precedence)
                stored_users.update(DEMO_USERS)
                return stored_users
        except Exception as e:
            print(f"Error loading users: {e}")
    return DEMO_USERS.copy()


def save_users(users: Dict):
    """Save users to persistent storage"""
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2, default=str)
        print(f"Saved {len(users)} users to persistent storage")
    except Exception as e:
        print(f"Error saving users: {e}")


def get_user_by_phone(phone: str) -> Dict:
    """Get user by phone number"""
    users = load_users()
    return users.get(phone)


def is_demo_user(phone: str) -> bool:
    """Check if phone belongs to a demo user"""
    return phone in DEMO_USERS


def get_demo_otp() -> str:
    """Get the demo OTP code"""
    return DEMO_OTP


def get_user_role(phone: str) -> str:
    """Get user role by phone number"""
    user = get_user_by_phone(phone)
    return user.get("role", "citizen") if user else "citizen"


# Emergency Contacts Storage
EMERGENCY_CONTACTS_FILE = os.path.join(STORAGE_DIR, 'emergency_contacts.json')

# Default emergency contacts (system-wide)
DEFAULT_EMERGENCY_CONTACTS = [
    {
        "id": "default-1",
        "user_id": None,
        "name": "Emergency Services (Police)",
        "phone": "100",
        "relationship": "emergency",
        "priority": 1,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "default-2",
        "user_id": None,
        "name": "Ambulance / Medical Emergency",
        "phone": "102",
        "relationship": "medical",
        "priority": 2,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "default-3",
        "user_id": None,
        "name": "Fire Department",
        "phone": "101",
        "relationship": "fire",
        "priority": 3,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "default-4",
        "user_id": None,
        "name": "Women Helpline",
        "phone": "1091",
        "relationship": "helpline",
        "priority": 4,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "default-5",
        "user_id": None,
        "name": "Child Helpline",
        "phone": "1098",
        "relationship": "helpline",
        "priority": 5,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "default-6",
        "user_id": None,
        "name": "National Emergency Number",
        "phone": "112",
        "relationship": "emergency",
        "priority": 6,
        "is_default": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]


def load_emergency_contacts() -> List[Dict]:
    """Load emergency contacts from file"""
    if os.path.exists(EMERGENCY_CONTACTS_FILE):
        try:
            with open(EMERGENCY_CONTACTS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading emergency contacts: {e}")
    return []


def save_emergency_contacts(contacts: List[Dict]) -> None:
    """Save emergency contacts to file"""
    try:
        with open(EMERGENCY_CONTACTS_FILE, 'w') as f:
            json.dump(contacts, f, indent=2, default=str)
    except Exception as e:
        print(f"Error saving emergency contacts: {e}")


def get_user_emergency_contacts(user_id: str) -> List[Dict]:
    """Get all emergency contacts for a user (defaults + user-specific)"""
    user_contacts = load_emergency_contacts()
    # Filter user-specific contacts
    filtered_contacts = [c for c in user_contacts if c.get('user_id') == user_id]
    # Combine with default contacts
    return DEFAULT_EMERGENCY_CONTACTS + filtered_contacts


def add_emergency_contact(user_id: str, contact: Dict) -> Dict:
    """Add a new emergency contact for a user"""
    contacts = load_emergency_contacts()
    contact['user_id'] = user_id
    contact['is_default'] = False
    contact['created_at'] = datetime.now().isoformat()
    contact['updated_at'] = datetime.now().isoformat()
    contacts.append(contact)
    save_emergency_contacts(contacts)
    return contact


def delete_emergency_contact(user_id: str, contact_id: str) -> bool:
    """Delete an emergency contact"""
    contacts = load_emergency_contacts()
    # Find the contact
    contact = next((c for c in contacts if c.get('id') == contact_id), None)
    
    if not contact:
        return False
    
    # Check if it's a default contact
    if contact.get('is_default'):
        return False
    
    # Check ownership
    if contact.get('user_id') != user_id:
        return False
    
    # Remove the contact
    contacts = [c for c in contacts if c.get('id') != contact_id]
    save_emergency_contacts(contacts)
    return True


def initialize_demo_data():
    """Initialize demo users and load existing data"""
    print("=" * 60)
    print("INITIALIZING DEMO DATA")
    print("=" * 60)
    
    # Load existing data
    users = load_users()
    alerts = load_alerts()
    
    print(f"\nLoaded {len(users)} users")
    print(f"Loaded {len(alerts)} alerts")
    
    print("\nDemo Users Available:")
    print("-" * 60)
    print(f"{'Phone':<15} {'Name':<20} {'Role':<12} {'OTP':<10}")
    print("-" * 60)
    for phone, user in DEMO_USERS.items():
        print(f"{phone:<15} {user['name']:<20} {user['role']:<12} {DEMO_OTP:<10}")
    print("-" * 60)
    
    print("\n✓ Demo data initialized successfully")
    print("=" * 60)
    
    return users, alerts

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-this-in-production')
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
    PORT = int(os.environ.get('PORT', 8000))
    
    # CORS settings
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
    
    @property
    def is_production(self):
        return self.ENVIRONMENT == 'production'

config = Config()
import os
from databases import Database

# Use cloud PostgreSQL database on Render
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow')

database = Database(DATABASE_URL)

async def connect_db():
    await database.connect()

async def disconnect_db():
    await database.disconnect()

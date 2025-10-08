import os
from databases import Database

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://sos:sos_pass@localhost:5432/sosdb')

database = Database(DATABASE_URL)

async def connect_db():
    await database.connect()

async def disconnect_db():
    await database.disconnect()

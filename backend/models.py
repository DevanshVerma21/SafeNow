from sqlalchemy import Table, Column, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import MetaData

metadata = MetaData()

users = Table(
    'users', metadata,
    Column('id', UUID(as_uuid=True), primary_key=True),
    Column('name', String),
    Column('email', String),
    Column('phone', String),
    Column('role', String, default='user'),
    Column('is_verified', Boolean, default=False),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    Column('last_location', JSON),
    Column('metadata', JSON)
)

alerts = Table(
    'alerts', metadata,
    Column('id', UUID(as_uuid=True), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id')),
    Column('type', String),
    Column('status', String, default='open'),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    Column('location', JSON),
    Column('verified', Boolean, default=False),
    Column('verification_method', String),
    Column('attachments', JSON),
    Column('note', String),
    Column('assigned_to', UUID(as_uuid=True)),
    Column('route_trace', JSON)
)

responders = Table(
    'responders', metadata,
    Column('id', UUID(as_uuid=True), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id')),
    Column('org_name', String),
    Column('responder_type', String),
    Column('contact', JSON),
    Column('status', String, default='available'),
    Column('last_heartbeat', DateTime(timezone=True)),
    Column('last_location', JSON),
    Column('capabilities', JSON),
    Column('created_at', DateTime(timezone=True), server_default=func.now()),
    Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

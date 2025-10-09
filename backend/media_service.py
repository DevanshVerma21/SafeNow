"""
Media Service for Emergency Alerts
Handles photo and audio file storage with automatic cleanup after 30 minutes
"""
import os
import uuid
import base64
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from pathlib import Path
import asyncio

# Media storage directory
MEDIA_DIR = os.path.join(os.path.dirname(__file__), '..', 'media')
PHOTOS_DIR = os.path.join(MEDIA_DIR, 'photos')
AUDIO_DIR = os.path.join(MEDIA_DIR, 'audio')

# Metadata file to track uploads and their expiry times
METADATA_FILE = os.path.join(MEDIA_DIR, 'media_metadata.json')

# Create directories if they don't exist
os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


def load_metadata() -> Dict:
    """Load media metadata from file"""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading metadata: {e}")
    return {"files": []}


def save_metadata(metadata: Dict) -> None:
    """Save media metadata to file"""
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        print(f"Error saving metadata: {e}")


def generate_unique_filename(extension: str, prefix: str = "") -> str:
    """Generate a unique filename with timestamp and UUID"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}.{extension}"
    return f"{timestamp}_{unique_id}.{extension}"


async def save_photo(photo_data: str, alert_id: str) -> Dict:
    """
    Save a photo from base64 data
    Returns dict with filename and URL
    """
    try:
        # Remove data URL prefix if present
        if ',' in photo_data:
            photo_data = photo_data.split(',')[1]
        
        # Decode base64
        photo_bytes = base64.b64decode(photo_data)
        
        # Generate filename
        filename = generate_unique_filename('jpg', f'alert_{alert_id}')
        filepath = os.path.join(PHOTOS_DIR, filename)
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(photo_bytes)
        
        # Calculate expiry time (30 minutes from now)
        expiry_time = (datetime.now() + timedelta(minutes=30)).isoformat()
        
        # Update metadata
        metadata = load_metadata()
        metadata['files'].append({
            'filename': filename,
            'filepath': filepath,
            'type': 'photo',
            'alert_id': alert_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': expiry_time
        })
        save_metadata(metadata)
        
        print(f"✓ Photo saved: {filename} (expires at {expiry_time})")
        
        return {
            'filename': filename,
            'url': f'/media/photos/{filename}',
            'expires_at': expiry_time
        }
    except Exception as e:
        print(f"Error saving photo: {e}")
        raise Exception(f"Failed to save photo: {str(e)}")


async def save_audio(audio_data: str, alert_id: str) -> Dict:
    """
    Save an audio recording from base64 data
    Returns dict with filename and URL
    """
    try:
        # Remove data URL prefix if present
        if ',' in audio_data:
            audio_data = audio_data.split(',')[1]
        
        # Decode base64
        audio_bytes = base64.b64decode(audio_data)
        
        # Generate filename (webm or mp3)
        filename = generate_unique_filename('webm', f'alert_{alert_id}')
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(audio_bytes)
        
        # Calculate expiry time (30 minutes from now)
        expiry_time = (datetime.now() + timedelta(minutes=30)).isoformat()
        
        # Update metadata
        metadata = load_metadata()
        metadata['files'].append({
            'filename': filename,
            'filepath': filepath,
            'type': 'audio',
            'alert_id': alert_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': expiry_time
        })
        save_metadata(metadata)
        
        print(f"✓ Audio saved: {filename} (expires at {expiry_time})")
        
        return {
            'filename': filename,
            'url': f'/media/audio/{filename}',
            'expires_at': expiry_time
        }
    except Exception as e:
        print(f"Error saving audio: {e}")
        raise Exception(f"Failed to save audio: {str(e)}")


def cleanup_expired_media() -> Dict:
    """
    Delete media files that have expired (older than 30 minutes)
    Returns stats about cleaned up files
    """
    try:
        metadata = load_metadata()
        now = datetime.now()
        
        files_to_keep = []
        deleted_count = 0
        deleted_size = 0
        
        for file_info in metadata['files']:
            expires_at = datetime.fromisoformat(file_info['expires_at'])
            
            # Check if file has expired
            if now >= expires_at:
                # Delete the file
                filepath = file_info['filepath']
                if os.path.exists(filepath):
                    file_size = os.path.getsize(filepath)
                    os.remove(filepath)
                    deleted_count += 1
                    deleted_size += file_size
                    print(f"🗑️  Deleted expired {file_info['type']}: {file_info['filename']}")
                else:
                    print(f"⚠️  File not found: {filepath}")
            else:
                files_to_keep.append(file_info)
        
        # Update metadata with only non-expired files
        metadata['files'] = files_to_keep
        save_metadata(metadata)
        
        if deleted_count > 0:
            print(f"✓ Cleanup complete: {deleted_count} files deleted ({deleted_size / 1024:.2f} KB freed)")
        
        return {
            'deleted_count': deleted_count,
            'deleted_size_kb': deleted_size / 1024,
            'remaining_count': len(files_to_keep)
        }
    except Exception as e:
        print(f"Error during cleanup: {e}")
        return {
            'error': str(e),
            'deleted_count': 0
        }


def get_media_for_alert(alert_id: str) -> Dict:
    """
    Get all media files associated with an alert
    """
    try:
        metadata = load_metadata()
        photos = []
        audio = []
        
        for file_info in metadata['files']:
            if file_info.get('alert_id') == alert_id:
                if file_info['type'] == 'photo':
                    photos.append({
                        'filename': file_info['filename'],
                        'url': f"/media/photos/{file_info['filename']}",
                        'created_at': file_info['created_at'],
                        'expires_at': file_info['expires_at']
                    })
                elif file_info['type'] == 'audio':
                    audio.append({
                        'filename': file_info['filename'],
                        'url': f"/media/audio/{file_info['filename']}",
                        'created_at': file_info['created_at'],
                        'expires_at': file_info['expires_at']
                    })
        
        return {
            'photos': photos,
            'audio': audio
        }
    except Exception as e:
        print(f"Error getting media for alert: {e}")
        return {
            'photos': [],
            'audio': []
        }


def get_all_media_stats() -> Dict:
    """
    Get statistics about all stored media
    """
    try:
        metadata = load_metadata()
        now = datetime.now()
        
        total_files = len(metadata['files'])
        expired_count = 0
        active_count = 0
        total_size = 0
        
        for file_info in metadata['files']:
            expires_at = datetime.fromisoformat(file_info['expires_at'])
            if now >= expires_at:
                expired_count += 1
            else:
                active_count += 1
            
            # Get file size if exists
            if os.path.exists(file_info['filepath']):
                total_size += os.path.getsize(file_info['filepath'])
        
        return {
            'total_files': total_files,
            'active_files': active_count,
            'expired_files': expired_count,
            'total_size_mb': total_size / (1024 * 1024)
        }
    except Exception as e:
        print(f"Error getting media stats: {e}")
        return {
            'total_files': 0,
            'active_files': 0,
            'expired_files': 0,
            'total_size_mb': 0
        }


# Initialize metadata file if it doesn't exist
if not os.path.exists(METADATA_FILE):
    save_metadata({"files": []})
    print("✓ Media service initialized")

# import base64
# import requests
# import json

# # Step 1: Set up your Spotify credentials
# CLIENT_ID = '6944ab9eaec74cc888f0c8b9ff979e5e'  # Replace with your Client ID
# CLIENT_SECRET = 'da99adf7cf354cff9838f9781e1aa0ba'  # Replace with your Client Secret

# # Step 2: Encode the Client ID and Client Secret
# client_credentials = f"{CLIENT_ID}:{CLIENT_SECRET}"
# client_credentials_base64 = base64.b64encode(client_credentials.encode()).decode()

# # Step 3: Get the access token using the Client Credentials Flow
# def get_access_token():
#     url = "https://accounts.spotify.com/api/token"
#     headers = {
#         "Authorization": f"Basic {client_credentials_base64}",
#         "Content-Type": "application/x-www-form-urlencoded"
#     }
#     data = {
#         "grant_type": "client_credentials"
#     }
    
#     response = requests.post(url, headers=headers, data=data)
    
#     if response.status_code == 200:
#         token_data = response.json()
#         access_token = token_data['access_token']
#         print(f"Access Token: {access_token}")
#         return token_data['access_token']
#     else:
#         print(f"Error: {response.status_code}")
#         print(response.json())
#         return None

# # Step 4: Search for a track by name and retrieve the preview URL
# def search_track(track_name, access_token):
#     url = f"https://api.spotify.com/v1/search?q={track_name}&type=track&limit=1"
#     headers = {
#         "Authorization": f"Bearer {access_token}"
#     }

#     response = requests.get(url, headers=headers)
    
#     if response.status_code == 200:
#         search_results = response.json()
#         tracks = search_results.get("tracks", {}).get("items", [])
        
#         if tracks:
#             track = tracks[0]  # Get the first result
#             track_name = track['name']
#             artist_name = track['artists'][0]['name']
#             preview_url = track['preview_url']
#             album_name = track['album']['name']
#             album_image = track['album']['images'][0]['url'] if track['album']['images'] else None
            
#             print(f"Track: {track_name}")
#             print(f"Artist: {artist_name}")
#             print(f"Album: {album_name}")
#             print(f"Preview URL: {preview_url}")
#             print(f"Album Image: {album_image}")
#         else:
#             print("No track found.")
#     else:
#         print(f"Error: {response.status_code}")
#         print(response.json())

# # Main Execution
# if __name__ == "__main__":
#     # Step 5: Get the access token
#     access_token = get_access_token()

#     if access_token:
#         print("Access Token obtained successfully!")
        
#         # Step 6: Search for a track (example: 'Shape of You')
#         track_name = "Shape of You"  # Replace with the track name you're looking for
#         search_track(track_name, access_token)
#     else:
#         print("Failed to obtain access token.")
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from pydub import AudioSegment

# Set up Spotify API credentials (You need your Client ID and Client Secret)
CLIENT_ID = '6944ab9eaec74cc888f0c8b9ff979e5e'
CLIENT_SECRET = 'da99adf7cf354cff9838f9781e1aa0ba'

# Initialize 

client_credentials_manager = SpotifyClientCredentials(client_id=CLIENT_ID, client_secret=CLIENT_SECRET)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

def get_preview_url(track_name):
    """
    Function to search for a track on Spotify and return the preview URL.
    """
    # Search for the track
    results = sp.search(q=track_name, limit=1, type='track')

    # If a track is found, check if it has a preview URL
    if results['tracks']['items']:
        track = results['tracks']['items'][0]
        preview_url = track['preview_url']
        if preview_url:
            print(f"Preview URL: {preview_url}")
            return preview_url
        else:
            print(f"No preview available for '{track_name}'.")
            return None
    else:
        print(f"Track '{track_name}' not found.")
        return None

def download_preview(url, file_name):
    """
    Function to download the preview MP3 file and save it locally.
    """
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(file_name, 'wb') as file:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        file.write(chunk)
            print(f"Preview downloaded and saved as {file_name}")
        else:
            print(f"Failed to download preview. HTTP Status Code: {response.status_code}")
    except Exception as e:
        print(f"Error during download: {e}")

def trim_audio(input_file, output_file, duration_ms=30000):
    """
    Function to trim the first 30 seconds from an MP3 file using pydub.
    """
    try:
        # Load the audio file (it should be an MP3)
        audio = AudioSegment.from_mp3(input_file)  # Use .from_wav() if it's a WAV file
        
        # Trim the audio to the first 30 seconds (30000 milliseconds)
        trimmed_audio = audio[:duration_ms]
        
        # Export the trimmed audio to a new file
        trimmed_audio.export(output_file, format="mp3")
        print(f"Trimmed audio saved as {output_file}")
    except Exception as e:
        print(f"Error during trimming: {e}")

def get_and_trim_track(track_name):
    """
    Main function to get the track's preview URL, download it, and trim it to 30 seconds.
    """
    preview_url = get_preview_url(track_name)
    if preview_url:
        download_preview(preview_url, "full_preview.mp3")
        trim_audio("full_preview.mp3", "track_preview_30s.mp3")
    else:
        print("Cannot proceed, no preview URL found.")

# Example: Search for a track and get the first 30 seconds of it
track_name = "Shape of You"  # Change to your desired track name
get_and_trim_track(track_name)
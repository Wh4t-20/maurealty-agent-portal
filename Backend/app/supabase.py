import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the .env.local file in the root folder
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env.local')
load_dotenv(dotenv_path)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# Initialize the Supabase client
supabase: Client = create_client(url, key)
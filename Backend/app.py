import os
from flask import Flask
from dotenv import load_dotenv
from models import db, PropertyType, Listing, ListingImage

load_dotenv()   # loads .env variables
app = Flask(__name__)

# configs SQLALCHEMY with ur .env ~ refer to ur .env for your local database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# initialize app with models
db.init_app(app)

def setup_database():
    """
    Creates database based on models.py
    """

    with app.app_context():
        try:
            db.create_all()
            print("\n[SUCCESS]: Database tables have been created")
            # 'property_types' , 'listings', 'listing_images' tables for now
        except Exception as e:
            print(f"\n[ERROR]: Could not connect to database / create tables: {e}")

# NOTE: WILL BE ADDING SEEDING FUNCTION SOON ONCE FINALIZED for PropertyType table and others 

@app.route('/')
def health_check():
    return {"status": "Backend is running and connected to PostgreSQL!"}, 200


if __name__ == '__main__':
    # running database setup
    setup_database()

    # start flask dev server
    app.run(debug=True)


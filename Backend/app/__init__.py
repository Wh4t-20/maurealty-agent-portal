from flask import Flask
from app.extensions import db

def create_app():
    app = Flask(__name__)
    
    # TODO: Load configuration from app.config.py or environment variables
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/supabase_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    db.init_app(app)

    # Register Blueprints
    from app.api.listings import listings_bp
    app.register_blueprint(listings_bp)
    
    # TODO: Register properties_bp and lookups_bp once created
    
    return app
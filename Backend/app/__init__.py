from flask import Flask

def create_app():
    app = Flask(__name__)
    
    # Register Blueprints
    from app.api.listings import listings_bp
    app.register_blueprint(listings_bp)
    
    from app.api.properties import properties_bp
    app.register_blueprint(properties_bp)
    
    from app.api.lookups import lookups_bp
    app.register_blueprint(lookups_bp)
    
    return app
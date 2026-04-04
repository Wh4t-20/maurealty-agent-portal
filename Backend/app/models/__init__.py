from flask import Blueprint

listings_bp = Blueprint('listings', __name__, url_prefix='/api/listings')

# Import the route files so the endpoints get registered to the blueprint
# This allows your team to keep GET, POST, and UPDATE logic in separate files
from . import get, post, update
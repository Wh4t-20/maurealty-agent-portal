from flask import request, jsonify
from . import listings_bp
from app.models.listings import db 

@listings_bp.route('/<int:listing_id>', methods=['PUT', 'PATCH'])
def update_listing(listing_id):
    # TODO: Implement UPDATE logic for modifying an existing listing here
    pass
from flask import jsonify
from . import listings_bp
from app.supabase import supabase

@listings_bp.route('/', methods=['GET'])
def get_listings():
    # TODO: Implement GET logic using supabase.table('main_listings').select('*').execute()
    pass
from flask import Blueprint

lookups_bp = Blueprint('lookups', __name__, url_prefix='/api/lookups')

from . import get
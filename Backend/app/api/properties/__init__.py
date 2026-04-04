from flask import Blueprint

properties_bp = Blueprint('properties', __name__, url_prefix='/api/properties')

from . import get, post, update
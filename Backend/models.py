from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class PropertyType(db.Model):
    __tablename__ = 'property_types' # need new naming??
    property_type_ID = db.Column(db.Integer, primary_key = True)
    property_type = db.Column(db.String(50), nullable = False)

    listings = db.relationship('Listing', backref= 'property_type', lazy = True)

class Listing(db.Model):
    __tablename__ = 'listings'
    # will link up with agent_ID soon
    listing_ID = db.Column(db.Integer, primary_key = True)
    listing_title = db.Column(db.String(255), nullable = False)
    bedroom_count = db.Column(db.Integer, default = 0)
    bathroom_count = db.Column(db.Integer, default = 0)
    
    property_type_ID = db.Column(db.Integer,
                                 db.ForeignKey('property_types.property_type_ID'),
                                 nullable = False
                                 )
    floor_area = db.Column(db.Numeric(10, 2))
    lot_area = db.Column(db.Numeric(10,2))
    price = db.Column(db.Numeric(15,2), nullable = False)
    commission = db.Column(db.Numeric(5,2))
    location = db.Column(db.Text)
    description = db.Column(db.Text)

class ListingImage(db.Model):
    __tablename__ = 'listing_images'
    image_ID = db.Column(db.Integer, primary_key = True)

    listing_ID = db.Column(db.Integer,
                           db.ForeignKey('listings.listing_ID', ondelete = 'CASCADE'),
                           nullable = False
                           )
    image_path = db.Column(db.Text, nullable = False)
    is_thumbnail= db.Column(db.Boolean, default = False)
    display_order = db.Column(db.Integer, default = 0) 






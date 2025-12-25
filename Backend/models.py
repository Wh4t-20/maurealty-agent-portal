from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class PropertyType(db.Model):
    __tablename__ = 'PropertyTypeIDTable' # need new naming??
    property_type_ID = db.Column(db.Integer, primary_key = True)
    property_type = db.Column(db.String(50), nullable = False) # placeholder

class ListingImageTable(db.Model):
    __tablename__ = 'ListingImages'
    listing_ID = db.Column(db.Integer, db.ForeignKey('Listings.listing_ID')) 
    # image ID
    # is_thumbnail

class ListingsTable(db.Model):
    __tablename__ = 'Listings'
    # will link up with agent_ID soon
    listing_ID = db.Column(db.Integer, primary_key = True)
    listing_title = db.Column(db.String(255), nullable = False)
    bedroom_count = db.Column(db.Integer, default = 0)
    bathroom_count = db.Column(db.Integer, default = 0)
    property_type_ID = db.Column(db.Integer, db.ForeignKey('PropertyTypeIDTable.property_type_ID'))
    floor_area = db.Column(db.Numeric(10, 2))
    lot_area = db.Column(db.Numeric(10,2))
    price = db.Column(db.Numeric(15,2), nullable = False)
    commission = db.Column(db.Numeric(5,2))
    location = db.Column(db.String(255))
    description = db.Column(db.Text)



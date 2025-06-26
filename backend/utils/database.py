from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# Initialize database
db = SQLAlchemy()
bcrypt = Bcrypt()
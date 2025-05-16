# shell.py
from app.database import SessionLocal
from app import models
from IPython import embed

db = SessionLocal()

print("Session loaded as `db`")
print("Models available in `models`")

embed()  # Opens IPython shell


"""
db.query(User).all()                          # Get all users
db.query(User).first()                        # First record
db.query(User).get(1)                         # Get by primary key
db.query(User).filter(User.id == 1).first()   # Filter one
db.query(User).filter(User.name == "Alice").all()  # Filter all
db.query(User).order_by(User.name).all()      # Order results
db.query(User).count()                        # Count rows

new_user = User(name="Alice", email="a@a.com")
db.add(new_user)
db.commit()
db.refresh(new_user)  # Get updated fields like ID

user = db.query(User).get(1)
user.name = "Updated Name"
db.commit()

user = db.query(User).get(1)
db.delete(user)
db.commit()

user.items           # Access related items
item.owner           # Access item's user

"""
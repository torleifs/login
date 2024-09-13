from pydantic import BaseModel


class PlayerDto(BaseModel):
    email: str
    name: str
    
    model_config = {
        'orm_mode': True  # Enables ORM mode to work with SQLAlchemy models
    }
from typing import List, Optional
import uuid
from sqlalchemy import Column,  LargeBinary
from sqlmodel import Field, SQLModel
from sqlalchemy.dialects import postgresql

class Player(SQLModel, table=True):
    id: uuid.UUID = Field(default=None, primary_key=True)
    name: str
    email: str
    credential_id: bytes= Field(default=[], sa_column=Column(LargeBinary)) 
    public_key: bytes = Field(default=None, sa_column=Column(LargeBinary))
    sign_count: int = Field(default=0)

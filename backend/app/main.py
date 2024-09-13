from fastapi import FastAPI

from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from app.database import  initialize_database
from app.auth  import router as auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_database()
    yield
    pass


app = FastAPI(lifespan=lifespan)
app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
       expose_headers=["*"],
   )
app.include_router(auth.router)

from sqlalchemy.orm import Session
from app.repository import users as user_repository
from app.schemas import UserResponse
from fastapi import HTTPException


def create_user(db: Session, login: str)-> UserResponse:
    if user_repository.get_user(db, login):
        raise   HTTPException(status_code=400, detail="User already exists")
    user = user_repository.create_user(db, login)
    db.commit()
    return UserResponse.model_validate(user)

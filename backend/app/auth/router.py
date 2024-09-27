import secrets
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from webauthn import options_to_json

from app.database import get_session
from .dtos import PlayerDto
from .service import (
    PendingRegistration,
    create_challenge,
    get_authentication_options,
    get_credential_creation_options,
    raise_if_user_exists,
    verify_auth_credentials,
    verify_registration_and_store_user,
)


router = APIRouter()

session_store = {}


@router.post("/auth/registration/begin")
async def begin_registration(
    response: Response, player: PlayerDto, session: AsyncSession = Depends(get_session)
):
    print("Checking if user exists")
    await raise_if_user_exists(session, player.email)

    print("Generating registration options")
    registration_options = get_credential_creation_options(
        "Lost company",
        "myuniquepasswordlessloginservice.azurewebsites.net",
        player,
    )

    print("Creating pending registration")
    pendingRegistration = PendingRegistration(
        challenge=registration_options.challenge,
        user_id=registration_options.user.id,
        user_name=player.name,
        user_email=player.email,
    )
    print("Adding session data and setting cookie")
    add_session_data_and_set_cookie(response, pendingRegistration.model_dump())

    return options_to_json(registration_options)


@router.post("/auth/registration/complete", response_model=PlayerDto)
async def complete_registration(
    request: Request,
    response: Response,
    credential: str = Body(...),
    session: AsyncSession = Depends(get_session),
):
    session_data = get_session_data_from_request_and_remove_cookie_and_entry(
        request, response
    )

    pendingRegistration = PendingRegistration(**session_data)

    return await verify_registration_and_store_user(
        session, credential, pendingRegistration
    )


@router.get("/auth/assertion/begin")
async def begin_assertion(
    response: Response, session: AsyncSession = Depends(get_session)
):
    auth_options = get_authentication_options()

    add_session_data_and_set_cookie(response, {"challenge": auth_options.challenge})

    return options_to_json(auth_options)


@router.post("/auth/assertion/complete", response_model=PlayerDto)
async def complete_assertion(
    request: Request,
    response: Response,
    credential: str = Body(...),
    session: AsyncSession = Depends(get_session),
):
    session_data = get_session_data_from_request_and_remove_cookie_and_entry(
        request=request, response=response
    )
    user = await verify_auth_credentials(session, credential, session_data["challenge"])
    return user


def add_session_data_and_set_cookie(response: Response, session_data: dict[str, any]):
    session_id = secrets.token_urlsafe(16)
    session_store[session_id] = session_data
    response.headers["Set-Cookie"] = (
        f"session_id={session_id}; Secure; HttpOnly; SameSite=None; Partitioned"
    )
    # response.set_cookie(
    #     key="session_id",
    #     value=session_id,
    #     httponly=True,
    #     secure=True,
    #     samesite="None",
    # )


def get_session_data_from_request_and_remove_cookie_and_entry(
    request: Request, response: Response
) -> dict[str, any]:
    session_id = request.cookies.get("session_id")
    session_data = session_store.pop(session_id, None)
    if not session_id or not session_data:
        raise HTTPException(
            status_code=400, detail="Invalid session ID or challenge not found"
        )
    response.delete_cookie("session_id")

    return session_data

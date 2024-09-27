import secrets, uuid

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from webauthn import (
    generate_authentication_options,
    generate_registration_options,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions,
)

from .utils import parse_credential_id
from .dtos import PlayerDto
from .models import Player

expected_origin = "https://www.thelogin.xyz"
rp_id = "thelogin.xyz"


class PendingRegistration(BaseModel):
    challenge: bytes
    user_id: bytes
    user_name: str
    user_email: str


async def raise_if_user_exists(session: AsyncSession, email: str):
    result = await session.exec(select(Player).where(Player.email == email))
    user = result.one_or_none()

    if user:
        raise HTTPException(status_code=409, detail="User already exists")


def create_challenge() -> bytes:
    return secrets.token_bytes(32)


def get_credential_creation_options(
    company_name: str, rp_id: str, player: PlayerDto, timeout_in_ms: int = 60000
) -> PublicKeyCredentialCreationOptions:
    challenge = create_challenge()
    user_id = uuid.uuid4().bytes

    return generate_registration_options(
        rp_id="thelogin.xyz",  # rp_id,  # TODO: change this to the actual domain
        rp_name=company_name,
        user_id=user_id,
        user_name=player.email,
        user_display_name=player.name,
        attestation=AttestationConveyancePreference.DIRECT,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            resident_key=ResidentKeyRequirement.REQUIRED,
            user_verification=UserVerificationRequirement.REQUIRED,
        ),
        challenge=challenge,  # options_to_json expects bytes and will transform to base64
        # TODO: build this array from credentials for this user from the database
        exclude_credentials=[
            PublicKeyCredentialDescriptor(id=b"1234567890"),
        ],
        supported_pub_key_algs=[],
        timeout=timeout_in_ms,
    )


async def verify_registration_and_store_user(
    session: AsyncSession, credential: str, pendingRegistration: PendingRegistration
):
    registration = verify_registration_response(
        credential=credential,
        expected_challenge=pendingRegistration.challenge,
        expected_origin="https://www.thelogin.xyz",
        expected_rp_id="thelogin.xyz",
    )
    player_data = Player(
        id=uuid.UUID(bytes=pendingRegistration.user_id),
        email=pendingRegistration.user_email,
        name=pendingRegistration.user_name,
        credential_id=registration.credential_id,
        public_key=registration.credential_public_key,
    )

    session.add(player_data)
    await session.commit()
    await session.refresh(player_data)
    return player_data


async def get_user_from_credential_id(
    session: AsyncSession, credential_id: bytes
) -> Player:
    result = await session.exec(
        select(Player).where(Player.credential_id == credential_id)
    )
    return result.one_or_none()


def get_authentication_options() -> PublicKeyCredentialRequestOptions:
    return generate_authentication_options(
        rp_id=rp_id,
        challenge=create_challenge(),
        user_verification=UserVerificationRequirement.REQUIRED,
    )


async def verify_auth_credentials(
    session: AsyncSession, credential: str, original_challenge: bytes
):
    credential_id = parse_credential_id(credential)
    registered_user = await get_user_from_credential_id(session, credential_id)

    verified_auth = verify_authentication_response(
        credential=credential,
        expected_challenge=original_challenge,
        expected_origin=expected_origin,
        expected_rp_id=rp_id,
        require_user_verification=True,
        credential_public_key=registered_user.public_key,
        credential_current_sign_count=registered_user.sign_count,
    )

    registered_user.sign_count = verified_auth.new_sign_count
    user = await write_back_user(session, registered_user)
    return user


async def write_back_user(session: AsyncSession, player: Player) -> Player:
    session.add(player)
    await session.commit()
    await session.refresh(player)
    return player

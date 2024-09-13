import base64
import json
from pydantic import BaseModel, Field, field_validator, model_validator


def fix_base64_padding(base64_string):
    # Add padding if necessary (Base64 strings should be a multiple of 4 in length)
    return base64_string + "=" * (-len(base64_string) % 4)


def parse_credential_id(credential_as_json_string: str):
    credential = json.loads(credential_as_json_string)
    credential_id = fix_base64_padding(credential["id"])
    return base64.urlsafe_b64decode(credential_id)

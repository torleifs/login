from app.dtos.credential import ClientCredential

raw_credential_response = """
{
    "id": "t9JK_V041RaTGBWG-54JjT4Z04s",
    "rawId": "t9JK_V041RaTGBWG-54JjT4Z04s",
    "response": {
        "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViYSZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2NdAAAAAPv8MAcVTk7MjAtuAgVX170AFLfSSv1dONUWkxgVhvueCY0-GdOLpQECAyYgASFYIOyYrLQaIEPnjzTS6YJgxvu28lCWSKQJeBS9dIICNOl4IlggAiie5lxgtTEjpY9017iWW2-csO96sP78Ze2j7Uk8nC4",
        "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiX0ViNzl6cm9GVlUydFhZNGRvLWJlNTBPc2ZYOE00NW1PQndXZFJmaEZ0TSIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9"
    },
    "type": "public-key"
}
"""

def test_parse_id():
    parsed = ClientCredential.model_validate_json(raw_credential_response)
    assert parsed.id == "t9JK_V041RaTGBWG-54JjT4Z04s"
    
def test_parse_client_data_json():
    parsed = ClientCredential.model_validate_json(raw_credential_response)
    assert parsed.response.origin == "http://localhost:5173"

def test_parse_client_data_challenge_as_str():
    parsed = ClientCredential.model_validate_json(raw_credential_response)
    assert parsed.response.challenge_as_str == "_Eb79zroFVU2tXY4do-be50OsfX8M45mOBwWdRfhFtM"

def test_parse_client_data_challenge():
    parsed = ClientCredential.model_validate_json(raw_credential_response)
    assert parsed.response.challenge == b'\xfcF\xfb\xf7:\xe8\x15U6\xb5v8v\x8f\x9b{\x9d\x0e\xb1\xf5\xfc3\x8ef8\x1c\x16u\x17\xe1\x16\xd3'
    
        
def test_parse_client_data_type():
    parsed = ClientCredential.model_validate_json(raw_credential_response)
    assert parsed.type == "public-key"
import httpx
from functools import lru_cache
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

@lru_cache(maxsize=1)
def get_jwks():
    url = f"{settings.NEON_AUTH_URL}/.well-known/jwks.json"
    response = httpx.get(url)
    response.raise_for_status()
    return response.json()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        jwks = get_jwks()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"], 
                    "kid": key["kid"], 
                    "use": key["use"],
                    "n": key["n"], 
                    "e": key["e"]
                }
                break

        if rsa_key:
            payload = jwt.decode(
                token, 
                rsa_key, 
                algorithms=["RS256"],
                audience=settings.NEON_AUTH_AUDIENCE, 
                issuer=settings.NEON_AUTH_ISSUER
            )
            return payload
        raise HTTPException(status_code=401, detail="Invalid token header (Key not found)")
    except JWTError as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

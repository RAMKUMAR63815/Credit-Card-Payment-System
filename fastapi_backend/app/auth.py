import os
# os = environment variables (.env) la irukkura values-a read panna use panrom.

from fastapi import Depends, HTTPException, status
# Depends = dependency injection; HTTPException = error create panna; status = HTTP status codes use panna.

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# HTTPBearer = Bearer token authentication use panna; HTTPAuthorizationCredentials = Authorization header-la irukkura token-a receive panna.

from jose import jwt, JWTError
# jwt = JWT token decode/verify panna; JWTError = token invalid-a irundha error catch panna.


security = HTTPBearer()
# FastAPI-ku Authorization: Bearer <token> format-la token expect panna configure panrom.

from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "django-insecure-5)7=_%3zf6#!oioq4h_9+-p!)&-0e96own#@&*3&#qv)e$z%&5"
)
# .env-la JWT_SECRET_KEY irundha atha use pannum; illana default secret key use pannum.


JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)
# .env-la JWT_ALGORITHM irundha atha use pannum; illana HS256 algorithm use pannum.


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
# API request varumbodhu Authorization header-la irukkura Bearer token-a FastAPI automatic-ah credentials-kulla edukkum.


    token = credentials.credentials
    # credentials-la irukkura actual JWT token-a token variable-kulla edukkrom.


    try:
    # JWT token verify/decode pannumbodhu error varama handle panna try block start panrom.


        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )
        # JWT token-a secret key + algorithm use panni verify pannitu, token-kulla irukkura data-va payload-la edukkrom.


        user_id = payload.get("user_id")
        # JWT payload-la irukkura user_id value-a edukkrom.


        if user_id is None:
        # Token valid-a irundhalum user_id illaya-nu check panrom.


            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user_id missing"
            )
            # user_id illana 401 Unauthorized error return panrom.


        return int(user_id)
        # Valid user_id-a integer-a convert panni API-ku return panrom.


    except (JWTError, ValueError):
    # JWT invalid/expired-a irundha JWTError; user_id integer-a convert panna mudiyalana ValueError catch panrom.


        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        # Token invalid/expired-na 401 Unauthorized error return panrom.
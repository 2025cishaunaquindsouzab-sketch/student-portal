from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

from pydantic import BaseModel, EmailStr, Field

from supabase import create_client
from dotenv import load_dotenv

from pwdlib import PasswordHash

import jwt
import os
import secrets

from datetime import datetime, timedelta, timezone


# ============================================================
# 1. LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

RESET_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15")
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


# ============================================================
# 2. SUPABASE CONNECTION
# ============================================================

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# 3. FASTAPI APP
# ============================================================

app = FastAPI(
    title="Student Portal API",
    description="FastAPI JWT Authentication and RBAC",
    version="1.0"
)


# ============================================================
# 4. CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 5. PASSWORD HASHING
# ============================================================

password_hash = PasswordHash.recommended()


# ============================================================
# 6. OAUTH2 / BEARER TOKEN
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="login"
)


# ============================================================
# 7. PYDANTIC MODELS
# ============================================================

class RegisterRequest(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=6,
        max_length=100
    )


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class ForgotPasswordRequest(BaseModel):

    email: EmailStr


class ResetPasswordRequest(BaseModel):

    token: str

    new_password: str = Field(
        min_length=6,
        max_length=100
    )


class Student(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=50
    )

    age: int = Field(
        ge=17,
        le=30
    )

    course: str = Field(
        min_length=2,
        max_length=50
    )

    semester: int = Field(
        ge=1,
        le=8
    )

    email: EmailStr


# ============================================================
# 8. PASSWORD FUNCTIONS
# ============================================================

def hash_password(password: str):

    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
):

    return password_hash.verify(
        plain_password,
        hashed_password
    )


# ============================================================
# 9. CREATE JWT TOKEN
# ============================================================

def create_access_token(
    user_id: int,
    email: str,
    role: str
):

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {

        "sub": str(user_id),

        "email": email,

        "role": role,

        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return token


# ============================================================
# 10. VERIFY JWT TOKEN
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        email = payload.get("email")

        role = payload.get("role")


        if user_id is None:

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )


        return {
            "id": int(user_id),
            "email": email,
            "role": role
        }


    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )


    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# ============================================================
# 11. ROLE CHECKER
# ============================================================

def require_role(required_role: str):

    def role_checker(
        current_user: dict = Depends(
            get_current_user
        )
    ):

        if current_user["role"] != required_role:

            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# ============================================================
# 12. HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Student Portal API is running"
    }


# ============================================================
# 13. REGISTER
# ============================================================

@app.post("/register", status_code=201)
def register(user: RegisterRequest):

    # --------------------------------------------------------
    # Check if email already exists
    # --------------------------------------------------------

    existing_user = (
        supabase
        .table("users")
        .select("id")
        .eq("email", user.email)
        .execute()
    )

    if existing_user.data:

        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )


    # --------------------------------------------------------
    # Hash password
    # --------------------------------------------------------

    hashed_password = hash_password(
        user.password
    )


    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user_data = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_password,
        "role": "student"
    }


    response = (
        supabase
        .table("users")
        .insert(user_data)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=500,
            detail="Could not create user"
        )


    created_user = response.data[0]


    return {
        "message": "Registration successful",
        "user": {
            "id": created_user["id"],
            "name": created_user["name"],
            "email": created_user["email"],
            "role": created_user["role"]
        }
    }


# ============================================================
# 14. LOGIN
# ============================================================

@app.post("/login")
def login(user: LoginRequest):

    # --------------------------------------------------------
    # Find user by email
    # --------------------------------------------------------

    response = (
        supabase
        .table("users")
        .select("*")
        .eq("email", user.email)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    db_user = response.data[0]


    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    password_valid = verify_password(
        user.password,
        db_user["password_hash"]
    )


    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # --------------------------------------------------------
    # Create JWT
    # --------------------------------------------------------

    access_token = create_access_token(
        user_id=db_user["id"],
        email=db_user["email"],
        role=db_user["role"]
    )


    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "name": db_user["name"],
            "email": db_user["email"],
            "role": db_user["role"]
        }
    }


# ============================================================
# 15. FORGOT PASSWORD
# ============================================================

@app.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest
):

    # --------------------------------------------------------
    # Find user by email
    # --------------------------------------------------------

    response = (
        supabase
        .table("users")
        .select("id, email")
        .eq("email", request.email)
        .execute()
    )


    # --------------------------------------------------------
    # Do not reveal whether email exists
    # --------------------------------------------------------

    if not response.data:

        return {
            "message": (
                "If this email is registered, "
                "a password reset link has been sent."
            )
        }


    user = response.data[0]


    # --------------------------------------------------------
    # Generate secure random reset token
    # --------------------------------------------------------

    reset_token = secrets.token_urlsafe(32)


    # --------------------------------------------------------
    # Set token expiration
    # --------------------------------------------------------

    reset_expires = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )
    )


    # --------------------------------------------------------
    # Save reset token in database
    # --------------------------------------------------------

    update_response = (
        supabase
        .table("users")
        .update({
            "reset_token": reset_token,
            "reset_token_expires": reset_expires.isoformat()
        })
        .eq("id", user["id"])
        .execute()
    )


    if not update_response.data:

        raise HTTPException(
            status_code=500,
            detail="Could not create password reset request"
        )


    # --------------------------------------------------------
    # Create frontend reset URL
    # --------------------------------------------------------

    reset_link = (
        f"{FRONTEND_URL}/reset-password"
        f"?token={reset_token}"
    )


    # --------------------------------------------------------
    # DEVELOPMENT MODE
    #
    # Later we will send this link through email.
    # --------------------------------------------------------

    return {
        "message": "Password reset link generated",
        "reset_link": reset_link
    }


# ============================================================
# 16. RESET PASSWORD
# ============================================================

@app.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest
):

    # --------------------------------------------------------
    # Find user using reset token
    # --------------------------------------------------------

    response = (
        supabase
        .table("users")
        .select("*")
        .eq("reset_token", request.token)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )


    user = response.data[0]


    # --------------------------------------------------------
    # Check token expiry
    # --------------------------------------------------------

    reset_expires = user.get(
        "reset_token_expires"
    )


    if not reset_expires:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )


    reset_expires = datetime.fromisoformat(
        reset_expires.replace(
            "Z",
            "+00:00"
        )
    )


    if datetime.now(timezone.utc) > reset_expires:

        # Clear expired token
        (
            supabase
            .table("users")
            .update({
                "reset_token": None,
                "reset_token_expires": None
            })
            .eq("id", user["id"])
            .execute()
        )


        raise HTTPException(
            status_code=400,
            detail="Reset token has expired"
        )


    # --------------------------------------------------------
    # Hash new password
    # --------------------------------------------------------

    new_password_hash = hash_password(
        request.new_password
    )


    # --------------------------------------------------------
    # Update password
    # Invalidate reset token after successful reset
    # --------------------------------------------------------

    update_response = (
        supabase
        .table("users")
        .update({
            "password_hash": new_password_hash,
            "reset_token": None,
            "reset_token_expires": None
        })
        .eq("id", user["id"])
        .execute()
    )


    if not update_response.data:

        raise HTTPException(
            status_code=500,
            detail="Could not reset password"
        )


    return {
        "message": (
            "Password reset successfully. "
            "You can now login with your new password."
        )
    }


# ============================================================
# 17. GET CURRENT USER
# ============================================================

@app.get("/me")
def get_my_profile(
    current_user: dict = Depends(
        get_current_user
    )
):

    return {
        "message": "Authenticated user",
        "user": current_user
    }


# ============================================================
# 18. GET ALL STUDENTS
# Authentication required
# ============================================================

@app.get("/students")
def get_students(
    current_user: dict = Depends(
        get_current_user
    )
):

    response = (
        supabase
        .table("students")
        .select("*")
        .execute()
    )


    return {
        "user": current_user["email"],
        "students": response.data
    }


# ============================================================
# 19. GET STUDENT BY ID
# Authentication required
# ============================================================

@app.get("/students/{student_id}")
def get_student(
    student_id: int,
    current_user: dict = Depends(
        get_current_user
    )
):

    response = (
        supabase
        .table("students")
        .select("*")
        .eq("id", student_id)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    return response.data[0]


# ============================================================
# 20. CREATE STUDENT
# ADMIN ONLY
# ============================================================

@app.post("/students", status_code=201)
def create_student(
    student: Student,
    current_user: dict = Depends(
        require_role("admin")
    )
):

    student_data = {
        "name": student.name,
        "age": student.age,
        "course": student.course,
        "semester": student.semester,
        "email": student.email
    }


    response = (
        supabase
        .table("students")
        .insert(student_data)
        .execute()
    )


    return {
        "message": "Student created successfully",
        "created_by": current_user["email"],
        "student": response.data
    }


# ============================================================
# 21. UPDATE STUDENT
# ADMIN ONLY
# ============================================================

@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    student: Student,
    current_user: dict = Depends(
        require_role("admin")
    )
):

    update_data = {
        "name": student.name,
        "age": student.age,
        "course": student.course,
        "semester": student.semester,
        "email": student.email
    }


    response = (
        supabase
        .table("students")
        .update(update_data)
        .eq("id", student_id)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    return {
        "message": "Student updated successfully",
        "updated_by": current_user["email"],
        "student": response.data
    }


# ============================================================
# 22. DELETE STUDENT
# ADMIN ONLY
# ============================================================

@app.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    current_user: dict = Depends(
        require_role("admin")
    )
):

    response = (
        supabase
        .table("students")
        .delete()
        .eq("id", student_id)
        .execute()
    )


    if not response.data:

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    return {
        "message": "Student deleted successfully",
        "deleted_by": current_user["email"]
    }


# ============================================================
# 23. STUDENT-ONLY API
# ============================================================

@app.get("/student-area")
def student_area(
    current_user: dict = Depends(
        require_role("student")
    )
):

    return {
        "message": "Welcome to student area",
        "user": current_user
    }


# ============================================================
# 24. ADMIN-ONLY API
# ============================================================

@app.get("/admin-area")
def admin_area(
    current_user: dict = Depends(
        require_role("admin")
    )
):

    return {
        "message": "Welcome to admin area",
        "user": current_user
    }
🎯 Major Development Prompts
1. Initial Authentication System Implementation

Prompt:

I need to implement a complete user authentication system with face capture storage in my FastAPI backend. Here's what I need:

Requirements:
Update requirements.txt - Add these dependencies:
- python-jose[cryptography] (for JWT tokens)
- passlib[bcrypt] (for password hashing)
- python-multipart (for file uploads)

Create User Model (models/user.py):
Table name: "users"
Fields: id (primary key), email (unique, indexed), password_hash, face_image (string for base64), created_at, updated_at
Use SQLAlchemy Base from storage.database

Create User Schemas (schemas/user_schema.py):
- UserCreate: email (EmailStr), password, face_image (optional string)
- UserLogin: email, password
- UserResponse: id, email, created_at (exclude password_hash and face_image)
- TokenResponse: access_token, token_type, user

Create User Repository (storage/user_repository.py):
Functions: get_password_hash(), verify_password(), create_user(), get_user_by_email(), get_user_by_id()
Use passlib CryptContext with bcrypt for password hashing

Create Auth API (api/auth.py):
Router prefix: "/auth"
Endpoints:
- POST /auth/signup - Create new user with email, password, and face_image (base64). Return JWT token and user data. Validate: email unique, password min 6 chars, face_image required.
- POST /auth/login - Authenticate with email/password. Return JWT token and user data.
- GET /auth/me - Get current authenticated user (protected route)

JWT Configuration:
- SECRET_KEY (use a placeholder)
- ALGORITHM="HS256"
- token expires in 30 minutes
Use OAuth2PasswordBearer for token authentication
Password validation: minimum 6 characters

Update main.py:
- Import User model to ensure table creation
- Include auth router: app.include_router(auth_router)

Update Frontend API (monitoring-ui/src/api/authApi.js):
- Replace mock login() function to call POST /auth/login with FormData (username=email, password=password)
- Replace mock signup() function to call POST /auth/signup with JSON body (email, password, face_image as base64 string)
- Handle responses: {success: true, user: {...}, token: "..."} or {success: false, message: "..."}
- Update BASE_URL to "http://localhost:5000"

Important Details:
- Use the existing database setup from storage/database.py (SQLite)
- Follow the same patterns as the existing Log model and API routes
- Face images should be stored as base64 strings in the database
- JWT tokens should include user email and user_id in payload
- Error responses should use HTTPException with appropriate status codes
- Password hashing must use bcrypt via passlib

Security Notes:
- Add a comment in the code about changing SECRET_KEY in production
- Validate email format using EmailStr from pydantic
- Ensure passwords are hashed before storage
- Return appropriate error messages without revealing if email exists during login

Please implement all these changes, creating new files where needed and updating existing ones. Make sure everything integrates properly with the existing codebase structure.


Outcome:
Complete authentication system with JWT, password hashing, face capture, and frontend integration.

2. Camera Fix Prompt

Prompt:

the camera is not working correct the error


Error Context:

FaceCapture.jsx:102 Error accessing camera: Error: Video element not available at startCamera (FaceCapture.jsx:54:23)


Solution:
Modified FaceCapture.jsx to always render the video element (hidden when not in use) to ensure DOM availability.

3. Backend Connection Fix

Prompt:

database not working POST http://localhost:5000/auth/signup net::ERR_CONNECTION_REFUSED


Solution:
Created startup scripts:

start_server.bat

start_server.ps1

and documentation for starting the backend server.

4. Password Length Issue Resolution

Prompt:

Internal server error: password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])


Follow-up Prompts:

"Password is too long. Maximum 72 bytes allowed. when entered 5 giving atleast 6 requires crct this"

"just fix this one error"

"still the same issue"

"rectify this password cannot be longer than 72 bytes, truncate manually if necessary (e.g. my_password[:72])"

Solution: Implemented multi-layered password truncation:

Pre-truncation in signup endpoint

Truncation in get_password_hash() function

Frontend validation with maxLength={100} attribute

Comprehensive error handling

5. Image Storage Verification

Prompt:

once check whether the data is being stored or not


Solution:
Created verify_user_storage.py script to query database and verify user and face image storage.

6. Database-Free Login Implementation

Prompt:

make the login easy even when not in the db make user to login for now fast


Follow-up:

i mean just make the login like without a db server like logging into the project without any issue


Solution: Modified /auth/login endpoint to:

Bypass database checks

Generate mock user from email

Create JWT token immediately

Enable instant login without database dependency

7. README Documentation

Prompt:

in the readme describe about this project with nice emojis


Solution: Created comprehensive README with:

Project overview

Feature descriptions

Architecture diagrams

Quick start guide

Tech stack documentation

API endpoints

🔧 Prompt Template Structure
Feature Request Template
I need to implement [FEATURE_NAME] in my [COMPONENT]. Here's what I need:

Requirements:
[Specific requirement 1]
[Specific requirement 2]
[Specific requirement 3]

Technical Details:
[Technology/Pattern to use]
[Integration points]
[Constraints]

Important Notes:
[Security considerations]
[Performance requirements]
[User experience notes]

Please implement all these changes, creating new files where needed and updating existing ones.

Bug Fix Template
[Component] is not working correctly. The error is:
[Error message/description]

[Additional context about what was expected vs what happened]

📚 Development Workflow Prompts
Common Patterns Used

"Verify and fix [COMPONENT]" – Used for validation and correction

"Update [FILE] to [ACTION]" – Used for modifications

"Create [COMPONENT] with [FEATURES]" – Used for new features

"Fix [ERROR] in [LOCATION]" – Used for bug fixes

"Make [FEATURE] [BEHAVIOR]" – Used for behavior changes

🎓 Lessons Learned
Effective Prompt Strategies

Be Specific – Include exact file paths, function names, and requirements

Provide Context – Share error messages, expected behavior, and constraints

Iterate – Break complex features into smaller, focused prompts

Include Examples – Show desired output format or code patterns

Security First – Always mention security considerations

Common Issues Resolved

Password Length – Bcrypt's 72-byte limit required explicit truncation

Camera Access – DOM element availability needed for video streaming

Database Schema – Column type changes required database recreation

Error Handling – Global exception handlers prevent server crashes

Image Size – Compression needed to prevent connection resets

🔗 Related Documentation

README.md
 – Project overview and setup

monitoring-backend/README_START_SERVER.md
 – Server startup guide

API Documentation
 – Interactive API docs

📝 Notes

All prompts were used with AI coding assistants (Cursor AI)

Prompts evolved iteratively based on testing and feedback

Some prompts required multiple iterations to achieve desired results

Error messages from the system were often used as context for follow-up prompts

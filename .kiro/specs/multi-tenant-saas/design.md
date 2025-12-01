# Design Document: Multi-Tenant SaaS Architecture

## Overview

This design document outlines how to restructure the existing HR Nexus application to support multiple organizations (multi-tenancy) while preserving all existing features. The core functionality (12 HR pillars, task management, document handling, AI chatbot) remains unchanged - we're adding organization-level isolation and user management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  - Organization Context Provider                             │
│  - Existing UI Components (Tasks, Chat, Documents)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tenant Context Middleware                           │   │
│  │  - Extract organization_id from JWT                  │   │
│  │  - Inject into request context                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Existing API Endpoints (Modified)                   │   │
│  │  - /tasks (+ organization filter)                    │   │
│  │  - /documents (+ organization filter)                │   │
│  │  - /chat (+ organization context)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  New API Endpoints                                   │   │
│  │  - /organizations (CRUD)                             │   │
│  │  - /invitations (send/accept)                        │   │
│  │  - /users (manage org users)                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │organizations │  │    users     │  │    tasks     │     │
│  │              │  │ +org_id      │  │ +org_id      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  documents   │  │ chat_history │  │ invitations  │     │
│  │ +org_id      │  │ +org_id      │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ChromaDB (Vector Database)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Collections with organization_id metadata           │  │
│  │  - Filter by organization_id on queries              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Tenant Context Middleware

**Purpose:** Automatically inject organization context into all requests

**Implementation:**
```python
from fastapi import Request, HTTPException
from jose import jwt

async def tenant_context_middleware(request: Request, call_next):
    # Skip for public endpoints
    if request.url.path in ["/auth/signup", "/auth/login", "/health"]:
        return await call_next(request)
    
    # Extract JWT token
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Inject organization_id and user_id into request state
        request.state.organization_id = payload.get("organization_id")
        request.state.user_id = payload.get("user_id")
        request.state.role = payload.get("role")
        
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return await call_next(request)
```

### 2. Organization Service

**Purpose:** Manage organization CRUD operations

**Interface:**
```python
class OrganizationService:
    async def create_organization(name: str, admin_email: str) -> Organization
    async def get_organization(org_id: str) -> Organization
    async def update_organization(org_id: str, data: dict) -> Organization
    async def delete_organization(org_id: str) -> bool
    async def get_organization_stats(org_id: str) -> dict
```

### 3. Invitation Service

**Purpose:** Handle user invitations

**Interface:**
```python
class InvitationService:
    async def create_invitation(org_id: str, email: str, role: str) -> Invitation
    async def send_invitation_email(invitation: Invitation) -> bool
    async def accept_invitation(token: str, password: str) -> User
    async def get_pending_invitations(org_id: str) -> List[Invitation]
    async def revoke_invitation(invitation_id: str) -> bool
```

### 4. Modified Existing Services

**TaskService** - Add organization filtering:
```python
class TaskService:
    async def get_tasks(org_id: str, filters: dict) -> List[Task]
    async def create_task(org_id: str, task_data: dict) -> Task
    # ... existing methods with org_id parameter
```

**DocumentService** - Add organization filtering:
```python
class DocumentService:
    async def upload_document(org_id: str, file: UploadFile) -> Document
    async def get_documents(org_id: str) -> List[Document]
    # ... existing methods with org_id parameter
```

**ChatService** - Add organization context:
```python
class ChatService:
    async def get_answer(org_id: str, query: str, history: list) -> str
    # Modify RAG to filter by organization_id in ChromaDB
```

## Data Models

### New Models

#### Organization
```python
class Organization(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str  # "Acme Corporation"
    slug: str  # "acme-corporation" (URL-friendly)
    logo_url: Optional[str] = None
    settings: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
```

#### Invitation
```python
class Invitation(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    email: EmailStr
    role: str  # "admin" or "employee"
    token: str  # Unique invitation token
    invited_by: str  # User ID of inviter
    expires_at: datetime
    status: str  # "pending", "accepted", "expired"
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Modified Existing Models

#### User (Add organization fields)
```python
class UserInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # NEW: Link to organization
    email: EmailStr
    hashed_password: str
    role: str  # NEW: "admin" or "employee"
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Task (Add organization field)
```python
class TaskInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # NEW: Link to organization
    title: str
    description: Optional[str] = None
    status: str = "Pending"
    category: TaskCategory  # Existing 12 categories
    priority: str = "Medium"
    owner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Document (Add organization field)
```python
class DocumentInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # NEW: Link to organization
    filename: str
    original_filename: str
    file_path: str
    file_type: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    category: Optional[str] = None
```

#### ChatHistory (New model)
```python
class ChatHistory(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # NEW: Link to organization
    user_id: str
    messages: List[dict]  # [{role, content, timestamp, sources}]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## Database Schema Changes

### New Collections

#### organizations
```javascript
{
  _id: ObjectId("..."),
  name: "Acme Corporation",
  slug: "acme-corporation",
  logo_url: "https://...",
  settings: {
    task_categories: [...],
    default_permissions: {...}
  },
  created_at: ISODate("..."),
  is_active: true
}

// Indexes
db.organizations.createIndex({ slug: 1 }, { unique: true })
db.organizations.createIndex({ created_at: -1 })
```

#### invitations
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),
  email: "john@example.com",
  role: "employee",
  token: "unique-secure-token",
  invited_by: ObjectId("..."),
  expires_at: ISODate("..."),
  status: "pending",
  created_at: ISODate("...")
}

// Indexes
db.invitations.createIndex({ token: 1 }, { unique: true })
db.invitations.createIndex({ organization_id: 1, email: 1 })
db.invitations.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
```

### Modified Collections

#### users (Add organization_id and role)
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // NEW
  email: "user@example.com",
  hashed_password: "...",
  role: "admin",  // NEW: "admin" or "employee"
  is_active: true,
  is_verified: true,
  created_at: ISODate("...")
}

// New Indexes
db.users.createIndex({ organization_id: 1, email: 1 })
db.users.createIndex({ organization_id: 1, role: 1 })
```

#### tasks (Add organization_id)
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // NEW
  title: "Screen candidates",
  description: "...",
  status: "Pending",
  category: "Recruiting",
  priority: "High",
  owner_id: ObjectId("..."),
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

// New Indexes
db.tasks.createIndex({ organization_id: 1, category: 1 })
db.tasks.createIndex({ organization_id: 1, status: 1 })
db.tasks.createIndex({ organization_id: 1, owner_id: 1 })
```

#### documents (Add organization_id)
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // NEW
  filename: "vacation-policy.pdf",
  original_filename: "vacation-policy.pdf",
  file_path: "./uploads/org_123/...",  // Organize by org
  file_type: "pdf",
  file_size: 12345,
  uploaded_at: ISODate("..."),
  category: "Benefits"
}

// New Indexes
db.documents.createIndex({ organization_id: 1, uploaded_at: -1 })
db.documents.createIndex({ organization_id: 1, category: 1 })
```

#### chat_history (New collection)
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),
  user_id: ObjectId("..."),
  messages: [
    {
      role: "user",
      content: "What is our vacation policy?",
      timestamp: ISODate("...")
    },
    {
      role: "assistant",
      content: "According to your policy...",
      sources: ["vacation-policy.pdf"],
      timestamp: ISODate("...")
    }
  ],
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}

// Indexes
db.chat_history.createIndex({ organization_id: 1, user_id: 1 })
db.chat_history.createIndex({ updated_at: -1 })
```

## RAG System Modifications

### ChromaDB Organization Isolation

**Current Implementation:**
```python
# Single collection for all documents
vectordb = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)
```

**New Implementation:**
```python
# Add organization_id to metadata
def process_document(file_path: str, file_ext: str, organization_id: str):
    # ... existing document processing ...
    
    # Add organization_id to metadata
    for chunk in chunks:
        chunk.metadata["organization_id"] = organization_id
        chunk.metadata["source_file"] = file_path
    
    # Store in ChromaDB
    vectordb.add_documents(chunks)

# Query with organization filter
def get_answer_with_fallback(query: str, organization_id: str, history: list):
    # Filter by organization_id
    results = vectordb.similarity_search(
        query,
        k=5,
        filter={"organization_id": organization_id}  # Organization filter
    )
    
    # ... existing RAG logic ...
```

## API Endpoints

### New Endpoints

#### Organization Management
```
POST   /organizations              - Create organization (signup)
GET    /organizations/me           - Get current user's organization
PUT    /organizations/me           - Update organization settings
GET    /organizations/me/stats     - Get organization statistics
```

#### User Invitation
```
POST   /invitations                - Send invitation
GET    /invitations                - List pending invitations
POST   /invitations/accept/{token} - Accept invitation
DELETE /invitations/{id}           - Revoke invitation
```

#### User Management
```
GET    /users                      - List organization users
GET    /users/{id}                 - Get user details
PUT    /users/{id}/role            - Update user role
DELETE /users/{id}                 - Remove user from organization
```

### Modified Existing Endpoints

All existing endpoints automatically filter by organization_id via middleware:

```
GET    /tasks                      - Now filtered by organization
POST   /tasks                      - Now includes organization_id
GET    /documents                  - Now filtered by organization
POST   /documents/upload           - Now includes organization_id
POST   /chat                       - Now searches organization's docs only
```

## Authentication Flow

### 1. Organization Signup
```
1. User visits /signup
2. Enters: Company Name, Email, Password
3. System creates:
   - New organization
   - First admin user
4. Returns JWT with: {user_id, organization_id, role: "admin"}
5. Redirect to dashboard
```

### 2. User Invitation
```
1. Admin clicks "Invite User"
2. Enters: email, role
3. System creates invitation record
4. Sends email with link: /invitations/accept/{token}
5. User clicks link
6. User creates password
7. System creates user with organization_id
8. Returns JWT with organization context
```

### 3. Login
```
1. User enters email + password
2. System validates credentials
3. Looks up user's organization_id
4. Returns JWT with: {user_id, organization_id, role}
5. Frontend stores JWT
6. All subsequent requests include JWT
7. Middleware extracts organization_id from JWT
```

### JWT Token Structure
```javascript
{
  "user_id": "507f1f77bcf86cd799439011",
  "organization_id": "507f1f77bcf86cd799439012",
  "role": "admin",  // or "employee"
  "email": "user@acme.com",
  "exp": 1234567890
}
```

## Error Handling

### Organization Not Found
```python
if not organization:
    raise HTTPException(
        status_code=404,
        detail="Organization not found"
    )
```

### Unauthorized Access
```python
if request.state.organization_id != resource.organization_id:
    raise HTTPException(
        status_code=403,
        detail="Access denied: Resource belongs to different organization"
    )
```

### Invitation Expired
```python
if invitation.expires_at < datetime.utcnow():
    raise HTTPException(
        status_code=400,
        detail="Invitation has expired"
    )
```

## Testing Strategy

### Unit Tests
1. Test organization CRUD operations
2. Test invitation creation and acceptance
3. Test organization filtering in queries
4. Test JWT token generation with organization context
5. Test middleware organization extraction

### Integration Tests
1. Test complete signup flow
2. Test invitation flow end-to-end
3. Test data isolation between organizations
4. Test RAG system with organization filtering
5. Test all existing features with organization context

### Property-Based Tests
1. **Property 1: Data Isolation**
   - For any two organizations, queries from org A should never return data from org B
   
2. **Property 2: Organization Context Preservation**
   - For any authenticated request, the organization_id should be correctly extracted and applied

3. **Property 3: Invitation Token Uniqueness**
   - For any invitation, the token should be unique and not guessable

## Migration Strategy

### Phase 1: Database Migration
1. Add `organizations` collection
2. Create default organization for existing data
3. Add `organization_id` field to all existing collections
4. Update all existing records with default organization_id
5. Create indexes

### Phase 2: Code Updates
1. Add middleware for tenant context
2. Update all queries to include organization_id filter
3. Modify JWT token generation
4. Update RAG system for organization filtering

### Phase 3: New Features
1. Implement organization signup
2. Implement invitation system
3. Add organization management UI
4. Add user management UI

### Phase 4: Testing & Deployment
1. Test data isolation
2. Test all existing features
3. Deploy to staging
4. User acceptance testing
5. Deploy to production

## Security Considerations

1. **Data Isolation**: All queries MUST include organization_id filter
2. **JWT Security**: Tokens include organization_id claim
3. **Invitation Tokens**: Use cryptographically secure random tokens
4. **File Storage**: Organize uploads by organization (./uploads/{org_id}/)
5. **Vector DB**: Always filter by organization_id metadata
6. **Audit Logging**: Log all cross-organization access attempts

## Performance Considerations

1. **Database Indexes**: Compound indexes on (organization_id, other_fields)
2. **Caching**: Cache organization data per request
3. **Connection Pooling**: Reuse database connections
4. **Vector DB**: Optimize ChromaDB queries with organization filter
5. **File Storage**: Consider CDN for document serving

## Deployment Notes

1. Run database migration script before deploying new code
2. Update environment variables for JWT secret
3. Configure email service for invitations
4. Set up monitoring for cross-organization access attempts
5. Create backup before migration

## Success Metrics

1. ✅ Zero cross-organization data leaks
2. ✅ All existing features work with organization context
3. ✅ Users can only see their organization's data
4. ✅ Invitation flow completes in < 2 minutes
5. ✅ No performance degradation with multiple organizations

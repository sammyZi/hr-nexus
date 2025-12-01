# Multi-Tenant SaaS Architecture Overview

## Simplified Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    HR NEXUS PLATFORM                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Organization │    │ Organization │    │ Organization │
│   "Acme"     │    │  "TechCorp"  │    │  "StartupX"  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        │                   │                   │
    ┌───┴───┐           ┌───┴───┐           ┌───┴───┐
    │       │           │       │           │       │
    ▼       ▼           ▼       ▼           ▼       ▼
  Admin  Employee    Admin  Employee    Admin  Employee
  Admin  Employee    Admin  Employee           Employee
         Employee           Employee           Employee
```

## User Roles (Simplified)

### 1. Organization Admin
**Who:** HR managers, company owners, or designated administrators
**Can do:**
- ✅ Invite employees to join the organization
- ✅ Upload HR documents (policies, handbooks, etc.)
- ✅ Create and manage tasks
- ✅ View all organization data
- ✅ Configure organization settings
- ✅ Promote employees to admin
- ✅ Chat with AI assistant

### 2. Employee
**Who:** Regular company employees
**Can do:**
- ✅ Chat with AI assistant (sees only company's documents)
- ✅ View tasks assigned to them
- ✅ View company documents
- ❌ Cannot invite users
- ❌ Cannot upload documents
- ❌ Cannot see other organizations' data

## How It Works

### 1. Company Signs Up
```
1. HR Manager visits platform
2. Creates organization account ("Acme Corp")
3. Becomes first Organization Admin
4. Gets unique organization workspace
```

### 2. Inviting Employees
```
1. Admin clicks "Invite User"
2. Enters employee email
3. Selects role (Admin or Employee)
4. System sends invitation email
5. Employee clicks link and registers
6. Employee automatically joins organization
```

### 3. Data Isolation
```
Organization A                Organization B
├── Users (5)                 ├── Users (10)
├── Documents (20)            ├── Documents (15)
├── Tasks (50)                ├── Tasks (30)
└── Chat History              └── Chat History

❌ Organization A CANNOT see Organization B's data
❌ Organization B CANNOT see Organization A's data
✅ Each organization is completely isolated
```

### 4. AI Chatbot
```
Employee from Acme Corp asks:
"What is our vacation policy?"

AI searches ONLY Acme Corp's documents
AI returns answer with citations from Acme Corp's files
AI NEVER sees TechCorp's or StartupX's documents
```

## Database Structure

### organizations
```javascript
{
  _id: ObjectId("..."),
  name: "Acme Corp",
  slug: "acme-corp",
  logo_url: "https://...",
  created_at: ISODate("..."),
  is_active: true
}
```

### users
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // Links to organization
  email: "john@acme.com",
  role: "admin",  // or "employee"
  hashed_password: "...",
  is_active: true,
  created_at: ISODate("...")
}
```

### documents
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // Links to organization
  filename: "vacation-policy.pdf",
  file_path: "./uploads/...",
  uploaded_by: ObjectId("..."),
  uploaded_at: ISODate("...")
}
```

### tasks
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // Links to organization
  title: "Review benefits package",
  assigned_to: ObjectId("..."),
  created_by: ObjectId("..."),
  status: "pending",
  created_at: ISODate("...")
}
```

### chat_history
```javascript
{
  _id: ObjectId("..."),
  organization_id: ObjectId("..."),  // Links to organization
  user_id: ObjectId("..."),
  messages: [
    {
      role: "user",
      content: "What is our vacation policy?",
      timestamp: ISODate("...")
    },
    {
      role: "assistant",
      content: "According to your company policy...",
      sources: ["vacation-policy.pdf"],
      timestamp: ISODate("...")
    }
  ]
}
```

## Key Security Features

### 1. Automatic Filtering
Every database query automatically includes:
```javascript
{ organization_id: current_user.organization_id }
```

### 2. JWT Token
When user logs in, token includes:
```javascript
{
  user_id: "...",
  organization_id: "...",
  role: "admin" or "employee"
}
```

### 3. Middleware
Every API request:
1. Validates JWT token
2. Extracts organization_id
3. Adds organization_id to all queries
4. Prevents cross-organization access

## User Flows

### Flow 1: New Organization Signup
```
1. Visit /signup
2. Enter: Company Name, Email, Password
3. System creates:
   - New organization
   - First admin user
   - Empty workspace
4. Redirect to dashboard
5. Show onboarding: "Invite your team!"
```

### Flow 2: Employee Invitation
```
1. Admin clicks "Invite User"
2. Enters: email@company.com, role
3. System sends email with link
4. Employee clicks link
5. Employee creates password
6. Employee joins organization
7. Employee sees company dashboard
```

### Flow 3: Employee Using Chatbot
```
1. Employee logs in
2. Sees only their organization's data
3. Clicks "Chat with AI"
4. Asks: "What are the sick leave rules?"
5. AI searches organization's documents
6. AI responds with company-specific answer
7. Shows citations from company's files
```

## Benefits of This Structure

✅ **Simple**: Only 2 roles (Admin, Employee)
✅ **Secure**: Complete data isolation
✅ **Scalable**: Can support unlimited organizations
✅ **Flexible**: Organizations can have multiple admins
✅ **Private**: Each company's data is separate
✅ **Easy to Use**: Employees just chat and get answers

## What's NOT Included (Keeping It Simple)

❌ Subscription/billing
❌ Usage limits
❌ Super admin dashboard
❌ Complex permission system
❌ Organization tiers
❌ Payment processing

These can be added later if needed!

# Implementation Plan: Multi-Tenant SaaS Architecture

## Task List

- [x] 1. Database Schema Updates





  - Add new collections and update existing ones with organization_id
  - Create database indexes for performance
  - _Requirements: 1.1, 1.4, 4.1, 4.2_

- [x] 1.1 Create organizations collection


  - Define Organization model in models.py
  - Create MongoDB collection with indexes
  - Add slug generation utility
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Create invitations collection

  - Define Invitation model in models.py
  - Create MongoDB collection with TTL index
  - Add token generation utility
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 1.3 Update users collection schema

  - Add organization_id field to UserInDB model
  - Add role field ("admin" or "employee")
  - Create compound indexes (organization_id, email) and (organization_id, role)
  - _Requirements: 2.3, 2.5, 4.1_

- [x] 1.4 Update tasks collection schema

  - Add organization_id field to TaskInDB model
  - Create compound indexes (organization_id, category), (organization_id, status)
  - _Requirements: 4.1, 4.2, 10.1_

- [x] 1.5 Update documents collection schema

  - Add organization_id field to DocumentInDB model
  - Create compound indexes (organization_id, uploaded_at), (organization_id, category)
  - _Requirements: 4.1, 4.4, 10.3_

- [x] 1.6 Create chat_history collection

  - Define ChatHistory model in models.py
  - Create MongoDB collection with indexes
  - _Requirements: 5.4_

- [x] 2. Authentication & JWT Updates




  - Modify JWT tokens to include organization context
  - Update login/signup flows
  - _Requirements: 1.2, 2.6, 6.1_

- [x] 2.1 Update JWT token structure


  - Modify create_access_token to include organization_id and role
  - Update token payload structure
  - _Requirements: 2.6_

- [x] 2.2 Create organization signup endpoint


  - POST /organizations/signup endpoint
  - Create organization and first admin user
  - Return JWT with organization context
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 2.3 Update login endpoint


  - Modify /auth/login to include organization_id in JWT
  - Add role to JWT payload
  - _Requirements: 2.6_

- [x] 3. Tenant Context Middleware




  - Create middleware to extract and inject organization context
  - Apply to all protected routes
  - _Requirements: 4.3, 11.1_

- [x] 3.1 Implement tenant context middleware


  - Extract organization_id from JWT
  - Inject into request.state
  - Handle missing/invalid tokens
  - _Requirements: 4.3_

- [x] 3.2 Apply middleware to FastAPI app


  - Add middleware to app
  - Skip for public endpoints (/health, /auth/*)
  - _Requirements: 4.3_

- [x] 4. Organization Management





  - Implement organization CRUD operations
  - Add organization settings
  - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3_


- [x] 4.1 Create organization service

  - Implement OrganizationService class
  - Add create, read, update methods
  - _Requirements: 1.1, 1.2, 7.1_


- [x] 4.2 Create organization API endpoints

  - GET /organizations/me - Get current organization
  - PUT /organizations/me - Update organization
  - GET /organizations/me/stats - Get statistics
  - _Requirements: 1.3, 7.1, 9.1, 9.2, 9.3_

- [x] 5. User Invitation System




  - Implement invitation creation and acceptance
  - Add email sending functionality
  - _Requirements: 2.2, 2.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5.1 Create invitation service


  - Implement InvitationService class
  - Add create_invitation, send_email, accept_invitation methods
  - Generate secure tokens
  - _Requirements: 8.1, 8.2, 8.4_

- [x] 5.2 Create invitation API endpoints


  - POST /invitations - Create and send invitation
  - GET /invitations - List pending invitations
  - POST /invitations/accept/{token} - Accept invitation
  - DELETE /invitations/{id} - Revoke invitation
  - _Requirements: 2.2, 8.1, 8.3, 8.5_

- [x] 5.3 Update email service for invitations


  - Create invitation email template
  - Add send_invitation_email function
  - Include organization name and invitation link
  - _Requirements: 8.2_

- [ ] 6. Update Existing Endpoints - Tasks
  - Add organization filtering to all task endpoints
  - Preserve all existing functionality
  - _Requirements: 4.1, 4.2, 10.1, 10.2_

- [ ] 6.1 Update GET /tasks endpoint
  - Add automatic organization_id filter from request.state
  - Maintain existing category and status filters
  - _Requirements: 4.1, 10.2_

- [ ] 6.2 Update POST /tasks endpoint
  - Add organization_id from request.state
  - Maintain existing task creation logic
  - _Requirements: 4.1, 10.2_

- [ ] 6.3 Update PUT /tasks/{task_id} endpoint
  - Verify task belongs to user's organization
  - Maintain existing update logic
  - _Requirements: 4.3, 10.2_

- [ ] 6.4 Update PATCH /tasks/{task_id}/status endpoint
  - Verify task belongs to user's organization
  - Maintain existing status update logic
  - _Requirements: 4.3, 10.2_

- [ ] 6.5 Update DELETE /tasks/{task_id} endpoint
  - Verify task belongs to user's organization
  - Maintain existing delete logic
  - _Requirements: 4.3, 10.2_

- [ ] 7. Update Existing Endpoints - Documents
  - Add organization filtering to all document endpoints
  - Organize file storage by organization
  - _Requirements: 4.1, 4.4, 10.3, 10.4_

- [ ] 7.1 Update POST /documents/upload endpoint
  - Add organization_id from request.state
  - Organize uploads by organization (./uploads/{org_id}/)
  - Maintain existing upload logic
  - _Requirements: 4.4, 10.3_

- [ ] 7.2 Update GET /documents endpoint
  - Add automatic organization_id filter
  - Maintain existing category filter
  - _Requirements: 4.1, 10.3_

- [ ] 7.3 Update GET /documents/{doc_id}/view endpoint
  - Verify document belongs to user's organization
  - Maintain existing view logic
  - _Requirements: 4.3, 10.3_

- [ ] 7.4 Update GET /documents/{doc_id}/download endpoint
  - Verify document belongs to user's organization
  - Maintain existing download logic
  - _Requirements: 4.3, 10.3_

- [ ] 7.5 Update DELETE /documents/{doc_id} endpoint
  - Verify document belongs to user's organization
  - Maintain existing delete logic (including vector DB cleanup)
  - _Requirements: 4.3, 10.3_

- [ ] 8. Update RAG System for Multi-Tenancy
  - Add organization filtering to vector database
  - Update document processing
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 10.4_

- [ ] 8.1 Update process_document function
  - Add organization_id parameter
  - Include organization_id in ChromaDB metadata
  - Maintain existing chunking and embedding logic
  - _Requirements: 5.2, 5.5_

- [ ] 8.2 Update get_answer_with_fallback function
  - Add organization_id parameter
  - Filter vector search by organization_id metadata
  - Maintain existing RAG logic and streaming
  - _Requirements: 5.1, 5.3, 5.6_

- [ ] 8.3 Update POST /chat endpoint
  - Extract organization_id from request.state
  - Pass organization_id to RAG functions
  - Maintain existing chat functionality
  - _Requirements: 5.1, 5.4, 10.4_

- [ ] 8.4 Update document deletion in vector DB
  - Filter by both file_path and organization_id
  - Ensure only organization's documents are deleted
  - _Requirements: 5.5_

- [ ] 9. User Management
  - Add endpoints to manage organization users
  - Implement role updates
  - _Requirements: 2.4, 2.5, 3.5_

- [ ] 9.1 Create user management API endpoints
  - GET /users - List organization users
  - GET /users/{id} - Get user details
  - PUT /users/{id}/role - Update user role
  - DELETE /users/{id} - Remove user from organization
  - _Requirements: 2.4, 2.5, 3.5_

- [ ] 10. Database Migration Script
  - Create script to migrate existing data
  - Add organization_id to all existing records
  - _Requirements: 1.4, 1.5, 4.1_

- [ ] 10.1 Create migration script
  - Create default organization for existing data
  - Update all users with organization_id
  - Update all tasks with organization_id
  - Update all documents with organization_id
  - Update ChromaDB metadata with organization_id
  - _Requirements: 1.4, 1.5, 4.1_

- [ ] 11. Frontend Updates - Organization Context
  - Add organization context provider
  - Update authentication flow
  - _Requirements: 1.3, 2.6, 6.1_

- [ ] 11.1 Create organization context provider
  - Store organization data in React context
  - Load organization on login
  - Provide organization to all components
  - _Requirements: 1.3_

- [ ] 11.2 Update login/signup UI
  - Add organization signup form
  - Update login to handle organization context
  - Store organization_id in local storage
  - _Requirements: 6.1, 2.6_

- [ ] 12. Frontend Updates - Invitation System
  - Add invitation UI for admins
  - Add invitation acceptance page
  - _Requirements: 2.2, 8.1, 8.3_

- [ ] 12.1 Create invitation management UI
  - Add "Invite User" button for admins
  - Create invitation form (email, role)
  - Display pending invitations list
  - Add revoke invitation functionality
  - _Requirements: 2.2, 8.1_

- [ ] 12.2 Create invitation acceptance page
  - Create /invitations/accept/{token} page
  - Display organization name
  - Password creation form
  - Auto-login after acceptance
  - _Requirements: 8.3, 8.5_

- [ ] 13. Frontend Updates - Organization Settings
  - Add organization settings page
  - Add user management UI
  - _Requirements: 7.1, 7.2, 9.1_

- [ ] 13.1 Create organization settings page
  - Display organization name, logo
  - Edit organization details
  - View organization statistics
  - _Requirements: 7.1, 7.2, 9.1, 9.2_

- [ ] 13.2 Create user management UI
  - List all organization users
  - Show user roles
  - Add role update functionality
  - Add remove user functionality
  - _Requirements: 2.4, 2.5_

- [ ] 14. Testing & Validation
  - Test data isolation
  - Test all existing features
  - Test new features
  - _Requirements: All_

- [ ] 14.1 Test data isolation
  - Create multiple test organizations
  - Verify users can only see their organization's data
  - Test cross-organization access attempts
  - Verify vector DB filtering
  - _Requirements: 4.3, 5.5_

- [ ] 14.2 Test existing features with multi-tenancy
  - Test all task operations
  - Test all document operations
  - Test AI chatbot with organization filtering
  - Verify all 12 HR pillars work correctly
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14.3 Test new features
  - Test organization signup flow
  - Test invitation flow end-to-end
  - Test user management
  - Test organization settings
  - _Requirements: 1.1, 2.2, 2.4, 7.1_

- [ ] 15. Documentation & Deployment
  - Update API documentation
  - Create deployment guide
  - Update user documentation
  - _Requirements: All_

- [ ] 15.1 Update API documentation
  - Document new endpoints
  - Update existing endpoint docs with organization context
  - Add authentication flow diagrams
  - _Requirements: All_

- [ ] 15.2 Create deployment guide
  - Document migration steps
  - Add rollback procedures
  - Create environment variable checklist
  - _Requirements: All_

- [ ] 15.3 Update user documentation
  - Create organization admin guide
  - Create HR employee guide
  - Add invitation flow documentation
  - _Requirements: 6.1, 8.1, 8.3_

## Implementation Order

**Phase 1: Database & Core Infrastructure (Tasks 1-3)**
- Set up database schema
- Implement authentication updates
- Create tenant context middleware

**Phase 2: Organization & Invitation System (Tasks 4-5)**
- Implement organization management
- Create invitation system
- Set up email functionality

**Phase 3: Update Existing Features (Tasks 6-8)**
- Add organization filtering to tasks
- Add organization filtering to documents
- Update RAG system for multi-tenancy

**Phase 4: User Management (Task 9)**
- Implement user management endpoints

**Phase 5: Data Migration (Task 10)**
- Create and run migration script

**Phase 6: Frontend Updates (Tasks 11-13)**
- Add organization context
- Create invitation UI
- Add settings and user management

**Phase 7: Testing & Deployment (Tasks 14-15)**
- Comprehensive testing
- Documentation
- Deployment

## Notes

- All existing functionality must be preserved
- Focus on data isolation and security
- Test thoroughly before deploying
- Create backups before migration
- Monitor for cross-organization access attempts

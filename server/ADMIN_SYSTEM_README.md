# Smart Hui Admin Management System

This document describes the comprehensive admin management system implemented for the Smart Hui application.

## Admin Hierarchy

### 1. Super Admin
- **Email**: `admin@alhikmah.edu.ng`
- **Password**: `admin123`
- **Capabilities**:
  - Create and manage other admins
  - View all complaints and issues from staff and students
  - Modify admin permissions
  - Access all system features

### 2. Regular Admins
- **Login**: Username in format `hui/sse/pf/XXX` (where XXX is a 3-digit number)
- **Authentication**: Username + password
- **First Login**: Required to change temporary password
- **Permissions**: Based on predefined categories

## Admin Permission Categories

### Full Access Admins
These admins can see ALL complaints and issues from both staff and students:
- `hui/sse/pf/729`
- `hui/sse/pf/500`
- `hui/sse/pf/555`
- `hui/sse/pf/995`

### Network, Password & Credit Admins
These admins can see complaints related to:
- Network issues
- Password issues
- Additional credit requests

**Usernames**:
- `hui/sse/pf/803`
- `hui/sse/pf/315`
- `hui/sse/pf/519`
- `hui/sse/pf/734`
- `hui/sse/pf/506`
- `hui/sse/pf/804`
- `hui/sse/pf/997`
- `hui/sse/pf/996`

### Password & Credit Only Admin
This admin can only see:
- Password issues
- Additional credit requests

**Username**:
- `hui/sse/pf/943`

## Complaint Categories

The system supports the following complaint categories:
- `academic` - Academic related issues
- `administrative` - Administrative issues
- `infrastructure` - Infrastructure problems
- `financial` - Financial matters
- `network` - Network connectivity issues
- `password` - Password reset/change requests
- `additional_credit` - Credit/unit addition requests
- `other` - Miscellaneous issues

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login (email for super admin, username for regular admins)

### Admin Management (Super Admin Only)
- `POST /api/admin/create` - Create new admin
- `GET /api/admin/list` - Get all admins
- `PUT /api/admin/:id` - Update admin
- `DELETE /api/admin/:id` - Delete admin
- `PUT /api/admin/permissions/:id` - Update admin permissions

### Admin Dashboard
- `GET /api/admin/dashboard/complaints` - Get filtered complaints based on admin permissions
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/me` - Get current admin information

### Password Management
- `PUT /api/admin/change-password` - Change password (required on first login)

## Setup Instructions

### 1. Create Super Admin
Run the following command to create the super admin account:

```bash
cd server
npm run create-super-admin
```

This will create the super admin with:
- Email: `admin@alhikmah.edu.ng`
- Password: `admin123`

### 2. Login as Super Admin
Use the super admin credentials to login via the API:

```javascript
POST /api/admin/login
{
  "login": "admin@alhikmah.edu.ng",
  "password": "admin123"
}
```

### 3. Create Regular Admins
Use the super admin account to create regular admins:

```javascript
POST /api/admin/create
Authorization: Bearer {super_admin_token}
{
  "username": "hui/sse/pf/729",
  "firstName": "John",
  "lastName": "Doe"
}
```

The system will automatically:
- Generate a temporary password
- Set appropriate permissions based on the username
- Require password change on first login

## Security Features

### Password Management
- Temporary passwords are generated automatically for new admins
- First login requires password change
- Passwords are hashed using bcrypt
- JWT tokens for authentication with 7-day expiration

### Permission System
- Role-based access control
- Category-based complaint filtering
- Automatic permission assignment based on username patterns
- Super admin can modify permissions

### Account Management
- Admin accounts can be activated/deactivated
- Audit trail with creation tracking
- Last login timestamps

## Database Schema

### Admin Model
```javascript
{
  username: String, // Format: hui/sse/pf/XXX
  email: String, // Only for super admin
  password: String, // Hashed
  firstName: String,
  lastName: String,
  adminLevel: String, // 'super_admin' | 'admin' | 'sub_admin'
  isFirstLogin: Boolean,
  isActive: Boolean,
  permissions: {
    canSeeAllComplaints: Boolean,
    visibleCategories: [String],
    canManageAdmins: Boolean
  },
  temporaryPassword: String,
  lastLogin: Date,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Login Examples

**Super Admin Login:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin@alhikmah.edu.ng",
    "password": "admin123"
  }'
```

**Regular Admin Login:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "hui/sse/pf/729",
    "password": "user_password"
  }'
```

### Create Admin Example
```bash
curl -X POST http://localhost:5000/api/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "username": "hui/sse/pf/803",
    "firstName": "Network",
    "lastName": "Admin"
  }'
```

### Get Dashboard Complaints
```bash
curl -X GET "http://localhost:5000/api/admin/dashboard/complaints?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Username format error**: Ensure usernames follow the exact format `hui/sse/pf/XXX`
2. **Permission denied**: Check if the admin has appropriate permissions for the requested action
3. **First login issues**: New admins must change their password on first login

### Logs
Check server logs for authentication and authorization errors. All admin actions are logged for audit purposes.

## Migration Notes

If updating from an existing system:
1. Run the super admin creation script
2. Migrate existing admin accounts to the new permission structure
3. Update client applications to handle the new authentication flow
4. Test permission filtering on the frontend

## Security Considerations

1. Change the super admin password in production
2. Use strong JWT secrets
3. Implement rate limiting for login attempts
4. Regular audit of admin permissions
5. Monitor suspicious activity through logs

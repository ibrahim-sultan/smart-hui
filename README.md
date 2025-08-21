# Smart HUI - University Complaint Management System

A comprehensive complaint management system built for Al-Hikmah University using the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

### For Students & Staff
- **User Registration & Authentication**: Secure login/registration system
- **Complaint Submission**: Submit complaints across various categories
- **Real-time Status Tracking**: Monitor complaint progress in real-time
- **Notification System**: Get notified about complaint status updates
- **Comment System**: Communicate with administrators through comments

### For Administrators
- **Multi-level Admin System**: Super admin and regular admin roles
- **Complaint Management**: View, update, and manage complaints
- **Priority Management**: Set and update complaint priorities
- **Category-based Access Control**: Admins can only access authorized categories
- **Admin Creation**: Super admins can create new admin accounts
- **Comprehensive Dashboard**: Overview of all complaints and statistics

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email functionality
- **bcrypt** for password hashing

### Frontend
- **React.js** with hooks
- **React Router** for navigation
- **Framer Motion** for animations
- **Axios** for API calls
- **CSS3** for styling

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-hui.git
cd smart-hui
```

### 2. Install Dependencies
```bash
# Install root dependencies (optional)
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration
Create a `.env` file in the server directory based on `.env.example`:

```bash
cd server
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-hikmah
JWT_SECRET=your-super-secret-jwt-key

# Email configuration for password reset
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### 4. Database Setup
Make sure MongoDB is running on your system or configure MongoDB Atlas connection.

### 5. Run the Application

#### Development Mode (Both client and server)
From the root directory:
```bash
npm run dev
```

#### Run Separately
```bash
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Complaints
- `GET /api/complaints` - Get all complaints (filtered by role)
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `POST /api/complaints/:id/comments` - Add comment to complaint

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/create` - Create new admin (Super admin only)
- `PUT /api/admin/change-password` - Change password on first login

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread count

### Password Reset
- `POST /api/password-reset/forgot-password` - Send reset email
- `POST /api/password-reset/reset-password/:token` - Reset password

## User Roles

### Student
- Submit complaints
- View own complaints
- Receive notifications
- Comment on complaints

### Staff
- Same as student role
- May have additional privileges (configurable)

### Admin
- View complaints in authorized categories
- Update complaint status and priority
- Assign complaints to other admins
- Manage complaint resolution

### Super Admin
- Full access to all complaints
- Create and manage admin accounts
- System-wide administration
- Access to admin management panel

## Complaint Categories

- Academic
- Administrative
- Infrastructure
- Financial
- Network
- Password
- Additional Credit
- Other

## Admin Permission System

Admins are assigned specific categories they can manage:

1. **Full Access Admins**: Can see all complaints
2. **Network/Password/Credit Admins**: Limited to network, password, and additional credit issues
3. **Password/Credit Only**: Limited to password and additional credit issues only

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Bug Fixes Applied

- ✅ Fixed User model field mismatch (firstName/lastName instead of name)
- ✅ Updated authentication routes to use correct field names  
- ✅ Created comprehensive .env.example template
- ✅ Updated root package.json with proper scripts and metadata
- ✅ Improved MongoDB connection error handling
- ✅ Added proper .gitignore file

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@smart-hui.com or create an issue in the GitHub repository.

## Acknowledgements

- Al-Hikmah University for the project requirements
- The MERN stack community for excellent documentation
- All contributors who helped improve this system

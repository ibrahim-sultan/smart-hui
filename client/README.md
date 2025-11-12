# Al-Hikmah University - Complaint & Issue Reporting System

A comprehensive React-based web application for managing institutional complaints and issues at Al-Hikmah University, Ilorin, Nigeria.

## 🎯 Features

### Student Portal
- Submit complaints about course forms, internet/network issues, facilities, and more
- Priority level selection (Low, Medium, High)
- Real-time form validation
- Success notifications with animations

### Staff Portal
- Report technical and administrative issues
- Department-specific categorization
- Urgent priority option for critical issues
- Enhanced issue tracking

### Admin Dashboard
- View all complaints from students and staff
- Filter by type, status, priority, and date
- Update complaint priorities and status
- Detailed complaint view with modal
- Real-time statistics and analytics
- Responsive data visualization

## 🚀 Technologies Used

- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Framer Motion** - Smooth animations and transitions
- **CSS3** - Custom styling with CSS variables
- **Local Storage** - Data persistence (can be extended to backend)

## 🎨 Design Features

- **University Branding** - Al-Hikmah University colors and theme
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Smooth Animations** - Page transitions and interactive elements
- **Modern UI/UX** - Clean, professional interface
- **Accessibility** - Keyboard navigation and screen reader support

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
client/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.js
│   │   │   └── Header.css
│   │   ├── StudentSection/
│   │   │   ├── StudentSection.js
│   │   │   └── StudentSection.css
│   │   ├── StaffSection/
│   │   │   ├── StaffSection.js
│   │   │   └── StaffSection.css
│   │   └── AdminDashboard/
│   │       ├── AdminDashboard.js
│   │       └── AdminDashboard.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## 🎯 Usage Guide

### For Students
1. Navigate to the Student Portal
2. Fill in your details (Name, Student ID, Email)
3. Select complaint category and priority
4. Provide detailed description
5. Submit complaint and receive confirmation

### For Staff
1. Access the Staff Portal
2. Enter staff information and department
3. Choose issue category (technical, administrative, etc.)
4. Set priority level (including urgent option)
5. Submit issue report

### For Administrators
1. Open Admin Dashboard
2. View statistics overview
3. Filter complaints by various criteria
4. Update priorities and status
5. Click on complaints for detailed view
6. Track resolution progress

## 🔧 Customization

### Colors & Branding
Update CSS variables in `src/App.css`:
```css
:root {
  --primary-blue: #1e3a8a;
  --secondary-blue: #3b82f6;
  --primary-green: #166534;
  --secondary-green: #22c55e;
  /* Add more custom colors */
}
```

### Adding New Categories
Update the categories array in respective components:
- `StudentSection.js` - Line 15
- `StaffSection.js` - Line 25

### Extending Functionality
- Add backend API integration
- Implement user authentication
- Add email notifications
- Include file upload capabilities
- Add complaint tracking numbers

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Various Platforms
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Use `gh-pages` package
- **Firebase Hosting**: Use Firebase CLI

## 📊 Performance Features

- **Code Splitting** - Lazy loading of components
- **Optimized Images** - Compressed assets
- **Minimal Bundle Size** - Tree shaking enabled
- **Fast Loading** - Preconnect to external resources

## 🔒 Security Considerations

- Input validation and sanitization
- XSS protection
- CSRF protection (when backend is added)
- Secure data transmission

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏫 About Al-Hikmah University

Al-Hikmah University is a private university located in Ilorin, Kwara State, Nigeria. The university is committed to providing quality education and maintaining excellent standards in learning for wisdom and morality.

## 📞 Support

For technical support or questions about this application, please contact the IT department at Al-Hikmah University.

---

**Built with ❤️ for Al-Hikmah University Community**

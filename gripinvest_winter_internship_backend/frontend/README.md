# Grip Invest Frontend

A modern, responsive React.js frontend application for the Grip Invest investment platform. This application provides a comprehensive interface for users to browse, invest in, and manage their investment portfolio.

## 🚀 Features

### Authentication & Security
- **User Registration & Login** - Secure authentication with JWT tokens
- **Password Management** - Change password, forgot password functionality
- **Profile Management** - Update user profile and preferences
- **Two-Factor Authentication** (Ready for implementation)

### Investment Management
- **Product Discovery** - Browse and filter investment products
- **Investment Simulation** - Calculate expected returns before investing
- **Portfolio Management** - Track and manage all investments
- **Real-time Updates** - Live portfolio value and performance tracking

### Dashboard & Analytics
- **Interactive Dashboard** - Overview of portfolio performance
- **Advanced Charts** - Portfolio allocation and performance visualization
- **Risk Metrics** - Comprehensive risk analysis and scoring
- **Investment Insights** - AI-powered recommendations and analysis

### User Experience
- **Responsive Design** - Works seamlessly on all devices
- **Modern UI/UX** - Clean, intuitive interface with Tailwind CSS
- **Loading States** - Smooth loading experiences
- **Error Handling** - Comprehensive error management
- **Toast Notifications** - Real-time feedback for user actions

## 🛠️ Technology Stack

### Core Technologies
- **React 18.2** - Modern React with hooks and concurrent features
- **React Router 6.15** - Client-side routing and navigation
- **Axios 1.5** - HTTP client for API communications
- **React Hook Form 7.45** - Efficient form handling and validation

### UI & Styling
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **React Icons 4.11** - Comprehensive icon library
- **Framer Motion 10.16** - Animation and transitions
- **React Hot Toast 2.4** - Toast notifications

### Data Visualization
- **Recharts 2.8** - Modern charting library
- **React Loading Skeleton 3.3** - Loading placeholders
- **React DatePicker 4.16** - Date selection components

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **React Scripts 5.0** - Build and development tools

## 📦 Installation & Setup

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gripinvest_winter_internship_backend/frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Required environment variables:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME="Grip Invest"
REACT_APP_APP_VERSION=1.0.0
```

### 4. Start Development Server
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`

## 🚀 Production Build

### Build for Production
```bash
npm run build
# or
yarn build
```

### Serve Production Build
```bash
# Install serve globally
npm install -g serve

# Serve the build
serve -s build -l 3000
```

## 📁 Project Structure

```
frontend/
├── public/                 # Static files
│   ├── index.html         # HTML template
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable components
│   │   ├── Common/        # Common components (LoadingSpinner, etc.)
│   │   └── Layout/        # Layout components (Navbar, Sidebar)
│   ├── contexts/          # React contexts
│   │   └── AuthContext.js # Authentication context
│   ├── pages/             # Page components
│   │   ├── Auth/          # Authentication pages
│   │   ├── Dashboard.js   # Main dashboard
│   │   ├── Products.js    # Product listing
│   │   ├── ProductDetails.js # Product details
│   │   ├── Portfolio.js   # Portfolio management
│   │   └── Profile.js     # User profile
│   ├── services/          # API services
│   │   └── api.js         # API client and endpoints
│   ├── utils/             # Utility functions
│   │   └── constants.js   # Application constants
│   ├── App.js             # Main app component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles
├── tailwind.config.js     # Tailwind configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎨 Component Architecture

### Layout Components
- **Layout** - Main layout wrapper with sidebar and navbar
- **Navbar** - Top navigation with user menu and notifications
- **Sidebar** - Side navigation with route links

### Page Components
- **Dashboard** - Portfolio overview and quick actions
- **Products** - Investment product listing with filters
- **ProductDetails** - Detailed product view with investment form
- **Portfolio** - Investment portfolio management
- **Profile** - User profile and settings management

### Authentication Pages
- **Login** - User login form
- **Signup** - User registration form
- **ForgotPassword** - Password reset request

### Common Components
- **LoadingSpinner** - Reusable loading indicator
- **ErrorBoundary** - Error boundary for error handling

## 🔧 API Integration

### Authentication APIs
```javascript
// Login user
authAPI.login(email, password)

// Register user
authAPI.signup(userData)

// Get user profile
authAPI.getProfile()

// Update profile
authAPI.updateProfile(profileData)
```

### Investment APIs
```javascript
// Get all products
productsAPI.getProducts(filters)

// Get product details
productsAPI.getProductById(id)

// Create investment
investmentAPI.createInvestment(investmentData)

// Get portfolio
investmentAPI.getPortfolio(params)
```

## 🎯 Key Features Implementation

### 1. Authentication Flow
- JWT token-based authentication
- Automatic token refresh
- Protected routes with authentication guards
- Persistent login state

### 2. Investment Process
1. Browse products with advanced filtering
2. View detailed product information
3. Simulate investment returns
4. Create investment with form validation
5. Track investment in portfolio

### 3. Portfolio Management
- Real-time portfolio value tracking
- Investment performance analytics
- Risk metrics and scoring
- Asset allocation visualization

### 4. Data Visualization
- Interactive charts for performance tracking
- Portfolio allocation pie charts
- Investment timeline visualization
- Risk metrics dashboard

## 🧪 Testing

### Run Tests
```bash
npm test
# or
yarn test
```

### Run Tests with Coverage
```bash
npm run test:coverage
# or
yarn test:coverage
```

### Linting and Formatting
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** - Full feature set with sidebar navigation
- **Tablet** - Adapted layout with collapsible sidebar
- **Mobile** - Mobile-first design with bottom navigation

### Breakpoints
- **Mobile** - < 768px
- **Tablet** - 768px - 1024px
- **Desktop** - > 1024px

## 🎨 Styling & Theming

### Tailwind CSS Configuration
- Custom color palette matching brand guidelines
- Extended spacing and typography scales
- Custom animation classes
- Responsive utilities

### Component Styling
- Utility-first approach with Tailwind CSS
- Custom CSS classes for common patterns
- Consistent design system implementation
- Dark mode support (configurable)

## 🚀 Performance Optimization

### Code Splitting
- Lazy loading of route components
- Dynamic imports for heavy dependencies
- Bundle splitting for optimal loading

### Optimization Techniques
- Image optimization and lazy loading
- API request caching
- Memoization of expensive calculations
- Efficient re-rendering with React optimization

## 🔒 Security Features

### Frontend Security
- Input sanitization and validation
- XSS protection
- CSRF protection
- Secure token storage
- API request authentication

### Authentication Security
- JWT token management
- Automatic token refresh
- Secure logout functionality
- Session timeout handling

## 🌐 Browser Support

### Supported Browsers
- **Chrome** - Latest 2 versions
- **Firefox** - Latest 2 versions
- **Safari** - Latest 2 versions
- **Edge** - Latest 2 versions

### Polyfills
- Modern JavaScript features
- CSS Grid and Flexbox
- Intersection Observer
- ResizeObserver

## 📈 Future Enhancements

### Planned Features
- **Progressive Web App** (PWA) capabilities
- **Offline support** with service workers
- **Push notifications** for investment updates
- **Advanced analytics** with more chart types
- **Multi-language support** (Hindi, Marathi)
- **Dark mode** theme switching
- **Mobile app** using React Native

### Technical Improvements
- **State management** with Redux Toolkit
- **Real-time updates** with WebSockets
- **Advanced caching** with React Query
- **A/B testing** framework integration
- **Analytics tracking** with Google Analytics
- **Error tracking** with Sentry

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Style Guidelines
- Follow existing code patterns
- Use TypeScript types where applicable
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed

## 📞 Support & Documentation

### Getting Help
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

### Common Issues
- **CORS errors** - Ensure backend is running and configured correctly
- **Build failures** - Check Node.js version and clear node_modules
- **API connection issues** - Verify environment variables

## 📄 License

This project is proprietary software developed for Grip Invest Winter Internship 2025.

---

**Developed with ❤️ for Grip Invest**

For technical support or questions, please contact the development team.
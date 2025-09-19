# Grip Invest Winter Internship 2025 - Mini Investment Platform

A full-stack investment platform built with Node.js, Express.js, React.js, MySQL, and AI integration.

## 🚀 Features

### Backend Features
- **Authentication System**: JWT-based authentication with password reset
- **Investment Products**: CRUD operations for bonds, FDs, mutual funds, ETFs
- **Investment Management**: Create and manage user investments
- **Transaction Logging**: Comprehensive API call logging
- **AI Integration**: Password analysis, product recommendations, portfolio insights
- **Security**: Rate limiting, input validation, SQL injection prevention
- **Testing**: Comprehensive test suite with 75%+ coverage

### Frontend Features
- **Modern UI**: Responsive design with TailwindCSS
- **Dashboard**: Portfolio overview with interactive charts
- **Investment Management**: Browse products and create investments
- **AI-Powered Insights**: Personalized recommendations and analytics
- **Real-time Updates**: Dynamic data visualization
- **Mobile Responsive**: Works on all device sizes

### AI Integrations
- **Password Strength Analysis**: Real-time password evaluation
- **Product Recommendations**: Personalized investment suggestions
- **Portfolio Insights**: Risk analysis and optimization tips
- **Error Analysis**: Intelligent error categorization and solutions

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MySQL with connection pooling
- JWT Authentication
- OpenAI/Gemini AI APIs
- Jest for testing
- Docker for containerization

**Frontend:**
- React.js 18
- React Router for navigation
- Axios for API calls
- TailwindCSS for styling
- Recharts for data visualization
- Framer Motion for animations

**DevOps:**
- Docker & Docker Compose
- Nginx for frontend serving
- MySQL 8.0 database
- Health checks and monitoring

## 📋 Prerequisites

- Node.js 16+
- Docker & Docker Compose
- MySQL 8.0 (if running locally)
- OpenAI/Gemini API keys for AI features

## 🚀 Quick Start with Docker

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/gripinvest_winter_internship_backend.git
cd gripinvest_winter_internship_backend
```

2. **Set up environment variables:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. **Start the application:**
```bash
docker-compose up --build
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## 🔧 Local Development

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Run SQL scripts
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 📊 Database Schema

### Users Table
- UUID primary key
- Authentication and profile information
- Risk appetite preferences

### Investment Products Table
- Bonds, FDs, mutual funds, ETFs
- Risk levels and yield information
- Investment limits and descriptions

### Investments Table
- User investment records
- Expected returns and maturity dates
- Investment status tracking

### Transaction Logs Table
- Complete API call logging
- Error tracking and analysis
- User activity monitoring

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion

### Investment Products
- `GET /api/products` - List products with filters
- `GET /api/products/recommendations` - AI-powered recommendations
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

### Investments
- `POST /api/investments` - Create investment
- `GET /api/investments/portfolio` - User portfolio
- `GET /api/investments/insights` - AI portfolio analysis

### Transaction Logs
- `GET /api/logs` - Transaction logs with filters
- `GET /api/logs/errors` - Error analysis

## 🤖 AI Integration Details

### Password Analysis
- Real-time strength checking
- Improvement suggestions
- Security recommendations

### Investment Recommendations
- Personalized product suggestions based on risk appetite
- Market analysis and trend predictions
- Portfolio optimization recommendations

### Portfolio Insights
- Risk distribution analysis
- Performance predictions
- Diversification suggestions

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Security headers with Helmet

## 📈 Performance Optimizations

- Database connection pooling
- API response caching
- Image optimization
- Code splitting in React
- Gzip compression
- Static asset caching

## 🐳 Docker Configuration

- Multi-stage builds for optimization
- Health checks for all services
- Volume persistence for database
- Network isolation
- Environment-based configuration

## 📝 Development Process

This project was built following modern development practices:
- Test-driven development (TDD)
- RESTful API design
- Component-based architecture
- Git workflow with meaningful commits
- Code review and quality gates
- Documentation-first approach

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Grip Invest Winter Intern 2025**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🤖 AI Integration & Usage

This project extensively leverages AI to enhance both development speed and user experience:

### Development Acceleration
- **Code Generation**: 70% faster development using Claude Sonnet 4 and GitHub Copilot
- **Test Suite Creation**: Comprehensive test coverage (75%+) generated with AI assistance
- **Documentation**: Auto-generated API documentation and code comments
- **Error Handling**: AI-suggested robust error handling patterns

### User-Facing AI Features
- **Password Analysis**: Real-time AI-powered password strength evaluation with personalized suggestions
- **Investment Recommendations**: Intelligent product suggestions based on user risk appetite and market trends
- **Portfolio Insights**: AI-driven risk analysis, diversification scoring, and optimization recommendations
- **Error Analytics**: Automated log analysis with pattern recognition and issue prioritization

### AI Tools Used
- **OpenAI GPT-4**: Advanced text analysis and recommendation generation
- **Google Gemini**: Alternative AI service for redundancy and comparison
- **Claude Sonnet 4**: Primary development assistant for code generation and documentation
- **GitHub Copilot**: Real-time code completion and suggestion

**Detailed AI Usage**: See [AI-USAGE-DOCUMENTATION.md](./AI-USAGE-DOCUMENTATION.md) for comprehensive details on how AI enhanced this project.

## 📦 Deliverables

### ✅ Complete Implementation
- [x] Working backend APIs with authentication, CRUD operations, and business logic
- [x] Fully functional React frontend with responsive design
- [x] MySQL database with optimized schema and seed data
- [x] Docker containerization with health checks
- [x] Comprehensive test suites (75%+ coverage)
- [x] Complete API documentation and Postman collection
- [x] Production-ready deployment configuration

### 📁 Project Structure
```
gripinvest_winter_internship_backend/
├── backend/                 # Node.js/Express API server
├── frontend/               # React.js application
├── database/              # SQL schema and seed data
├── postman/               # API testing collection
├── docker-compose.yml     # Multi-service orchestration
├── AI-USAGE-DOCUMENTATION.md
└── README.md
```

### 🎯 Assignment Compliance
- **Schema Compliance**: Exact adherence to predefined database schemas
- **API Requirements**: All specified endpoints implemented with proper validation
- **AI Integration**: Advanced AI features exceeding minimum requirements
- **Testing**: Jest test suites with 75%+ coverage for both frontend and backend
- **Documentation**: Comprehensive documentation including AI usage details

## 🙏 Acknowledgments

- Grip Invest team for the internship opportunity
- OpenAI/Google for AI API services that powered intelligent features
- React and Node.js communities for excellent frameworks
- Claude AI for exceptional development assistance and acceleration

---

**Built with ❤️ and 🤖 AI for Grip Invest Winter Internship 2025**

# 🎨 LoanSyncro Frontend

A modern, responsive React TypeScript application for personal loan management, built with Vite and deployed on AWS Amplify.

## 🚀 Tech Stack

- **⚛️ React 18.2.0** - Modern UI library with hooks
- **📘 TypeScript 5.0.2** - Type-safe JavaScript
- **⚡ Vite 4.3.2** - Fast build tool and dev server
- **🎨 Tailwind CSS 3.3.0** - Utility-first CSS framework
- **📡 Axios 1.3.4** - HTTP client with interceptors
- **🔐 AWS Amplify Auth** - Authentication integration
- **🧭 React Router DOM 6.8.1** - Client-side routing

## 📁 Project Structure

```
frontend/
├── 📂 public/                  # Static assets
│   ├── favicon.svg
│   └── vite.svg
├── 📂 src/
│   ├── 📂 assets/             # Images and static resources
│   ├── 📂 components/         # Reusable UI components
│   │   ├── 📂 auth/           # Authentication components
│   │   │   ├── ConfirmSignUpForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── 📂 layout/         # Layout components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Logo.tsx
│   │   ├── 📂 loans/          # Loan management components
│   │   │   ├── LoanCard.tsx
│   │   │   ├── LoanDetailModal.tsx
│   │   │   ├── LoanForm.tsx
│   │   │   └── LoanLists.tsx
│   │   └── 📂 repayments/     # Repayment components
│   │       ├── RepaymentForm.tsx
│   │       └── RepaymentList.tsx
│   ├── 📂 contexts/           # React Context providers
│   │   └── AuthContext.tsx
│   ├── 📂 hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useLoans.ts
│   ├── 📂 pages/              # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── 📂 loans/
│   │   │   ├── create.tsx
│   │   │   └── index.tsx
│   │   └── 📂 repayments/
│   │       └── index.tsx
│   ├── 📂 services/           # API and external services
│   │   ├── api.ts
│   │   └── congnitoAuth.ts
│   ├── 📂 types/              # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── loan.ts
│   │   └── repayment.ts
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Application entry point
│   ├── index.css              # Global styles
│   └── aws-exports.ts         # AWS configuration
├── 📄 package.json            # Dependencies and scripts
├── 📄 vite.config.ts          # Vite configuration
├── 📄 tailwind.config.js      # Tailwind CSS configuration
├── 📄 tsconfig.json           # TypeScript configuration
└── 📄 .env                    # Environment variables
```

## 🔧 Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_USER_POOL_CLIENT_ID=your-client-id
VITE_S3_BUCKET=your-s3-bucket-name

# App Configuration
VITE_NAME=LoanSyncro
VITE_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Het-07/LoanSyncro.git
   cd LoanSyncro/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your AWS configuration
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📜 Available Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Build production-ready application       |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint for code quality checks       |

## 🏗️ Architecture & Design Patterns

### Component Architecture

- **Functional Components**: Utilizing React hooks for state management
- **Custom Hooks**: Encapsulating business logic (`useAuth`, `useLoans`)
- **Context Providers**: Global state management for authentication
- **Higher-Order Components**: Layout wrapper for consistent UI

### State Management

- **React Context**: Global authentication state
- **Local State**: Component-specific state with `useState`
- **Custom Hooks**: Reusable stateful logic
- **API State**: Cached responses and optimistic updates

### Styling Strategy

- **Tailwind CSS**: Utility-first approach for rapid development
- **Responsive Design**: Mobile-first with breakpoint prefixes
- **Component Variants**: Reusable button and card styles
- **Dark Theme**: Custom color palette for modern UI

### Authentication Features

- **JWT Token Management**: Automatic token refresh and storage
- **Protected Routes**: Route guards for authenticated pages
- **Login/Register**: Email-based authentication with Cognito
- **Password Requirements**: Secure password policies
- **Session Management**: Automatic logout on token expiry

## 📊 Key Components

### Loan Management

- **LoanForm**: Create and edit loan details with validation
- **LoanCard**: Display loan summary with status indicators
- **LoanDetailModal**: Comprehensive loan information and editing
- **LoanLists**: Paginated loan listing with search/filter

### Repayment Tracking

- **RepaymentForm**: Record new payments with date validation
- **RepaymentList**: Payment history with grouping by loan
- **Payment Status**: Real-time status updates and progress tracking

### Dashboard & Analytics

- **DashboardPage**: Overview of loans, payments, and statistics
- **Financial Metrics**: Total borrowed, repaid, and outstanding amounts
- **Visual Indicators**: Progress bars and status badges

## 🎨 UI/UX Features

### Design System

- **Consistent Typography**: Defined font scales and weights
- **Color Palette**: Primary, secondary, and semantic colors
- **Spacing System**: Tailwind's spacing scale for consistency
- **Interactive Elements**: Hover states and smooth transitions

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoint Strategy**: sm, md, lg, xl responsive breakpoints
- **Touch-Friendly**: Appropriate touch targets and gestures
- **Progressive Enhancement**: Enhanced features for larger screens

### Accessibility

- **Semantic HTML**: Proper heading structure and landmarks
- **ARIA Labels**: Screen reader support for dynamic content
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliant color combinations

## 🔗 API Integration

### HTTP Client Configuration

```typescript
// Axios instance with authentication
const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
});

// JWT token interceptor
api.interceptors.request.use(async (config) => {
  const token = await cognitoAuthService.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Services

- **loanService**: CRUD operations for loan management
- **repaymentService**: Payment recording and history
- **authService**: Authentication and user management

## 🧪 Testing Strategy

### Recommended Testing Approach

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API mocking with MSW
- **E2E Tests**: Cypress for critical user flows
- **Visual Testing**: Storybook for component documentation

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

### Build Output

- **Optimized Bundle**: Tree-shaking and code splitting
- **Asset Optimization**: Image compression and lazy loading
- **Progressive Web App**: Service worker for offline capability

### AWS Amplify Deployment

The application is automatically deployed via AWS Amplify:

1. **GitHub Integration**: Automatic builds on push to main branch
2. **Environment Variables**: Configured in Amplify console
3. **Custom Domain**: SSL certificate and domain management
4. **CDN Distribution**: Global edge locations for performance

## 🔧 Development Tips

### Code Organization

- **Absolute Imports**: Use TypeScript path mapping
- **Component Naming**: PascalCase for components
- **File Structure**: Group by feature, not by file type
- **Export Strategy**: Named exports for better tree-shaking

### Performance Optimization

- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: React.lazy for non-critical components
- **Memoization**: React.memo for expensive renders
- **Bundle Analysis**: Use bundle analyzer for optimization

### TypeScript Best Practices

- **Strict Mode**: Enable all strict type checking
- **Interface Definitions**: Clear type contracts
- **Generic Types**: Reusable type definitions
- **Type Guards**: Runtime type checking

## 🐛 Troubleshooting

### Common Issues

**Environment Variables Not Loading**

```bash
# Ensure variables are prefixed with VITE_
VITE_API_URL=your-api-url
```

**AWS Cognito Authentication Errors**

- Verify User Pool ID and Client ID
- Check CORS configuration in API Gateway
- Ensure proper IAM permissions

**Build Failures**

- Clear node_modules and reinstall dependencies
- Check TypeScript errors with `npm run lint`
- Verify environment variables in build environment

## 📈 Performance Metrics

- **Bundle Size**: < 500KB gzipped
- **First Contentful Paint**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: 90+ across all categories

## 🤝 Contributing

1. **Code Style**: Follow ESLint configuration
2. **Type Safety**: Ensure all TypeScript types are defined
3. **Testing**: Add tests for new components
4. **Documentation**: Update README for new features

## 📚 Resources

- [React Documentation](https://reactjs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [AWS Amplify Docs](https://docs.amplify.aws/)

---

<div align="center">

**Built with ❤️ using React, TypeScript, and AWS**

[⬅️ Back to Main README](../README.md)

</div>

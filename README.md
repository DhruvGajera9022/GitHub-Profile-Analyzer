# GitHub Profile Analyzer API

A comprehensive Node.js/Express API for analyzing GitHub profiles with proper logging, error handling, and MongoDB integration.

## Features

- 🔍 **Complete GitHub Profile Analysis**: Fetch user profiles, repositories, and generate detailed statistics
- 📊 **Advanced Analytics**: Language breakdown, repository statistics, top repositories, and more
- 💾 **MongoDB Integration**: Persistent storage with optimized schemas and indexes
- 🚀 **Performance Optimized**: Caching, rate limiting, and batch operations
- 📝 **Comprehensive Logging**: Detailed logging with Winston for monitoring and debugging
- 🛡️ **Security**: Helmet, CORS, rate limiting, and input validation
- 🔄 **Error Handling**: Proper error handling with detailed error responses
- ⚡ **TypeScript**: Full TypeScript support with proper type definitions

## API Endpoints

### Profile Management

- `GET /api/github/profile/:username` - Get complete user profile and analysis
- `GET /api/github/profile/:username/stats` - Get user statistics only
- `GET /api/github/profile/:username/languages` - Get language breakdown
- `DELETE /api/github/profile/:username/cache` - Clear cached data for user

### Analytics

- `GET /api/github/users/analyzed` - List all analyzed users with pagination

### System

- `GET /health` - Health check endpoint
- `GET /` - API information and available endpoints

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/DhruvGajera9022/GitHub-Profile-Analyzer.git
   cd GitHub-Profile-Analyzer
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Environment Variables

| Variable       | Description                          | Required | Default     |
| -------------- | ------------------------------------ | -------- | ----------- |
| `NODE_ENV`     | Environment (development/production) | No       | development |
| `PORT`         | Server port                          | No       | 3000        |
| `MONGODB_URI`  | MongoDB connection string            | Yes      | -           |
| `GITHUB_TOKEN` | GitHub Personal Access Token         | No\*     | -           |
| `LOG_LEVEL`    | Logging level                        | No       | info        |

\*GitHub token is highly recommended to avoid rate limiting

## 🚢 Docker Support

### 🐳 Build & Run with Docker

1. Build the Docker image

```bash
   docker build -t github-analyzer .
```

2. Run the container with .env

```bash
   docker run --env-file .env -p 5000:5000 github-analyzer
```

## Logging

The application uses Winston for comprehensive logging:

- **Console**: Colored output for development
- **Files**:
  - `logs/combined.log` - All logs
  - `logs/error.log` - Error logs only

Log levels: `error`, `warn`, `info`, `http`, `debug`

## Performance Features

- **Caching**: Intelligent caching with configurable TTL
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Batch Operations**: Efficient database operations
- **Indexes**: Optimized MongoDB indexes for fast queries
- **Pagination**: Built-in pagination for large datasets

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run linting
npm run lint
npm run lint:fix

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Build for production
npm run build
```

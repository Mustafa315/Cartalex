# Cartalex Project (Improved Version - Ezz Eldin)

# how to launch : 
# in 2 terminals : 
# from project root
1- docker build -t cartalex-app .
docker run --rm -p 3000:3000 --name cartalex_app cartalex-app
2- docker compose up -d tegola


## Overview

Cartalex is a web-based GIS (WebSIG) platform for archaeological and historical data visualization and analysis. This improved version incorporates best practices in security, code structure, performance, accessibility, and maintainability for both backend and frontend.

---

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Backend Improvements](#backend-improvements)
- [Frontend Improvements](#frontend-improvements)
- [General Improvements](#general-improvements)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Modular backend with Express.js and PostgreSQL
- Secure, parameterized database queries
- Environment-based configuration for secrets
- Centralized error handling and logging
- Responsive, accessible frontend with modern JS and CSS
- API documentation and clear project structure
- Docker support for deployment

---

## Project Structure

```
Cartalex/
  backend/
    src/
      server/
        routes/
        middleware/
        db/
      ...
    postgres/
    Dockerfile
    ...
  frontend/
    src/
      html/
      css/
      js/
      img/
    ...
  .env
  .gitignore
  README.md
  README2.md
  package.json
  ...
```

---

## Backend Improvements
- **Security**: All SQL queries are parameterized. Secrets (DB credentials, API keys) are stored in `.env` files.
- **Input Validation**: All user input is validated and sanitized using libraries like `express-validator` or `Joi`.
- **Modularization**: Routes, middleware, and database logic are separated for maintainability.
- **Error Handling**: Centralized error middleware provides safe, consistent error responses.
- **Logging**: Uses `winston` or `morgan` for robust logging.
- **Performance**: Pagination is implemented for large datasets. Caching is recommended for frequent queries.
- **Documentation**: All API endpoints are documented (Swagger/OpenAPI or Markdown).

---

## Frontend Improvements
- **HTML**: Uses semantic HTML5 tags and meta tags for SEO and responsiveness. All images have `alt` attributes.
- **CSS**: Organized and modularized. Responsive design with media queries. Optionally uses a CSS framework (Bootstrap, Tailwind).
- **JavaScript**: Uses ES6 modules, modern syntax, and avoids global namespace pollution. Client-side input validation and user-friendly error handling.
- **Images**: Optimized for web (compressed, modern formats).
- **Accessibility**: Color contrast, font sizes, and ARIA labels are improved.

---

## General Improvements
- **Project Structure**: Clear separation of backend and frontend code.
- **Version Control**: `.gitignore` excludes sensitive and unnecessary files.
- **Dependency Management**: Regularly updated and audited dependencies.
- **Testing**: Unit and integration tests for backend and frontend.
- **Deployment**: Updated Dockerfile and CI/CD pipeline for automated testing and deployment.

---

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Cartalex
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your secrets (DB credentials, etc.)
4. **Database setup**
   - Restore the PostgreSQL database from the provided dump in `postgres/`.
5. **Build the project**
   ```bash
   npm run build
   ```
6. **Start the server**
   ```bash
   npm start
   ```
7. **Access the app**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage
- The backend serves both API endpoints and static frontend files.
- API documentation is available at `/api-docs` (if Swagger is set up).
- Use the web interface to explore, filter, and visualize archaeological data.

---

## Testing
- Run backend and frontend tests with:
  ```bash
  npm test
  ```
- Ensure database migrations and seed scripts are tested.

---

## Contributing
- Fork the repository and create a feature branch.
- Follow the code style and commit message guidelines.
- Submit a pull request with a clear description of your changes.

---

## License
This project is licensed under the MIT License. 
# EcolithSwap Backend

This is the backend for the EcolithSwap application, a platform for battery swapping and plastic waste recycling.

## Project Structure

The project is organized into the following directories:

- **`config`**: Contains the database configuration.
- **`migrations`**: Holds the database schema migrations, managed by Knex.js.
- **`middleware`**: Includes custom middleware for authentication, file uploads, and error handling.
- **`routes`**: Defines the API endpoints for different modules.
- **`uploads`**: Stores uploaded files, such as images for batteries, stations, and user profiles.

## Database Schema

The database schema is defined through a series of migration files in the `migrations` directory. The key tables include:

- **`users`**: Stores user information, including authentication details and roles.
- **`user_profiles`**: Contains extended user profile data, such as vehicle information and points.
- **`stations`**: Manages swap station details, including location, type, and availability.
- **`batteries`**: Tracks individual battery information, such as status, health, and current location.
- **`battery_rentals`**: Logs battery rental transactions.
- **`plastic_waste_logs`**: Records plastic waste submissions from users.
- **`payments`**: Manages payment information for rentals and other services.

## API Routes

The API is built with Express.js and is organized into the following route modules:

- **`admin.js`**: Provides administrative endpoints for monitoring the platform, including a dashboard with overview statistics, analytics, and data export functionalities.
- **`analytics.js`**: Offers detailed analytics on user growth, revenue, rental metrics, environmental impact, and station performance.
- **`auth.js`**: Handles user authentication, including registration, login, token management, and profile updates.
- **`batteries.js`**: Manages all battery-related operations, such as creating, retrieving, updating, and deleting batteries, as well as handling image uploads.
- **`fileUpload.js`**: Manages file uploads for various modules, including waste submissions, stations, and user profiles.
- **`payments.js`**: Handles payment processing, including creating and retrieving payment information, processing refunds, and providing payment statistics.
- **`stations.js`**: Manages swap stations, including creating, retrieving, updating, and deleting stations, as well as finding nearby stations.
- **`users.js`**: Manages user accounts, including retrieving, updating, and deleting users, and updating user roles and statuses.
- **`waste.js`**: Handles plastic waste submissions, including logging, verifying, and retrieving waste data.

## Getting Started

To run the project, you need to have Node.js and a compatible database (such as MySQL or PostgreSQL) installed.

1. **Clone the repository.**
2. **Install dependencies:** `npm install`
3. **Set up the database:**
   - Create a database for the project.
   - Copy the `.env.example` file to `.env` and configure the database connection details.
4. **Run database migrations:** `knex migrate:latest`
5. **Start the server:** `npm start`

The API will be available at `http://localhost:3000` by default.

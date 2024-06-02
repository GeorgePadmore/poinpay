# PoinPay System

## Overview

This Node.js & typescript application implements a wallet system that allows users to manage their account balances, perform transactions (such as topping up balance and transferring funds), and view transaction history. The system ensures data integrity, reliability, and consistency through various design choices.

## Design Choices

### Idempotency Keys

Idempotency keys are used to prevent duplicate transactions caused by repeated requests. When a transaction request is made, a unique idempotency key is generated and associated with the request. Before processing the transaction, the system checks if a transaction with the same idempotency key already exists. If so, it prevents the execution of duplicate transactions, maintaining data integrity and preventing unintended side effects.

### Transactional Integrity

All transactions involving changes to user balances are performed atomically within a database transaction. This ensures that either all changes related to a transaction are committed successfully, or none of them are. By maintaining transactional integrity, the system prevents inconsistencies that could arise from concurrent access or failures during the transaction process.

### Error Handling

Comprehensive error handling mechanisms are implemented to handle exceptional scenarios gracefully. In case of errors during transaction processing, such as insufficient funds or database failures, the system rolls back the transaction to its original state and logs the error for diagnostic purposes. This ensures that no incomplete or erroneous data is persisted, and provides visibility into the system's operation for troubleshooting.

### Asynchronous Communication

Notifications regarding transaction status are sent asynchronously to users involved in the transaction. By decoupling the notification process from the transaction processing, the system ensures that transactional operations remain efficient and responsive, regardless of potential delays or failures in the notification delivery process. Asynchronous communication improves system resilience and scalability by minimizing the impact of external dependencies on transaction processing performance.

## Setup Instructions

1. **Install Dependencies**: Ensure Node.js and npm are installed on your system. Then, run `npm install` to install the project dependencies listed in `package.json`.

2. **Database Configuration**: Create a `.env` file in your root directory with the following configuration variables. Change the values to match your database credentials:

    ```dotenv
    DB_TYPE=postgres
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=your_database_username
    DB_PASSWORD=your_database_password
    DB_DATABASE=your_database_name
    DB_SYNCHRONIZE=true

    APPLICATION_URL = "http://localhost:3000/api"
    JWT_SECRET_KEY=YOUR_SECRET_KEY_HERE
    ```

    Replace `your_database_username`, `your_database_password`, and `your_database_name` with your actual database credentials.

4. **Setting up email service**: Postmark is being used as the SMS gateway. Update your `.env`file and add the following values. Customize it with your own email API.
```dotenv

    EMAIL_FROM="info@poinpay.com"
    EMAIL_API_KEY="YOUR EMAIL API KEY"
 ```

3. **Start the Application**: You have two options to start the application:

    - **Development Mode**: Run `npm run dev` to start the application in development mode. This command will compile TypeScript files and start the server using `nodemon`, which automatically restarts the server when changes are detected. Access the application at `http://localhost:3000` (or the configured port).

    - **Production Mode**: Run `npm start` to start the application in production mode. This command will compile TypeScript files and start the server using Node.js. Access the application at `http://localhost:3000` (or the configured port).

4. **Access the Application**: Open a web browser and navigate to `http://localhost:3000` (or the configured port) to access the wallet system.

5. **Testing**: Use appropriate testing tools, such as Postman or automated tests, to verify the functionality of the wallet system, including transaction processing, balance adjustments, and error handling.

## Additional Notes

- Make sure to secure sensitive information, such as database credentials and API keys, to prevent unauthorized access.
- Regularly monitor application logs and performance metrics to identify and address any issues or bottlenecks.
- Continuously review and improve the system's design and implementation to meet evolving requirements and ensure optimal performance and reliability.

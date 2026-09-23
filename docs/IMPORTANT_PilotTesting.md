# Initial Run & Pilot Testing Log

This document tracks the common errors and setup steps encountered during the first initialization of the Zestos project on a new local machine.

## Error: "next is not recognized"
- **Cause:** Dependencies were not installed after cloning the repository.
- **Solution:** Run `npm install` to download all necessary packages into the `node_modules` folder.

## Error: "@prisma/client did not initialize yet."
- **Cause:** The Prisma client needs to generate the TypeScript types and query engine based on the `schema.prisma` file before it can connect to the database. This step is required on a fresh install.
- **Solution:** Run `npx prisma generate`.

## Error: "Environment variable not found: DATABASE_URL"
- **Cause:** When setting up a new `.env` file for API keys, the database connection strings from `.env.example` were not copied over, leaving Prisma unable to connect to the database.
- **Solution:** Ensure you copy `DATABASE_URL` and `DIRECT_URL` from `.env.example` into your new `.env` file.

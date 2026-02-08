# Home made

Simple starter project for a homemade app.

## Usage

Install dependencies and start the dev server:

```
npm install
npm run dev
```

Start the fake backend API (JSON server):

```
npm run api
```

Admin runs at `http://localhost:5173/admin`.

## API configuration

Set `VITE_API_URL` to your API base URL (for example on Render):

```
VITE_API_URL=https://your-api.onrender.com
```

## Render deployment

This repo includes a `render.yaml` that provisions:
- `home-made-api` (Node/Express)
- `home-made-admin` (Vite static build)

Steps:
1. Create a new Render Blueprint and point it to this repo.
2. After services are created, update `VITE_API_URL` to the API service URL.

## Database (PostgreSQL)

This UI currently stores data in `localStorage`. The SQL schema below is a
ready-to-use starting point for a future backend.

```
createdb home_made
psql -d home_made -f db/schema.sql
```

Order and invoice numbers use sequences:

```
SELECT 'ORD-' || nextval('order_number_seq');
SELECT 'INV-' || nextval('invoice_number_seq');
```

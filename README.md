## Run the application:

1. Create a volume for postgres:
   `docker volume create postgres_data`
2. Run docker compose:
   `docker compose up`
3. Start frontend (not part of docker compose yet)
   Open another terminal and write:
   `cd frontend && npm run dev`

#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."

for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U postgres -d trustana_db > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    exit 0
  fi
  echo "PostgreSQL is not ready yet. Waiting... ($i/30)"
  sleep 2
done

echo "PostgreSQL failed to start within 60 seconds"
exit 1

.PHONY: help setup clean run test install

help:
	@echo "CareConnect Development Commands"
	@echo "=================================="
	@echo "make setup      - Complete project setup"
	@echo "make install    - Install dependencies"
	@echo "make db-up      - Start PostgreSQL and Redis"
	@echo "make db-down    - Stop PostgreSQL and Redis"
	@echo "make run        - Run backend server"
	@echo "make frontend   - Run frontend dev server"
	@echo "make test       - Run tests"
	@echo "make clean      - Clean project files"
	@echo "make help       - Show this help message"

setup: install db-up
	@echo "✅ CareConnect setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Update .env with your API keys"
	@echo "2. Run 'make run' to start backend"
	@echo "3. Run 'make frontend' to start frontend"

install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	@echo "✅ Dependencies installed"

db-up:
	@echo "🐘 Starting PostgreSQL and Redis..."
	docker-compose up -d
	@echo "✅ Database services started"

db-down:
	@echo "🛑 Stopping database services..."
	docker-compose down
	@echo "✅ Database services stopped"

db-logs:
	@echo "📋 Showing database logs..."
	docker-compose logs -f

db-clean:
	@echo "🧹 Cleaning database..."
	docker-compose down -v
	@echo "✅ Database cleaned"

run:
	@echo "🚀 Starting CareConnect backend..."
	cd backend && python run.py

frontend:
	@echo "🌐 Starting frontend dev server..."
	cd frontend/public && python -m http.server 8000

test:
	@echo "🧪 Running tests..."
	cd backend && pytest tests/ -v

lint:
	@echo "✍️  Linting Python code..."
	cd backend && flake8 app/

format:
	@echo "📝 Formatting Python code..."
	cd backend && black app/

clean:
	@echo "🧹 Cleaning project..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name ".DS_Store" -delete
	rm -rf .pytest_cache .coverage htmlcov
	@echo "✅ Project cleaned"

requirements:
	@echo "📋 Updating requirements.txt..."
	pip freeze > requirements.txt

migrate:
	@echo "🔄 Running database migrations..."
	cd backend && python -c "from app import create_app, db; app = create_app(); db.create_all()" 
	@echo "✅ Migrations complete"

seed-db:
	@echo "🌱 Seeding database with sample data..."
	cd backend && python scripts/seed.py

docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t carenet:latest .
	@echo "✅ Docker image built"

docker-run:
	@echo "🐳 Running with Docker..."
	docker-compose up

.DEFAULT_GOAL := help

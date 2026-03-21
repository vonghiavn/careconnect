# Contributing to CareConnect

Thank you for your interest in contributing to CareConnect! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and supportive of all contributors.

## Getting Started

### Prerequisites
- Python 3.8+
- Git
- Basic knowledge of Flask, React/Vue, and PostgreSQL

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourname/CareNet.git
   cd CareNet
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   pip install pytest pytest-cov black flake8
   ```

4. **Start services**
   ```bash
   docker-compose up -d
   ```

5. **Run tests**
   ```bash
   cd backend && pytest tests/ -v
   ```

## Development Workflow

### Before Writing Code

1. **Check existing issues** - Avoid duplicate work
2. **Create an issue** - Describe your feature/bug
3. **Get feedback** - Get approval before major changes
4. **Assign yourself** - Take ownership of the feature

### Writing Code

### Backend Development

#### Adding a New Endpoint

```python
# 1. Create route in app/routes/module.py
from flask import Blueprint, request, jsonify
from app.routes.auth import token_required

module_bp = Blueprint('module', __name__, url_prefix='/api/module')

@module_bp.route('/endpoint', methods=['POST'])
@token_required
def endpoint():
    data = request.get_json()
    # Implementation
    return jsonify({'result': 'success'}), 200

# 2. Register in app/__init__.py
from app.routes import module_bp
app.register_blueprint(module_bp)

# 3. Add tests in tests/test_module.py
def test_endpoint(client, auth_token):
    response = client.post(
        '/api/module/endpoint',
        json={'data': 'value'},
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
```

## Code Style

### Python
- Follow PEP 8
- Use type hints where possible
- Max line length: 100 characters
- Use docstrings for all functions

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add volunteer matching algorithm
fix: Resolve payment calculation bug
docs: Update API documentation
refactor: Simplify authentication logic
test: Add tests for user endpoints
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run with verbose output
pytest -v
```

## Pull Request Process

1. Create feature branch
2. Add your changes
3. Run tests
4. Commit with clear messages
5. Push and create PR
6. Address review feedback
7. Get approval and merge

## Questions?

- Create an issue with `[Question]` prefix
- Check documentation first
- Ask in discussions

---

**Thank you for contributing to CareConnect!** 🙏

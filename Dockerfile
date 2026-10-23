FROM python:3.15.1-slim
WORKDIR /app
COPY pyproject.toml requirements.lock ./
RUN pip install --no-cache-dir -r requirements.lock
COPY backend ./backend
COPY scripts ./scripts
COPY web ./web
COPY alembic.ini compose.yaml compose.pg17.yaml Dockerfile .python-version .node-version .nvmrc ./
RUN pip install --no-cache-dir --no-deps . && useradd --create-home appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "yiedu.main:app", "--host", "0.0.0.0", "--port", "8000"]

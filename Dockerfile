FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py projects.json ./
COPY templates/ templates/
COPY static/ static/

ENV HOST=0.0.0.0
ENV PORT=8050

EXPOSE 8050

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:8050", "app:app"]

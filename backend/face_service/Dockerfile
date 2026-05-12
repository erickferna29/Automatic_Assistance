FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    cmake build-essential libopenblas-dev liblapack-dev \
    libx11-dev libgtk-3-dev && \
    pip install face_recognition fastapi uvicorn python-multipart
WORKDIR /app
COPY app.py .
CMD ["uvicorn", "app.py:app", "--host", "0.0.0.0", "--port", "5001"]
# Use Python 3.12 slim image as the base image
FROM python:3.12-slim

# Set /app as the working directory inside the container
WORKDIR /app

# Prevent Python from creating .pyc bytecode files,prevent download unnexxessry file
ENV PYTHONDONTWRITEBYTECODE=1

# Show Python output/logs immediately in Docker
ENV PYTHONUNBUFFERED=1

# Copy requirements.txt from project into the container
COPY requirements.txt .

# Install all Python dependencies from requirements.txt
# --no-cache-dir prevents pip from storing unnecessary cache files
RUN pip install --no-cache-dir -r requirements.txt

# Copy the complete FastAPI project into the container
COPY . .

# Inform Docker that FastAPI will use port 8001
EXPOSE 8001

# Start the FastAPI application using Uvicorn
# app.main:app = app folder -> main.py -> FastAPI app object
# --host 0.0.0.0 = allow access from outside the container/0.0.0.0 na "container-kulla irukkura ella network interface-la irundhum request accept pannu" nu meaning.
# --port 8001 = run FastAPI on port 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
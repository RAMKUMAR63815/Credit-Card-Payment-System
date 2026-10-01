# Python 3.12 oda lightweight (small size) Linux environment-la start pannrom
FROM python:3.12-slim

# Container-kulla namma Django project work aagura main folder /app
WORKDIR /app

# Python .pyc files / __pycache__ create panna vendam nu solrom
ENV PYTHONDONTWRITEBYTECODE=1

# Python output/logs immediate-aa Docker terminal-la display aaganum
ENV PYTHONUNBUFFERED=1

# Linux package list update pannrom
# mysqlclient install/build panna thevaiyana packages install pannrom
# Installation mudinjadhum unnecessary apt files delete panni image size reduce pannrom
RUN apt-get update \
    && apt-get install -y default-libmysqlclient-dev build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Namma local project-la irukkura requirements.txt-a container oda /app-kku copy pannrom
COPY requirements.txt .

# requirements.txt-la irukkura Django, DRF, JWT, MySQL packages ellam install pannrom
# --no-cache-dir use pannina pip unnecessary cache store pannaadhu
RUN pip install --no-cache-dir -r requirements.txt

# Django project-oda remaining files ellam container oda /app-kku copy pannrom
COPY . .

# Django container-kulla port 8000-la run aagum nu Docker-ku indicate pannrom
EXPOSE 8000

# Container start aagumbodhu Django server automatically start aaganum
# 0.0.0.0 use pannina container-ku veliya irundhum Django access panna mudiyum
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 

#The Dockerfile defines the environment required to run my Django application
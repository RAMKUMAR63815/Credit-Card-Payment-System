from django.contrib.auth.models import AbstractUser
#"Django, give my User model everything that your AbstractUser already has."
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username
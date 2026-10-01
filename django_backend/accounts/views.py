from django.shortcuts import render

# Django REST Framework-la HTTP status codes use panna
# Example: 201 = Created, 400 = Bad Request
from rest_framework import status

# API response-ah JSON format-la frontend-ku send panna
from rest_framework.response import Response

# API endpoint/class-based view create panna APIView use pannrom
from rest_framework.views import APIView


# Namma create panna RegisterSerializer-ah import pannrom
# Registration data validation + user creation-ku idhu use aagum
from .serializers import RegisterSerializer

from rest_framework.permissions import IsAuthenticated
#already built-in permission class; user login/token valid-aa irukkaa check pannum  

from rest_framework_simplejwt.tokens import RefreshToken

# Register API-ku oru view class create pannrom
# APIView inherit pannradhunaala GET, POST, PUT, DELETE methods handle panna mudiyum
class RegisterView(APIView):

    # HTTP POST request handle panna indha method use pannrom
    # Registration-ku POST use pannrom because new User create panna porom
    def post(self, request):

        # Frontend-la irundhu varra request.data-ah serializer-kku anupprom
        serializer = RegisterSerializer(data=request.data)


        # Serializer received data correct-ah irukka-nu validate pannrom
        # Validation success aana True return aagum
        if serializer.is_valid():

            # Validation success aana serializer.save() call pannrom
            # Idhu RegisterSerializer-oda create() method-ah call pannum
            #
            # create()
            #     ↓
            # User.objects.create_user()
            #     ↓
            # Password hashing
            #     ↓
            # User database-la save
            user = serializer.save()


            # User successfully created aana frontend-ku response send pannrom
            return Response(

                # JSON response data
                {
                    # Registration successful message
                    "message": "User registered successfully",

                    # Created user-oda basic information
                    "user": {

                        # Database-la automatically generated User ID
                        "id": user.id,

                        # Created user's username
                        "username": user.username,

                        # Created user's email
                        "email": user.email,
                    }
                },

                # HTTP 201 means "Created"
                # New User successfully created-nu indicate pannum
                status=status.HTTP_201_CREATED
            )


        # Validation fail aana indha part execute aagum
        return Response(

            # Serializer-la vandha validation errors-ah frontend-ku send pannrom
            serializer.errors,

            # HTTP 400 means Bad Request
            # User sent invalid input-nu indicate pannum
            status=status.HTTP_400_BAD_REQUEST
        )
class MeView(APIView):
    permission_classes = [IsAuthenticated]  # Login pannina user oda token verify panni  access panna allow pannum

    def get(self, request):
        user = request.user  # JWT token-la identify aana logged-in user-a get pannum

        return Response({
            "id": user.id,  # User ID return pannum
            "username": user.username,  # Username return pannum
            "email": user.email,  # Email return pannum
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        })   

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):#POST request vandha execute aagura method
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)## Refresh token-a SimpleJWT object-aa convert pannum
            token.blacklist()

            return Response(
                {"message": "Logout successful"},
                status=status.HTTP_200_OK
            )

        except Exception:
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_400_BAD_REQUEST
            )
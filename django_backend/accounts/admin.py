# Import Django's admin module.
# Used to register and customize models in Django Admin.
from django.contrib import admin
#Django Admin Panel features-ah namma code-la use panna import panrom.

# Import Django's built-in UserAdmin.
# UserAdmin provides the default admin interface for users.
from django.contrib.auth.admin import UserAdmin
#UserAdmin = Django already ready-ah kuduthirukkura user management admin class.CustomUserAdmin(UserAdmin) nu use pannina, Django-oda existing user admin features-ah reuse pannitu namma custom fields/features add panna mudiyum.

# Import our custom User model.
from .models import User


# Register the User model with Django Admin.
# This allows the User model to appear in the Django Admin panel.
@admin.register(User)


# Create a custom admin class for our User model.
# UserAdmin gives us Django's existing user-management features.
class CustomUserAdmin(UserAdmin):

    # Columns that should be displayed in the User list page.
    list_display = [

        # Display the user's database data
        "id",
        "username",
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "created_at",
    ]


    # Fields that can be searched using the search box
    # in Django Admin.
    search_fields = [

        # Search users by username.
        "username",

        # Search users by email.
        "email",
    ]


    # Fields that can be used to filter users
    # from the Django Admin list page.
    list_filter = [

        # Filter users based on staff/admin permission.
        "is_staff",

        # Filter users based on active/inactive status.
        "is_active",
    ]
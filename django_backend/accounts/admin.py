# Import Django's admin module.
# Used to register and customize models in Django Admin.
from django.contrib import admin
# Django Admin Panel features-ah namma code-la use panna import panrom.

# Import Django's built-in UserAdmin.
# UserAdmin provides the default admin interface for users.
from django.contrib.auth.admin import UserAdmin
# UserAdmin = Django already ready-ah kuduthirukkura user management admin class.
# CustomUserAdmin(UserAdmin) nu use pannina, Django-oda existing user admin features-ah reuse pannitu namma custom fields/features add panna mudiyum.

# Import our custom User and AuditLog models.
from .models import AuditLog, User
# User model user details-ah manage pannum; AuditLog model system activities-ah record pannum.


# Register the User model with Django Admin.
# This allows the User model to appear in the Django Admin panel.
@admin.register(User)
# User model-ah Django Admin-la register panrom.

# Create a custom admin class for our User model.
# UserAdmin gives us Django's existing user-management features.
class CustomUserAdmin(UserAdmin):
    # Columns that should be displayed in the User list page.
    list_display = [
        # Display the user's database data.
        "id",  # Displays the user's unique database ID.
        "username",  # Displays the user's username.
        "email",  # Displays the user's email address.
        "first_name",  # Displays the user's first name.
        "last_name",  # Displays the user's last name.
        "is_staff",  # Shows whether the user can access Django Admin, subject to permissions.
        "is_active",  # Shows whether the user account is active.
        "created_at",  # Displays when the user account was created; requires this field in the User model.
    ]

    # Fields that can be searched using the search box in Django Admin.
    search_fields = [
        "username",  # Allows searching users by username.
        "email",  # Allows searching users by email.
    ]

    # Fields that can be used to filter users from the Django Admin list page.
    list_filter = [
        "is_staff",  # Filters users by staff status.
        "is_active",  # Filters users by active/inactive status.
    ]

    # Keep Django's existing user-edit sections and add a custom role section.
    fieldsets = UserAdmin.fieldsets + (
        ("Application permissions", {"fields": ("role",)}),  # Displays the role field when editing an existing user.
    )

    # Keep Django's default user-creation fields and add the role field.
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Application permissions", {"fields": ("role",)}),  # Displays the role field when creating a new user.
    )


# Register the AuditLog model with Django Admin.
@admin.register(AuditLog)
# AuditLog records-ah Django Admin-la view panna register panrom.

# Customize how audit log records appear in the admin website.
class AuditLogAdmin(admin.ModelAdmin):
    # Specifies the columns displayed in the audit log list.
    list_display = (
        "id",  # Displays the unique ID of each audit record.
        "actor",  # Displays the user who performed the action.
        "action",  # Displays the action performed, such as LOGIN or PAYMENT.
        "target_type",  # Displays the type of object affected, such as Card or User.
        "target_id",  # Displays the ID of the affected object.
        "created_at",  # Displays when the action occurred.
    )

    # Adds sidebar filters for action and creation date.
    list_filter = ("action", "created_at")

    # Specifies which fields can be searched using the admin search box.
    search_fields = (
        "actor__username",  # Searches audit records using the actor's username.
        "target_type",  # Searches by the type of object affected.
        "target_id",  # Searches by the affected object's ID.
    )

    # Makes these fields read-only in the audit log detail page.
    readonly_fields = (
        "actor",  # Prevents changing the recorded user through the admin form.
        "action",  # Prevents changing the recorded action.
        "target_type",  # Prevents changing the recorded target type.
        "target_id",  # Prevents changing the recorded target ID.
        "details",  # Prevents editing the recorded audit details.
        "created_at",  # Prevents editing the recorded timestamp.
    )

    # Audit records should not be manually changed through the admin UI.
    def has_add_permission(self, request):
        # Django calls this method to check whether an audit record can be added.
        return False  # Disables manually adding audit records through Django Admin.

    def has_change_permission(self, request, obj=None):
        # Django calls this method to check whether an existing audit record can be changed.
        return False  # Disables editing audit records through Django Admin.

    def has_delete_permission(self, request, obj=None):
        # Django calls this method to check whether an audit record can be deleted.
        return False  # Disables deleting audit records through Django Admin.

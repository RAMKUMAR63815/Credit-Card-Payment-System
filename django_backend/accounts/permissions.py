from rest_framework.permissions import BasePermission  # Imports the base class used to create custom API permission rules.


class HasApplicationRole(BasePermission):  # Creates a reusable permission class to check a user's application role.
    allowed_roles = ()  # Defines an empty tuple of roles allowed to access the API by default.

    def has_permission(self, request, view):  # Checks whether the current user has permission to access the API.
        user = request.user  # Gets the user who sent the API request. view- which api accses

        if not user or not user.is_authenticated:  # Checks whether the user is missing or not logged in.
            return False  # Denies access to unauthenticated users.

        # A superuser has application administrator access.
        if user.is_superuser:  # Checks whether the user is a Django superuser.
            return True  # Allows the superuser to access the API regardless of the assigned role.

        return getattr(user, "role", None) in self.allowed_roles  # Allows access only if the user's role is in the permitted roles.


class IsAdminRole(HasApplicationRole):  # Creates a permission class specifically for administrators.
    allowed_roles = ("ADMIN",)  # Allows users whose application role is ADMIN.


class IsSupportOrAdmin(HasApplicationRole):  # Creates a permission class for support staff and administrators.
    allowed_roles = ("ADMIN", "SUPPORT")  # Allows users whose application role is ADMIN or SUPPORT.


class IsReadOnlyOrAbove(HasApplicationRole):  # Creates a permission class for read-only users and higher roles.
    allowed_roles = ("ADMIN", "SUPPORT", "READ_ONLY")  # Allows users with ADMIN, SUPPORT, or READ_ONLY roles.
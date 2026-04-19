"""
Custom permission classes and decorators for role-based authorization.
"""

from rest_framework.permissions import BasePermission, IsAuthenticated
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


class IsAnalyst(IsAuthenticated):
    """Permission for users with analyst or admin roles."""

    message = 'You must be an analyst or administrator to perform this action.'

    def has_permission(self, request, view):
        # First check authentication
        if not super().has_permission(request, view):
            return False

        # For now, all authenticated users are considered analysts.
        # In a full system, check user.groups or custom role fields.
        # Example: return request.user.groups.filter(name='analysts').exists()
        return True


class IsAdmin(IsAuthenticated):
    """Permission for admin users only."""

    message = 'You must be an administrator to perform this action.'

    def has_permission(self, request, view):
        # First check authentication
        if not super().has_permission(request, view):
            return False

        # For now, all authenticated superusers are admins.
        # In a full system, check user.groups or custom role fields.
        return request.user.is_superuser or request.user.is_staff


def require_analyst(func):
    """Decorator to require analyst permission on action methods."""

    @wraps(func)
    def wrapper(self, request, *args, **kwargs):
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # All authenticated users can be analysts for now
        # Full system would check roles/groups here
        return func(self, request, *args, **kwargs)

    return wrapper

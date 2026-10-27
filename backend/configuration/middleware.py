class PrivateApiHeadersMiddleware:
    """Keep the backend out of search and private API responses out of shared caches."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Robots-Tag"] = "noindex, nofollow"
        response["Referrer-Policy"] = "no-referrer"
        if request.path.startswith(("/api/auth/", "/api/invoices/", "/api/activity/", "/api/subscriptions/")):
            response["Cache-Control"] = "private, no-store"
        return response

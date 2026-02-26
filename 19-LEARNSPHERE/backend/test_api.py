import requests

print("Testing endpoints to ensure no 500 errors (expecting 401 or 403)...")
endpoints = [
    "/api/v1/courses",
    "/api/v1/dashboard/metrics",
    "/api/v1/dashboard/learner-progress",
    "/api/v1/courses/my-courses",
    "/api/v1/courses/b4950fa9-7de4-4cd0-9c2e-eb859b87265a/enroll",
    "/api/v1/enrollments/b4950fa9-7de4-4cd0-9c2e-eb859b87265a/progress"
]

for ep in endpoints:
    method = "get"
    if "enroll" in ep:
        method = "post"
    if "progress" in ep:
        method = "patch"
        
    url = f"http://localhost:8000{ep}"
    
    if method == "get":
        r = requests.get(url)
    elif method == "post":
        r = requests.post(url)
    elif method == "patch":
        r = requests.patch(url, json={"progress_percent": 50})
        
    print(f"[{method.upper()}] {ep} -> {r.status_code}")

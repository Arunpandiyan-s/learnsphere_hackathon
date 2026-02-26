import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    print("Application imported successfully!")
except Exception as e:
    print(f"Failed to import app: {e}")
    import traceback
    traceback.print_exc()

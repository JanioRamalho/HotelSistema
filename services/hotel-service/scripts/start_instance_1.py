import os
import runpy
from pathlib import Path


os.environ.setdefault("PORT", "4101")
os.environ.setdefault("SERVICE_NAME", "hotel-service-1")
runpy.run_path(str(Path(__file__).resolve().parents[1] / "src" / "server.py"), run_name="__main__")


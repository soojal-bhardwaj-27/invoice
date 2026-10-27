"""Run the selected upstream crawler locally; keep audit data in this project."""
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "tools" / "open-seo-crawler"))
import app as crawler
folder = root / "reports" / "seo" / "crawls"
folder.mkdir(parents=True, exist_ok=True)
crawler._CRAWL_FOLDER = str(folder)
crawler._CRAWL_TITLE_HISTORY_PATH = str(folder / "crawl-titles.jsonl")
crawler.app.run(host="127.0.0.1", port=5002, debug=False, threaded=True)

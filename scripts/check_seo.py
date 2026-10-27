"""HTTP-only checks of public HTML, metadata, links and private indexing controls."""
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import requests
from bs4 import BeautifulSoup

base = "http://127.0.0.1:3000"
paths = ["/", "/guides", "/guides/track-client-invoices", "/guides/payment-reminder-examples"]
records = []
all_links = set()
for path in paths:
    response = requests.get(base + path, timeout=30)
    assert response.status_code == 200, (path, response.status_code)
    soup = BeautifulSoup(response.text, "html.parser")
    h1 = soup.find_all("h1")
    assert len(h1) == 1, (path, len(h1))
    title = soup.title.get_text(strip=True)
    description = soup.find("meta", attrs={"name": "description"})["content"]
    assert title and description
    assert "noindex" in response.headers.get("X-Robots-Tag", "")
    assert "noindex" in soup.find("meta", attrs={"name": "robots"})["content"]
    schemas = [json.loads(tag.string) for tag in soup.find_all("script", type="application/ld+json")]
    assert schemas, (path, "Missing structured data")
    assert soup.find("meta", property="og:image")
    for anchor in soup.find_all("a", href=True):
        href = urljoin(base + path, anchor["href"])
        if urlsplit(href).netloc == urlsplit(base).netloc:
            all_links.add(href.split("#")[0])
    records.append({"path": path, "status": 200, "title": title, "description": description,
        "h1": h1[0].get_text(" ", strip=True), "structured_data_blocks": len(schemas),
        "server_rendered": True, "local_noindex": True})
assert len({row["title"] for row in records}) == len(paths)
assert len({row["description"] for row in records}) == len(paths)
for link in all_links:
    assert requests.get(link, timeout=30).status_code == 200, link
for path in ["/app", "/api/auth/me/"]:
    response = requests.get(base + path, timeout=30)
    assert "noindex" in response.headers.get("X-Robots-Tag", ""), path
assert requests.get(base + "/this-page-does-not-exist", timeout=30).status_code == 404
sitemap = requests.get(base + "/sitemap.xml", timeout=30)
assert sitemap.status_code == 200 and "<loc>" not in sitemap.text
image = requests.get(base + "/opengraph-image", timeout=30)
assert image.status_code == 200 and image.headers["Content-Type"].startswith("image/png")
bot_checks = []
for ua in ["Googlebot", "bingbot", "OAI-SearchBot"]:
    response = requests.get(base, headers={"User-Agent": ua}, timeout=30)
    soup = BeautifulSoup(response.text, "html.parser")
    assert response.status_code == 200
    assert soup.h1.get_text(" ", strip=True) == records[0]["h1"]
    assert "Copy a reminder" in soup.get_text(" ", strip=True)
    bot_checks.append({"user_agent": ua, "same_h1_and_main_content": True})
report = {"scope": "Local prelaunch checks; not a public indexability or ranking result",
    "pages": records, "internal_links_checked": len(all_links), "bot_html_checks": bot_checks,
    "image_status": image.status_code, "preview_sitemap_empty": True, "unknown_route_status": 404}
destination = Path(__file__).resolve().parents[1] / "reports" / "seo" / "verification.json"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(f"Passed: {len(records)} public pages, {len(all_links)} internal links, 3 bot HTML checks, private noindex, social image and 404 handling.")
print(f"Report: {destination}")

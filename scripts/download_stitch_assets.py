import json
import os
import pathlib
import urllib.request


ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "reference" / "stitch-manifest.json"
TARGET_DIR = ROOT / "reference" / "stitch"


def download(url: str, output_path: pathlib.Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url) as response:
        output_path.write_bytes(response.read())


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text())

    for item in manifest:
      key = item["key"]
      html_path = TARGET_DIR / "html" / f"{key}.html"
      screenshot_path = TARGET_DIR / "screenshots" / f"{key}.png"

      print(f"Downloading {key} html...")
      download(item["htmlUrl"], html_path)
      print(f"Downloading {key} screenshot...")
      download(item["screenshotUrl"], screenshot_path)

    print("Done.")


if __name__ == "__main__":
    main()

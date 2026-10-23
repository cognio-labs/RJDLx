"""Package reviewed public/source files; never include local account state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
import sys

root = Path(__file__).resolve().parent.parent
output = root / "artifacts"
output.mkdir(exist_ok=True)
folders = ["api", "components", "css", "js", "lib", "images", "scripts", "tests", "docs", "dist"]
files = ["index.html", "package.json", "package-lock.json", "server.js", "site.config.json", "vercel.json", "serve.json", "README.md", "AGENTS.md", "CLAUDE.md", ".gitignore", ".vercelignore", ".nojekyll", "test-email.js", "BUILD-VERIFIED.txt"]
evidence = ["seo-live.json", "seo-local.json", "live-indexing.json", "seo-mobile-home.png", "ga4-live.json", "ga4-local.json", "ga4-browser.json"]
label = sys.argv[1] if len(sys.argv) > 1 else "SEO"
assert label in {"SEO", "GA4"}
selected = [root / name for name in files if (root / name).is_file()]
for folder in folders:
    selected.extend(p for p in (root / folder).rglob("*") if p.is_file())
selected.extend(output / name for name in evidence if (output / name).is_file())
selected = sorted(set(selected))
for p in selected:
    relative = p.relative_to(root)
    assert not any(part in {".git", ".vercel", "node_modules", ".cache", ".aws"} for part in relative.parts)
    assert not p.name.startswith(".env"), relative

archives = []
for filename, contents, prefix in [
    (f"RJDLx-{label}-corrected-project-2026-10-23.zip", selected, "RJDLx/"),
    (f"RJDLx-{label}-static-dist-2026-10-23.zip", sorted(p for p in (root / "dist").rglob("*") if p.is_file()), ""),
]:
    target = output / filename
    with ZipFile(target, "w", ZIP_DEFLATED, compresslevel=6) as archive:
        for p in contents:
            relative = p.relative_to(root if prefix else root / "dist")
            archive.write(p, prefix + relative.as_posix())
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(contents)
        assert not any(Path(name).name.startswith(".env") for name in archive.namelist())
    digest = hashlib.file_digest(target.open("rb"), "sha256").hexdigest()
    archives.append({"file": filename, "bytes": target.stat().st_size, "files": len(contents), "sha256": digest})
(output / "seo-package-manifest.json").write_text(json.dumps(archives, indent=2) + "\n", encoding="utf-8")
print(json.dumps(archives, indent=2))

"""
Portfolio Website — Flask Backend
Apple-style resume site with shared projects.json
"""

import json
import os
import re
import threading
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

ROOT = Path(__file__).parent
PROJECTS_PATH = ROOT / "projects.json"
STATIC_DIR = ROOT / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
MAX_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_SLOTS = 3
_projects_lock = threading.Lock()


def load_projects():
    """Load projects and author info from JSON."""
    with open(PROJECTS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_projects(data):
    """Write projects.json atomically, keeping short lists on one line."""
    text = json.dumps(data, ensure_ascii=False, indent=2)
    text = re.sub(
        r"\[\s*\n\s+((?:null|\"(?:\\.|[^\"\\])*\"|-?\d+)(?:\s*,\s*\n\s+(?:null|\"(?:\\.|[^\"\\])*\"|-?\d+))*)\s*\n\s*\]",
        lambda match: "[" + ", ".join(part.strip().rstrip(",") for part in match.group(1).split("\n")) + "]",
        text,
    )
    tmp_path = PROJECTS_PATH.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        f.write(text)
        if not text.endswith("\n"):
            f.write("\n")
    tmp_path.replace(PROJECTS_PATH)


def can_upload():
    """Uploads stay on the machine that edits the site."""
    return (request.remote_addr or "") in {"127.0.0.1", "::1"}


def ensure_images(project):
    images = project.get("images")
    if not isinstance(images, list):
        legacy = project.get("image")
        images = [legacy] if legacy else []
    normalized = []
    for index in range(IMAGE_SLOTS):
        value = images[index] if index < len(images) else None
        normalized.append(value or None)
    project["images"] = normalized
    project.pop("image", None)
    return normalized


def detect_image_ext(data):
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return ".gif"
    if len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return ".webp"
    return None


def upload_file_path(relative):
    if not relative or not isinstance(relative, str):
        return None
    path = (STATIC_DIR / relative).resolve()
    uploads = UPLOAD_DIR.resolve()
    if path.parent != uploads:
        return None
    return path


@app.route("/")
def index():
    """Main portfolio page."""
    data = load_projects()
    projects = sorted(data["projects"], key=lambda project: project.get("id") or 0, reverse=True)
    for project in projects:
        ensure_images(project)
    return render_template(
        "index.html",
        author=data["author"],
        projects=projects,
        can_upload=can_upload(),
    )


@app.route("/api/projects")
def api_projects():
    """API endpoint for projects (used by bot or external clients)."""
    data = load_projects()
    return jsonify(data)


@app.post("/api/projects/<int:project_id>/images/<int:slot>")
def upload_project_image(project_id, slot):
    """Save one illustration into a project card slot."""
    if not can_upload():
        return jsonify(error="Загрузка доступна только с этого компьютера"), 403
    if slot < 0 or slot >= IMAGE_SLOTS:
        return jsonify(error="Некорректный слот"), 400

    upload = request.files.get("file")
    if upload is None or not upload.filename:
        return jsonify(error="Файл не выбран"), 400

    data = upload.read(MAX_IMAGE_BYTES + 1)
    if not data:
        return jsonify(error="Файл пустой"), 400
    if len(data) > MAX_IMAGE_BYTES:
        return jsonify(error="Файл больше 8 МБ"), 400

    ext = detect_image_ext(data)
    if ext is None:
        return jsonify(error="Нужен файл JPG, PNG, WEBP или GIF"), 400

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"p{project_id}-s{slot}{ext}"
    relative = f"uploads/{filename}"
    destination = UPLOAD_DIR / filename

    with _projects_lock:
        projects_data = load_projects()
        project = next(
            (item for item in projects_data.get("projects", []) if item.get("id") == project_id),
            None,
        )
        if project is None:
            return jsonify(error="Проект не найден"), 404

        images = ensure_images(project)
        previous = upload_file_path(images[slot])
        destination.write_bytes(data)
        if previous and previous != destination.resolve() and previous.exists():
            previous.unlink()
        images[slot] = relative
        save_projects(projects_data)

    return jsonify(url=f"/static/{relative}", path=relative)


@app.delete("/api/projects/<int:project_id>/images/<int:slot>")
def delete_project_image(project_id, slot):
    """Remove one illustration from a project card slot."""
    if not can_upload():
        return jsonify(error="Удаление доступно только с этого компьютера"), 403
    if slot < 0 or slot >= IMAGE_SLOTS:
        return jsonify(error="Некорректный слот"), 400

    with _projects_lock:
        projects_data = load_projects()
        project = next(
            (item for item in projects_data.get("projects", []) if item.get("id") == project_id),
            None,
        )
        if project is None:
            return jsonify(error="Проект не найден"), 404

        images = ensure_images(project)
        previous = upload_file_path(images[slot])
        if previous and previous.exists():
            previous.unlink()
        images[slot] = None
        save_projects(projects_data)

    return jsonify(ok=True)


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=debug, host=host, port=port)

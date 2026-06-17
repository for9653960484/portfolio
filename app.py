"""
Portfolio Website — Flask Backend
Apple-style resume site with shared projects.json
"""

import json
import os
from pathlib import Path

from flask import Flask, render_template, jsonify

app = Flask(__name__)

PROJECTS_PATH = Path(__file__).parent / "projects.json"


def load_projects():
    """Load projects and author info from JSON."""
    with open(PROJECTS_PATH, encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def index():
    """Main portfolio page."""
    data = load_projects()
    return render_template(
        "index.html",
        author=data["author"],
        skills=data.get("skills", []),
        projects=data["projects"],
    )


@app.route("/api/projects")
def api_projects():
    """API endpoint for projects (used by bot or external clients)."""
    data = load_projects()
    return jsonify(data)


if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=debug, host=host, port=port)

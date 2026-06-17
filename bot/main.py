"""
Telegram Resume Bot — aiogram 3
Показывает проекты из projects.json
"""

import asyncio
import json
from pathlib import Path

from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message
from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

PROJECTS_PATH = PROJECT_ROOT / "projects.json"
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


def load_data():
    with open(PROJECTS_PATH, encoding="utf-8") as f:
        return json.load(f)


def format_project(p: dict) -> str:
    tools = p.get("tools", [])
    tools_line = f"\n🛠 {', '.join(tools)}" if tools else ""
    link = p.get("link", "")
    link_line = f"\n🔗 {link}" if link else ""
    return (
        f"<b>{p['title']}</b> ({p.get('year', '')})\n"
        f"{p['description']}\n"
        f"{tools_line}{link_line}"
    )


async def cmd_start(message: Message):
    data = load_data()
    author = data["author"]
    text = (
        f"👋 Привет! Я бот-резюме <b>{author['name']}</b>\n\n"
        f"🏷 {author['role']}\n"
        f"✨ {author['tagline']}\n\n"
        f"Команды:\n"
        f"/projects — список проектов\n"
        f"/about — обо мне\n"
        f"/project <номер> — проект по номеру (1–{len(data['projects'])})"
    )
    await message.answer(text, parse_mode="HTML")


async def cmd_about(message: Message):
    data = load_data()
    author = data["author"]
    text = (
        f"<b>{author['name']}</b>\n"
        f"{author['role']}\n\n"
        f"{author['tagline']}\n\n"
        f"📱 Telegram: {author.get('telegram', '—')}\n"
        f"📧 Email: {author.get('email', '—')}\n"
        f"💻 GitHub: {author.get('github', '—')}"
    )
    await message.answer(text, parse_mode="HTML")


async def cmd_projects(message: Message):
    data = load_data()
    projects = data["projects"]
    lines = []
    for i, p in enumerate(projects, 1):
        lines.append(f"{i}. {p['title']} ({p.get('year', '')})")
    text = "📁 <b>Проекты:</b>\n\n" + "\n".join(lines)
    text += f"\n\nИспользуй /project N для подробностей (1–{len(projects)})"
    await message.answer(text, parse_mode="HTML")


async def cmd_project(message: Message):
    data = load_data()
    projects = data["projects"]
    try:
        num = int(message.text.split()[1])
        if 1 <= num <= len(projects):
            p = projects[num - 1]
            await message.answer(format_project(p), parse_mode="HTML")
        else:
            await message.answer(
                f"Укажи номер от 1 до {len(projects)}",
                parse_mode="HTML"
            )
    except (IndexError, ValueError):
        await message.answer(
            f"Использование: /project <1–{len(projects)}>",
            parse_mode="HTML"
        )


async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()

    dp.message.register(cmd_start, Command("start"))
    dp.message.register(cmd_about, Command("about"))
    dp.message.register(cmd_projects, Command("projects"))
    dp.message.register(cmd_project, Command("project"))

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

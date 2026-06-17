# Portfolio — Сайт-резюме + Telegram-бот

Проект-портфолио: минималистичный сайт и Telegram-бот, использующие общую базу проектов `projects.json`.

## Структура проекта

```
PORTFOLIO/
├── app.py              # Flask-сервер (сайт)
├── .env                # Переменные окружения (не в git)
├── .env.example        # Шаблон для .env
├── projects.json       # Единая база проектов
├── requirements.txt
├── README.md
├── static/
│   ├── css/style.css
│   └── js/main.js
├── templates/
│   └── index.html
└── bot/
    ├── __init__.py
    └── main.py         # Telegram-бот (aiogram 3)
```

## Запуск

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Запуск сайта (Flask)

```bash
python app.py
```

Сайт будет доступен по адресу: http://127.0.0.1:5000

### 3. Запуск Telegram-бота

1. Создайте бота через [@BotFather](https://t.me/BotFather) и получите токен.

2. Скопируйте `.env.example` в `.env` и укажите токен:
   ```bash
   copy .env.example .env   # Windows
   # или: cp .env.example .env   # Linux/macOS
   # Отредактируйте .env: TELEGRAM_BOT_TOKEN=your_token
   ```

3. Запустите бота:

```bash
python -m bot.main
```

## Редактирование данных

Все проекты и информация об авторе хранятся в `projects.json`:

```json
{
  "author": {
    "name": "Имя",
    "role": "Должность",
    "tagline": "Слоган",
    "telegram": "@username",
    "email": "email@example.com",
    "github": "github.com/username"
  },
  "skills": [
    {
      "category": "Backend",
      "items": ["Python", "FastAPI", "Django"]
    },
    {
      "category": "Frontend",
      "items": ["HTML/CSS", "JavaScript", "React"]
    }
  ],
  "projects": [
    {
      "id": 1,
      "title": "Название",
      "description": "Описание проекта",
      "tools": ["React", "Python", "PostgreSQL"],
      "year": "2024",
      "link": "https://..."
    }
  ]
}
```

## API

- `GET /` — главная страница
- `GET /api/projects` — JSON с проектами (для внешних клиентов или бота)

## Технологии

- **Сайт:** Flask, HTML, CSS, JS (без фреймворков)
- **Бот:** Python, aiogram 3
- **Стиль:** Apple-like (Inter/SF Pro, минимализм, анимации, полупрозрачные карточки)

## Лицензия

MIT

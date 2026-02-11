# Руководство по настройке Reshala Blacklist CMS

## Архитектура системы

Система состоит из трех ключевых компонентов:

1. **Supabase (База данных)** - хранит жалобы, голоса, действия модераторов
2. **GitHub (Хранилище данных)** - хранит одобренные профили, доказательства и reshala-blacklist.txt
3. **React SPA (Frontend)** - интерфейс для пользователей

## Процесс работы

### 1. Подача жалобы
- Пользователь входит через GitHub
- Создает жалобу с Telegram ID, username, причиной и доказательствами (скриншоты)
- Доказательства загружаются в GitHub: `data/temp_proofs/{report_id}/`
- Жалоба сохраняется в Supabase со статусом **"voting"**
- Доступна для голосования 1 час

### 2. Голосование
- Все зарегистрированные пользователи могут голосовать
- Один пользователь = один голос за жалобу
- При достижении **30 голосов** за час, статус меняется на **"pending_review"**
- Жалоба автоматически попадает к модераторам

### 3. Модерация
- Модераторы/Админы видят жалобы со статусом "pending_review"
- Могут одобрить или отклонить с комментарием

**При одобрении:**
- Создается папка `data/blacklist/{telegram_id}/`
- Копируются доказательства из temp_proofs
- Создается `profile.json` с данными
- Обновляется файл `reshala-blacklist.txt` в корне репозитория
- Статус меняется на **"approved"**

**При отклонении:**
- Модератор указывает причину (недостаточно доказательств и т.д.)
- Пользователь видит комментарий и может доработать жалобу
- Статус меняется на **"rejected"**

### 4. Файл reshala-blacklist.txt

Формат:
```
{telegram_id} #{причина} {ссылка_на_github}
```

Пример:
```
6923193113 #Сканировал адреса https://github.com/DonMatteoVPN/Reshla-BLACKLIST/tree/main/data/blacklist/6923193113
6176645254 #Скан сетей https://github.com/DonMatteoVPN/Reshla-BLACKLIST/tree/main/data/blacklist/6176645254
```

## Установка и настройка

### 1. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Миграция БД уже применена автоматически через MCP
3. Скопируйте из Settings → API:
   - Project URL
   - Anon (public) key

### 2. Настройка GitHub

1. Создайте репозиторий `Reshla-BLACKLIST`
2. Создайте файл `config/roles.json`:
```json
{
  "admins": ["ваш_github_username"],
  "moderators": []
}
```

3. Получите Personal Access Token:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Права: `repo` (полный доступ)

### 3. Настройка проекта

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Заполните `.env`:
```env
VITE_GITHUB_OWNER=ваш_username
VITE_GITHUB_REPO=Reshla-BLACKLIST

VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

3. Установите зависимости:
```bash
npm install
```

4. Запустите проект:
```bash
npm run dev
```

### 4. Деплой на GitHub Pages

1. Откройте `.github/workflows/deploy.yml` (уже создан)

2. Включите GitHub Pages:
   - Settings → Pages
   - Source: **GitHub Actions**

3. Создайте в репозитории **Secrets** для env переменных:
   - Settings → Secrets and variables → Actions → New repository secret
   - Добавьте:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. Обновите `vite.config.ts` если нужно изменить base path

5. Задеплойте:
```bash
git add .
git commit -m "feat: full voting system"
git push origin main
```

Приложение будет доступно по адресу:
`https://{username}.github.io/Reshla-BLACKLIST/`

## Роли пользователей

### Guest (Гость)
- Просмотр всех жалоб
- Голосование за жалобы
- Создание новых жалоб

### Moderator (Модератор)
- Всё что может гость
- Одобрение/отклонение жалоб на модерации
- Добавление комментариев

### Admin (Администратор)
- Всё что может модератор
- Управление ролями (добавление/удаление модераторов)

## Безопасность

1. **Row Level Security (RLS)** включен на всех таблицах Supabase
2. **Один голос** на пользователя благодаря UNIQUE constraint
3. **Аутентификация через GitHub** - только зарегистрированные пользователи
4. **Модерация** - профили попадают в GitHub только после одобрения

## Структура базы данных

### Таблица `reports`
- id, telegram_id, username, reason
- status (voting, pending_review, approved, rejected)
- vote_count, voting_deadline
- submitted_by, github_folder_path

### Таблица `votes`
- id, report_id, user_id
- UNIQUE(report_id, user_id)

### Таблица `report_proofs`
- id, report_id, file_name, file_url

### Таблица `moderator_actions`
- id, report_id, moderator_id
- action (approve/reject), comment

## Триггеры и автоматика

1. **Auto-update vote_count** - при добавлении голоса обновляется счетчик
2. **Auto-promote to pending_review** - при 30+ голосах статус меняется автоматически\n3. **Auto-update updated_at** - timestamp обновляется при изменениях

## Troubleshooting

### Ошибка "Supabase credentials not found"
- Проверьте `.env` файл
- Убедитесь что переменные начинаются с `VITE_`

### Голоса не учитываются
- Проверьте RLS policies в Supabase
- Убедитесь что пользователь аутентифицирован

### Доказательства не загружаются
- Проверьте права GitHub токена
- Убедитесь что путь `data/temp_proofs/` доступен

### reshala-blacklist.txt не обновляется
- Проверьте функцию `updateBlacklistFile` в DataManager
- Убедитесь что путь корректный

## Поддержка

Для вопросов и предложений создайте Issue в репозитории проекта.

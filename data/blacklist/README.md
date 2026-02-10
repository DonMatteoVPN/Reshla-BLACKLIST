# Папка для профилей пользователей в чёрном списке

Структура:
```
/data/blacklist/{telegram_id}/
  ├── profile.json
  └── proofs/
      ├── image1.jpg
      ├── image2.png
      └── ...
```

## Пример profile.json:

```json
{
  "telegram_id": "123456789",
  "username": "example_user",
  "reason": "Причина добавления в чёрный список",
  "date": "2026-02-10T14:00:00.000Z",
  "voting_count": 0,
  "status": "active",
  "added_by": "DonMatteoVPN",
  "proof_files": ["image1.jpg", "image2.png"]
}
```

# Reshla Blacklist CMS

**Community Blacklist CMS** — a Telegram user blacklist management system using GitHub as a database.

## 🎯 Features

- ✅ **No backend** — the entire GitHub repository is used as a database
- ✅ **Role-based access** — administrators, moderators, and guests
- ✅ **GitHub authentication** — Personal Access Token
- ✅ **Localization** — Russian and English
- ✅ **Modern UI** — React + Vite + TypeScript + TailwindCSS
- ✅ **Dark theme** — by default

## 📦 Technologies

- **Frontend:** React 18 + TypeScript
- **Build:** Vite
- **Styles:** TailwindCSS
- **API:** GitHub REST API (Octokit)
- **Routing:** React Router
- **Localization:** i18next

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and set your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_GITHUB_OWNER=your_github_username
VITE_GITHUB_REPO=Reshla-BLACKLIST
```

Also update values in `src/context/AuthContext.tsx`:

```typescript
const GITHUB_OWNER = 'your_github_username'
const GITHUB_REPO = 'Reshla-BLACKLIST'
```

### 3. Repository structure

Create the following structure in your GitHub repository:

```
/config/roles.json          # Roles configuration
/data/blacklist/{id}/       # User profile folders
  ├── profile.json          # Profile data
  └── proofs/               # Evidence (images)
```

Example `config/roles.json`:

```json
{
  "admins": ["your_github_username"],
  "moderators": []
}
```

Example `data/blacklist/123456789/profile.json`:

```json
{
  "telegram_id": "123456789",
  "username": "example_user",
  "reason": "Reason for blacklisting",
  "date": "2026-02-10T13:00:00.000Z",
  "voting_count": 0,
  "status": "active",
  "added_by": "admin_username",
  "proof_files": []
}
```

### 4. Get GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Create a new token (Classic)
3. Select permissions:
   - `repo` (full repository access)
4. Copy the token

### 5. Run the application

```bash
npm run dev
```

The application will be available at: `http://localhost:5173`

## 🔐 Authentication

On first launch, click "Login" and enter your GitHub Personal Access Token.

## 👥 Roles

- **Administrator** — full access (role management, approve/reject bans)
- **Moderator** — approve/reject pending bans
- **Guest** — view active bans

## 📝 Main Features

### For all users:
- View blacklist
- Filter by status (active / pending)
- Search by Telegram ID
- Submit user reports

### For moderators:
- Approve reports (change status to "active")
- Reject reports (delete profile)

### For administrators:
- Manage roles (add/remove moderators)
- All moderator rights

## 🌐 Localization

Language switching is available in the header (RU/EN button).

## 🚀 Deploy to GitHub Pages

### 1. Repository Setup

1. Create a GitHub repository: `Reshla-BLACKLIST`
2. Upload code:

```bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/DonMatteoVPN/Reshla-BLACKLIST.git
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. In **Source** section, select **GitHub Actions**
3. Save

### 3. Automatic Deployment

After pushing to `main`, GitHub Actions will automatically:
- Install dependencies
- Build the project (`npm run build`)
- Deploy to GitHub Pages

The application will be available at:
**https://donmatteovpn.github.io/Reshla-BLACKLIST/**

### 4. Updating the Application

Any changes to the `main` branch are automatically deployed to GitHub Pages.

```bash
git add .
git commit -m "feat: update something"
git push
```

---

## 🛠️ Development

### Project structure

```
src/
├── components/         # React components
│   ├── admin/         # Admin panel
│   ├── auth/          # Authentication
│   ├── common/        # Common components
│   ├── dashboard/     # Dashboard
│   └── modals/        # Modal windows
├── context/           # React Context
├── hooks/             # Custom hooks
├── i18n/              # Localization
├── services/          # API services
└── types/             # TypeScript types
```

### Available commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code
```

## 📄 License

MIT

## 👨‍💻 Author

DonMatteo (Antigravity AI)

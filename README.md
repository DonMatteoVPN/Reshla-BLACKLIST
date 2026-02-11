# Reshla Blacklist: Decentralized Justice System

![Reshla Banner](https://img.shields.io/badge/Reshla-Blacklist-critical?style=for-the-badge&logo=shield&logoColor=white) 
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

**Reshla Blacklist** is a fully decentralized, community-driven blacklist management system. It leverages **GitHub Issues** as a database and **GitHub Actions** for automated governance, eliminating the need for a traditional backend.

## 📚 Documentation
- **[Full Walkthrough & Architecture](./walkthrough.md)** - Detailed guide on how the system works.
- **[Task List](./task.md)** - Development progress.

## 🌟 Key Features
- **Voting Hub**: Community votes on reports using GitHub Reactions.
- **Moderation Dashboard**: Moderators review reports that pass the voting threshold.
- **Automated Justice**: 
  - `auto-judge`: Promotes reports with >30 votes to moderation.
  - **Manual Review**: Reports with insufficient votes remain in the queue for moderator attention (no auto-rejection).
  - `enforce-ban`: Automatically commits ban data to the repo upon approval.
- **Transparency**: Every action is a commit, issue, or comment.

## 🚀 Quick Start

### 1. Setup
```bash
# Clone the repo
git clone https://github.com/DonMatteoVPN/Reshla-BLACKLIST.git
cd Reshla-BLACKLIST

# Install dependencies
npm install

# Configure Environment (.env)
cp .env.example .env
# Edit .env with your VITE_GITHUB_OWNER, VITE_GITHUB_REPO, and GITHUB_TOKEN
```

### 2. Run Locally
```bash
npm run dev
```
Visit `http://localhost:5173`.

### 3. Automation Scripts (Dry Run)
```bash
# Check for reports that passed voting
npm run check-votes

# Generate blacklist entry (requires ISSUE_NUMBER env var)
ISSUE_NUMBER=123 npm run generate-entry
```

## 🛠 Deployment
The project takes advantage of **GitHub Pages** for hosting.
1. Push to `main`.
2. The `.github/workflows/deploy.yml` workflow will automatically build and deploy to the `gh-pages` branch.
3. Enable GitHub Pages in repo settings: **Source** -> **Deploy from a branch** -> **gh-pages**.

## 🏗 Architecture
See [walkthrough.md](./walkthrough.md) for the full architectural diagram.

## 🤝 Contributing
1. Fork the repo.
2. Create a feature branch.
3. Submit a Pull Request.

## 📄 License
MIT

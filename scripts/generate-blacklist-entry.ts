import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const REPO = process.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'
const ISSUE_NUMBER = process.env.ISSUE_NUMBER

if (!ISSUE_NUMBER) {
    console.error('ISSUE_NUMBER is required')
    process.exit(1)
}

const octokit = new Octokit({ auth: GITHUB_TOKEN })

async function generateEntry() {
    console.log(`Generating blacklist entry for Issue #${ISSUE_NUMBER}...`)

    try {
        const { data: issue } = await octokit.rest.issues.get({
            owner: OWNER,
            repo: REPO,
            issue_number: parseInt(ISSUE_NUMBER!)
        })

        if (!issue.body) throw new Error('Issue body is empty')

        // Parse Body
        const telegramIdMatch = issue.body.match(/Telegram ID:\s*`?(\d+)`?/)
        const usernameMatch = issue.body.match(/Username:\s*@?([a-zA-Z0-9_]+)/)
        const reasonMatch = issue.body.match(/### Reason\s*\n\s*(.+)/)

        if (!telegramIdMatch) throw new Error('Could not parse Telegram ID')

        const telegramId = telegramIdMatch[1]
        const username = usernameMatch ? usernameMatch[1] : 'Unknown'
        const reason = reasonMatch ? reasonMatch[1] : 'Violation'

        console.log(`Parsed: ID=${telegramId}, User=${username}, Reason=${reason}`)

        // Create Directory and Profile JSON
        const dirPath = path.join('data', 'blacklist', telegramId)
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }

        const profile = {
            telegram_id: telegramId,
            username: username,
            reason: reason,
            date: new Date().toISOString(),
            voting_count: issue.reactions?.['+1'] || 0,
            status: 'active',
            issue_number: issue.number
        }

        fs.writeFileSync(path.join(dirPath, 'profile.json'), JSON.stringify(profile, null, 2))
        console.log(`Created profile.json for ${telegramId}`)

        // Update Blacklist TXT
        const txtPath = 'reshala-blacklist.txt'
        const githubUrl = `https://github.com/${OWNER}/${REPO}/tree/main/data/blacklist/${telegramId}`
        const txtEntry = `${telegramId} #${reason} (${githubUrl})\n`

        fs.appendFileSync(txtPath, txtEntry)
        console.log(`Updated reshala-blacklist.txt`)

        // Git operations are handled by the workflow
        console.log('Files generated. Workflow will handle commit and push.')

        // Close Issue if not closed
        if (issue.state === 'open') {
            await octokit.rest.issues.update({
                owner: OWNER,
                repo: REPO,
                issue_number: parseInt(ISSUE_NUMBER!),
                state: 'closed',
                state_reason: 'completed'
            })
            console.log('Issue closed.')
        }

    } catch (error) {
        console.error('Error generating entry:', error)
        process.exit(1)
    }
}

generateEntry()

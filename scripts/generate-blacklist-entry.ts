import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const REPO = process.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'
const ISSUE_NUMBER = process.env.ISSUE_NUMBER

if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is missing')
    process.exit(1)
}

if (!ISSUE_NUMBER) {
    console.error('ISSUE_NUMBER is missing')
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

        const body = issue.body || ''

        // Parse Body
        const telegramIdMatch = body.match(/\*\*Telegram ID:\*\*\s*(.+)/)
        const usernameMatch = body.match(/\*\*Username:\*\*\s*@?(.+)/)
        const reasonMatch = body.match(/\*\*Reason:\*\*\s*(.+)/)

        if (!telegramIdMatch || !usernameMatch) {
            console.error('Failed to parse issue body')
            process.exit(1)
        }

        const telegramId = telegramIdMatch[1].trim()
        const username = usernameMatch[1].trim()
        const reason = reasonMatch ? reasonMatch[1].trim() : 'No reason provided'

        // Create Directory
        const dir = path.join('data', 'blacklist', telegramId)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        // Create Profile JSON
        const profile = {
            id: telegramId,
            username: username,
            reason: reason,
            banned_at: new Date().toISOString(),
            issue_url: issue.html_url,
            proofs: [] as string[]
        }

        // Download Proofs (Mock for now, just storing URLs)
        const proofMatches = body.matchAll(/\!\[\]\((.+?)\)/g)
        for (const match of proofMatches) {
            profile.proofs.push(match[1])
        }

        fs.writeFileSync(path.join(dir, 'profile.json'), JSON.stringify(profile, null, 2))
        console.log(`Created profile for ${telegramId}`)

        // Update Blacklist TXT
        const txtPath = 'reshala-blacklist.txt'
        const entry = `${telegramId} #${reason} (https://github.com/${OWNER}/${REPO}/tree/main/data/blacklist/${telegramId})`

        if (fs.existsSync(txtPath)) {
            fs.appendFileSync(txtPath, `\n${entry}`)
        } else {
            fs.writeFileSync(txtPath, entry)
        }
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
                labels: ['status:approved', 'banned']
            })
        }

    } catch (error) {
        console.error('Error generating entry:', error)
        process.exit(1)
    }
}

generateEntry()

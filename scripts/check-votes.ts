import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const REPO = process.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'

if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is missing')
    process.exit(1)
}

const octokit = new Octokit({ auth: GITHUB_TOKEN })

async function checkVotes() {
    console.log(`Checking votes for ${OWNER}/${REPO}...`)

    try {
        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: OWNER,
            repo: REPO,
            labels: 'status:voting',
            state: 'open'
        })

        console.log(`Found ${issues.length} issues in voting stage.`)

        for (const issue of issues) {
            const votes = issue.reactions?.['+1'] || 0
            const createdAt = new Date(issue.created_at)
            const now = new Date()
            const diffMs = now.getTime() - createdAt.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

            console.log(`Issue #${issue.number}: ${votes} votes, ${diffHours.toFixed(2)} hours old.`)

            if (votes > 30) {
                console.log(`Issue #${issue.number} passed voting. Moving to moderation.`)
                await octokit.rest.issues.addLabels({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    labels: ['status:moderation']
                })
                await octokit.rest.issues.removeLabel({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    name: 'status:voting'
                })
                await octokit.rest.issues.createComment({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    body: '✅ **Vote threshold reached.** This report has been moved to the moderation queue.'
                })
            } else if (diffHours >= 1) {
                console.log(`Issue #${issue.number} expired. Rejecting.`)
                await octokit.rest.issues.addLabels({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    labels: ['status:rejected']
                })
                await octokit.rest.issues.removeLabel({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    name: 'status:voting'
                })
                await octokit.rest.issues.update({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    state: 'closed'
                })
                await octokit.rest.issues.createComment({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    body: '❌ **Voting time expired.** This report did not reach the required vote count and has been rejected.'
                })
            }
        }
    } catch (error) {
        console.error('Error checking votes:', error)
        process.exit(1)
    }
}

checkVotes()

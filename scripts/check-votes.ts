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
            } else if (diffHours >= 24) {
                // Expired but minimal votes not reached. 
                // Creating a comment but NOT closing/rejecting.
                // Just let it hang or move to moderation with a warning?
                // User requirement: "simply hangs in queue... can only be approved/rejected by mod/admin"
                console.log(`Issue #${issue.number} expired (${diffHours.toFixed(2)}h). Leaving for moderator review.`);
                // Optional: Tag as 'stale' or leave as is?
                // For now, do nothing.
            }
        }
    } catch (error) {
        console.error('Error checking votes:', error)
        process.exit(1)
    }
}

checkVotes()

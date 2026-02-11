import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const REPO = process.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'
const IS_MOCK = process.env.MOCK_MODE === 'true'

if (!GITHUB_TOKEN && !IS_MOCK) {
    console.error('GITHUB_TOKEN is missing')
    process.exit(1)
}

// Mock Data for Testing
const MOCK_ISSUES = [
    {
        number: 1,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins old
        reactions: { '+1': 35 }, // Should PASS (>30 votes)
        title: 'High Vote Report'
    },
    {
        number: 2,
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours old
        reactions: { '+1': 10 }, // Should EXPIRE (>24h)
        title: 'Expired Report'
    },
    {
        number: 3,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours old
        reactions: { '+1': 5 }, // Should STAY (Pending)
        title: 'Pending Report'
    }
]

class MockOctokit {
    rest = {
        issues: {
            listForRepo: async () => ({ data: MOCK_ISSUES }),
            addLabels: async (args: any) => console.log(`[MOCK] Added labels to #${args.issue_number}:`, args.labels),
            removeLabel: async (args: any) => console.log(`[MOCK] Removed label from #${args.issue_number}:`, args.name),
            createComment: async (args: any) => console.log(`[MOCK] Commented on #${args.issue_number}:`, args.body)
        }
    }
}

const octokit = IS_MOCK ? new MockOctokit() : new Octokit({ auth: GITHUB_TOKEN })

async function checkVotes() {
    console.log(`Checking votes for ${OWNER}/${REPO}... ${IS_MOCK ? '(MOCK MODE)' : ''}`)

    try {
        // @ts-ignore - types mismatch between mock and real octokit but compliant for our usage
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
                // Move to moderation queue as low priority for manual review.
                console.log(`Issue #${issue.number} expired (${diffHours.toFixed(2)}h). Moving to moderation (low priority).`);

                await octokit.rest.issues.addLabels({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    labels: ['status:moderation', 'priority:low']
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
                    body: '⚠️ **Voting period ended.** Report did not reach the automated threshold (30 votes). Moved to moderation queue for manual review.'
                })
            }
        }
    } catch (error) {
        console.error('Error checking votes:', error)
        process.exit(1)
    }
}

checkVotes()

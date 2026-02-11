import { Octokit } from '@octokit/rest'
import dotenv from 'dotenv'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.VITE_GITHUB_OWNER || 'DonMatteoVPN'
const REPO = process.env.VITE_GITHUB_REPO || 'Reshla-BLACKLIST'
const IS_MOCK = process.env.MOCK_MODE === 'true'

// Mock Octokit for testing
class MockOctokit {
    rest = {
        issues: {
            listForRepo: async () => ({
                data: [
                    {
                        number: 1,
                        title: 'Mock Report 1',
                        created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), // 25 hours old
                        reactions: { '+1': 5 }
                    },
                    {
                        number: 2,
                        title: 'Mock Report 2',
                        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours old
                        reactions: { '+1': 35 } // High votes
                    }
                ]
            }),
            addLabels: async (params: any) => console.log(`[MOCK] Added labels to #${params.issue_number}: ${params.labels}`),
            createComment: async (params: any) => console.log(`[MOCK] Commented on #${params.issue_number}: ${params.body}`)
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
                await octokit.rest.issues.createComment({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    body: `🗳️ **Голосование завершено!**\n\nНабрано ${votes} голосов "За". Дело передано на рассмотрение модераторам.`
                })
            } else if (diffHours >= 24) {
                console.log(`Issue #${issue.number} expired (${diffHours.toFixed(2)}h). Moving to moderation (low priority).`);
                await octokit.rest.issues.addLabels({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    labels: ['status:moderation', 'priority:low']
                })
                await octokit.rest.issues.createComment({
                    owner: OWNER,
                    repo: REPO,
                    issue_number: issue.number,
                    body: `⏰ **Время голосования истекло.**\n\nНе набрано достаточно голосов для автоматического прохождения. Дело передано модераторам с низким приоритетом.`
                })
            }
        }
    } catch (error) {
        console.error('Error checking votes:', error)
        process.exit(1)
    }
}

checkVotes()

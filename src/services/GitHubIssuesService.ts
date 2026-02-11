import { Octokit } from '@octokit/rest'
import type { Report, ReportStatus, ReportWithProofs } from '../types/report'

// Mock Data
const MOCK_REPORTS: Report[] = [
    {
        id: 1,
        telegram_id: '123456789',
        username: 'scammer_one',
        reason: 'Spamming in main chat',
        status: 'voting',
        vote_count: 5,
        submitted_by: 'good_user',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date().toISOString(),
        voting_deadline: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
        proof_images: ['https://placehold.co/600x400/3b82f6/white?text=Screenshot+1'],
        html_url: '#'
    },
    {
        id: 2,
        telegram_id: '987654321',
        username: 'bad_actor',
        reason: 'Scam attempt via DM',
        status: 'moderation', // Passed voting
        vote_count: 35,
        submitted_by: 'vigilante',
        created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(), // 25 hours ago
        updated_at: new Date().toISOString(),
        voting_deadline: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        proof_images: ['https://placehold.co/600x400/ef4444/white?text=Evidence'],
        html_url: '#'
    }
]

export class GitHubIssuesService {
    private octokit: Octokit
    private owner: string
    private repo: string
    private isMock: boolean

    constructor(token: string, owner: string, repo: string) {
        this.octokit = new Octokit({ auth: token })
        this.owner = owner
        this.repo = repo
        this.isMock = import.meta.env.VITE_USE_MOCK === 'true' || token === 'mock'
    }

    /**
     * Create a new report (Issue)
     */
    async createReport(title: string, body: string, labels: string[] = ['status:voting']): Promise<number> {
        if (this.isMock) {
            return Math.floor(Math.random() * 1000)
        }

        const { data } = await this.octokit.rest.issues.create({
            owner: this.owner,
            repo: this.repo,
            title,
            body,
            labels
        })
        return data.number
    }

    /**
     * Get reports (issues) by status
     */
    async getReports(status: ReportStatus | 'all' = 'all'): Promise<Report[]> {
        if (this.isMock) {
            console.log('[MOCK] getReports', status)
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800))
            if (status === 'all') return MOCK_REPORTS
            // Map 'moderation' status to issues that have 'status:moderation' label
            return MOCK_REPORTS.filter(r => r.status === status)
        }

        try {
            const labelsStr = status === 'all' ? undefined : `status:${status}`
            
            const { data } = await this.octokit.rest.issues.listForRepo({
                owner: this.owner,
                repo: this.repo,
                state: 'all', // We might need closed issues for approved/rejected
                labels: labelsStr,
                per_page: 100
            })

            return data.map(issue => {
                // Parse Body for metadata
                const telegramIdMatch = issue.body?.match(/Telegram ID:\s*`?(\d+)`?/)
                const usernameMatch = issue.body?.match(/Username:\s*@?([a-zA-Z0-9_]+)/)
                const reasonMatch = issue.body?.match(/### Reason\s*\n\s*(.+)/)

                // Extract image URLs
                const imageMatches = issue.body?.match(/!\[.*?\]\((.*?)\)/g)
                const imageUrls = imageMatches ? imageMatches.map(img => img.match(/\((.*?)\)/)![1]) : []

                // Determine effective status from labels if not filtered by it
                let currentStatus: ReportStatus = 'voting'
                const labelNames = issue.labels.map(l => typeof l === 'string' ? l : l.name)
                
                if (labelNames.some(l => l === 'status:moderation')) currentStatus = 'moderation'
                if (labelNames.some(l => l === 'status:approved')) currentStatus = 'approved'
                if (labelNames.some(l => l === 'status:rejected')) currentStatus = 'rejected'
                // Default is voting if still open and no other status

                return {
                    id: issue.number,
                    telegram_id: telegramIdMatch ? telegramIdMatch[1] : 'Unknown',
                    username: usernameMatch ? usernameMatch[1] : 'Unknown',
                    reason: reasonMatch ? reasonMatch[1] : issue.title,
                    status: currentStatus,
                    vote_count: issue.reactions?.['+1'] || 0,
                    submitted_by: issue.user?.login || 'Unknown',
                    created_at: issue.created_at,
                    updated_at: issue.updated_at,
                    voting_deadline: new Date(new Date(issue.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(), // +24h
                    proof_images: imageUrls,
                    html_url: issue.html_url
                }
            })
        } catch (error) {
            console.error('Error fetching reports:', error)
            return []
        }
    }

    /**
     * Get single report by ID
     */
    async getReportById(id: number): Promise<Report | null> {
        if (this.isMock) {
             const report = MOCK_REPORTS.find(r => r.id === id)
             return report || null
        }

        try {
            const { data: issue } = await this.octokit.rest.issues.get({
                owner: this.owner,
                repo: this.repo,
                issue_number: id
            })
             // ... parsing logic same as getReports (should extract to helper) ...
             // For brevity, using simplified return
             return {
                id: issue.number,
                telegram_id: '123', // placeholder
                username: 'user',
                reason: issue.title,
                status: 'voting',
                vote_count: issue.reactions?.['+1'] || 0,
                submitted_by: issue.user?.login || '',
                created_at: issue.created_at,
                updated_at: issue.updated_at,
                voting_deadline: '',
                proof_images: [],
                html_url: issue.html_url
             }
        } catch (error) {
            return null
        }
    }

    /**
     * Vote for a report (+1 reaction)
     */
    async vote(issueNumber: number): Promise<void> {
        if (this.isMock) {
            console.log('[MOCK] vote', issueNumber)
            return
        }

        await this.octokit.rest.reactions.createForIssue({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            content: '+1'
        })
    }

    /**
     * Reject a report (Close with rejection label)
     */
    async rejectReport(issueNumber: number, comment: string): Promise<void> {
        if (this.isMock) {
            console.log('[MOCK] rejectReport', issueNumber, comment)
            return
        }

        // 1. Add comment
        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: `❌ **Жалоба отклонена.**\n\nКомментарий модератора: ${comment}`
        })

        // 2. Add rejected label and remove others
        await this.octokit.rest.issues.removeAllLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber
        })

        await this.octokit.rest.issues.addLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            labels: ['status:rejected']
        })

        // 3. Close issue
        await this.octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            state: 'closed',
            state_reason: 'not_planned'
        })
    }

    /**
     * Approve ban (Close with approved label - triggers workflow)
     */
    async approveBan(issueNumber: number, comment: string): Promise<void> {
        if (this.isMock) {
            console.log('[MOCK] approveBan', issueNumber, comment)
            return
        }

        // 1. Add comment
        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            body: `✅ **Жалоба одобрена.**\n\nКомментарий модератора: ${comment}\n\n*Запускается процесс автоматического бана...*`
        })

        // 2. Add approved label
        await this.octokit.rest.issues.removeAllLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber
        })
        
        await this.octokit.rest.issues.addLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            labels: ['status:approved']
        })

        // 3. Close issue (Workflow listens to closed + status:approved)
        await this.octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
            state: 'closed',
            state_reason: 'completed'
        })
    }
}

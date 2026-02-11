import { Octokit } from '@octokit/rest'
import type { Report, ReportStatus, ReportWithProofs } from '../types/report'

export class GitHubIssuesService {
    private octokit: Octokit
    private owner: string
    private repo: string

    constructor(token: string | null, owner: string, repo: string) {
        this.octokit = new Octokit({ auth: token })
        this.owner = owner
        this.repo = repo
    }

    async getReports(status: ReportStatus | 'all' = 'all'): Promise<Report[]> {
        let labels = ''
        if (status !== 'all') {
            labels = `status:${status}`
        }

        const { data: issues } = await this.octokit.rest.issues.listForRepo({
            owner: this.owner,
            repo: this.repo,
            labels,
            state: 'all', // Need closed issues for approved/rejected
            per_page: 100
        })

        return issues.map(this.mapIssueToReport)
    }

    async getReportDetails(reportId: number): Promise<ReportWithProofs> {
        const { data: issue } = await this.octokit.rest.issues.get({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId
        })

        const { data: comments } = await this.octokit.rest.issues.listComments({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId
        })

        const report = this.mapIssueToReport(issue)
        const proofs = this.extractProofs(issue.body || '')

        return {
            ...report,
            proofs,
            comments: comments.map(c => ({
                id: c.id,
                user: {
                    login: c.user?.login || 'Unknown',
                    avatar_url: c.user?.avatar_url || ''
                },
                body: c.body || '',
                created_at: c.created_at
            }))
        }
    }

    async createReport(report: Omit<Report, 'id' | 'status' | 'created_at' | 'vote_count' | 'voting_deadline'> & { proofs?: string[] }): Promise<void> {
        const body = `
**Telegram ID:** ${report.telegram_id}
**Username:** @${report.username}
**Reason:** ${report.reason}

**Proofs:**
${report.proofs?.map(p => `![](${p})`).join('\n') || 'No proofs provided'}

---
*Created via Reshla Blacklist Interface*
        ` // IMPORTANT: Removed title block because title is separate argument

        await this.octokit.rest.issues.create({
            owner: this.owner,
            repo: this.repo,
            title: `Report: User ${report.telegram_id}`,
            body,
            labels: ['status:voting']
        })
    }

    async vote(reportId: number): Promise<void> {
        await this.octokit.rest.reactions.createForIssue({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            content: '+1'
        })
    }

    async approveReport(reportId: number): Promise<void> {
        await this.octokit.rest.issues.addLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            labels: ['status:approved']
        })
        
        await this.octokit.rest.issues.removeLabel({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            name: 'status:moderation'
        })

        // Workflow 'enforce-ban.yml' will handle the rest (adding to blacklist.txt and closing)
    }

    async rejectReport(reportId: number, reason: string): Promise<void> {
        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            body: `❌ **Report Rejected**\n\nReason: ${reason}`
        })

        await this.octokit.rest.issues.addLabels({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            labels: ['status:rejected']
        })

        await this.octokit.rest.issues.removeLabel({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            name: 'status:moderation' // Or voting if rejecting early
        })

        await this.octokit.rest.issues.update({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            state: 'closed'
        })
    }

    async addComment(reportId: number, body: string): Promise<void> {
        await this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: reportId,
            body
        })
    }

    private mapIssueToReport(issue: any): Report {
        const body = issue.body || ''
        const telegramIdMatch = body.match(/Telegram ID:\*\*\s*(.+)/)
        const usernameMatch = body.match(/Username:\*\*\s*@?(.+)/)
        const reasonMatch = body.match(/Reason:\*\*\s*(.+)/) // Naive matching, improved regex needed for multiline or robust parsing

        let status: ReportStatus = 'voting'
        const labels = issue.labels.map((l: any) => l.name)
        if (labels.includes('status:approved')) status = 'approved'
        else if (labels.includes('status:rejected')) status = 'rejected'
        else if (labels.includes('status:moderation')) status = 'moderation'

        // Voting Deadline Calculation (Mock: generic 24h from creation)
        const createdAt = new Date(issue.created_at)
        const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)

        // Vote Count
        const votes = issue.reactions?.['+1'] || 0

        return {
            id: issue.number,
            telegram_id: telegramIdMatch ? telegramIdMatch[1].trim() : 'Unknown',
            username: usernameMatch ? usernameMatch[1].trim() : 'Unknown',
            reason: reasonMatch ? reasonMatch[1].split('**Proofs')[0].trim() : (issue.body || 'No reason'), // Quick fix to stop at Proofs header
            status,
            created_at: issue.created_at,
            vote_count: votes,
            voting_deadline: deadline.toISOString()
        }
    }

    private extractProofs(body: string): string[] {
        const matches = body.matchAll(/\!\[\]\((.+?)\)/g)
        return Array.from(matches, m => m[1])
    }
}

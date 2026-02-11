import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Report, ReportWithProofs } from '../types/report'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export class SupabaseService {
    private supabase: SupabaseClient

    constructor() {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase credentials not found in environment variables')
        }
        this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    }

    async createReport(
        telegramId: string,
        username: string,
        reason: string,
        submittedBy: string
    ): Promise<Report | null> {
        const { data, error } = await this.supabase
            .from('reports')
            .insert({
                telegram_id: telegramId,
                username: username,
                reason: reason,
                submitted_by: submittedBy,
                status: 'voting',
                vote_count: 0
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating report:', error)
            return null
        }

        return data as Report
    }

    async uploadProof(
        reportId: string,
        fileName: string,
        fileUrl: string
    ): Promise<boolean> {
        const { error } = await this.supabase
            .from('report_proofs')
            .insert({
                report_id: reportId,
                file_name: fileName,
                file_url: fileUrl
            })

        if (error) {
            console.error('Error uploading proof:', error)
            return false
        }

        return true
    }

    async getReports(status?: string): Promise<Report[]> {
        let query = this.supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching reports:', error)
            return []
        }

        return data as Report[]
    }

    async getReportById(reportId: string, userId?: string): Promise<ReportWithProofs | null> {
        const { data: report, error: reportError } = await this.supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single()

        if (reportError || !report) {
            console.error('Error fetching report:', reportError)
            return null
        }

        const { data: proofs } = await this.supabase
            .from('report_proofs')
            .select('*')
            .eq('report_id', reportId)

        const { data: actions } = await this.supabase
            .from('moderator_actions')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false })

        let userVoted = false
        if (userId) {
            const { data: vote } = await this.supabase
                .from('votes')
                .select('id')
                .eq('report_id', reportId)
                .eq('user_id', userId)
                .maybeSingle()

            userVoted = !!vote
        }

        return {
            ...report,
            proofs: proofs || [],
            moderator_actions: actions || [],
            user_voted: userVoted
        } as ReportWithProofs
    }

    async voteForReport(reportId: string, userId: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('votes')
            .insert({
                report_id: reportId,
                user_id: userId
            })

        if (error) {
            console.error('Error voting:', error)
            return false
        }

        return true
    }

    async hasUserVoted(reportId: string, userId: string): Promise<boolean> {
        const { data } = await this.supabase
            .from('votes')
            .select('id')
            .eq('report_id', reportId)
            .eq('user_id', userId)
            .maybeSingle()

        return !!data
    }

    async getVoteCount(reportId: string): Promise<number> {
        const { count } = await this.supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('report_id', reportId)

        return count || 0
    }

    async createModeratorAction(
        reportId: string,
        moderatorId: string,
        action: 'approve' | 'reject',
        comment?: string
    ): Promise<boolean> {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'

        const { error: actionError } = await this.supabase
            .from('moderator_actions')
            .insert({
                report_id: reportId,
                moderator_id: moderatorId,
                action: action,
                comment: comment
            })

        if (actionError) {
            console.error('Error creating moderator action:', actionError)
            return false
        }

        const { error: updateError } = await this.supabase
            .from('reports')
            .update({ status: newStatus })
            .eq('id', reportId)

        if (updateError) {
            console.error('Error updating report status:', updateError)
            return false
        }

        return true
    }

    async updateReportGithubPath(reportId: string, githubPath: string): Promise<boolean> {
        const { error } = await this.supabase
            .from('reports')
            .update({ github_folder_path: githubPath })
            .eq('id', reportId)

        if (error) {
            console.error('Error updating GitHub path:', error)
            return false
        }

        return true
    }

    async getReportsBySubmitter(submittedBy: string): Promise<Report[]> {
        const { data, error } = await this.supabase
            .from('reports')
            .select('*')
            .eq('submitted_by', submittedBy)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching user reports:', error)
            return []
        }

        return data as Report[]
    }

    async resubmitReport(reportId: string, newReason?: string): Promise<boolean> {
        const updates: any = {
            status: 'voting',
            vote_count: 0,
            voting_deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }

        if (newReason) {
            updates.reason = newReason
        }

        const { error } = await this.supabase
            .from('reports')
            .update(updates)
            .eq('id', reportId)

        if (error) {
            console.error('Error resubmitting report:', error)
            return false
        }

        const { error: deleteVotesError } = await this.supabase
            .from('votes')
            .delete()
            .eq('report_id', reportId)

        if (deleteVotesError) {
            console.error('Error clearing votes:', deleteVotesError)
        }

        return true
    }
}

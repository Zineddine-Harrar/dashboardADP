import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface ChatLogData {
    question: string;
    response?: string;
    responseTimeMs?: number;
    success: boolean;
    errorMessage?: string;
    dateContext?: string;
}

export interface ChatAnalytics {
    totalQuestions: number;
    successRate: number;
    avgResponseTime: number;
    topQuestions: Array<{ question: string; count: number }>;
    feedbackStats: {
        positive: number;
        negative: number;
        noFeedback: number;
    };
}

@Injectable()
export class ChatLogService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log a chat interaction
     */
    async logInteraction(data: ChatLogData): Promise<number> {
        const log = await this.prisma.chatLog.create({
            data: {
                question: data.question,
                response: data.response,
                responseTimeMs: data.responseTimeMs,
                success: data.success,
                errorMessage: data.errorMessage,
                dateContext: data.dateContext ? new Date(data.dateContext) : null,
            },
        });

        console.log(
            `[CHAT LOG] ID:${log.id} | Q:"${data.question.substring(0, 50)}..." | ` +
            `Time:${data.responseTimeMs}ms | Success:${data.success}`,
        );

        return log.id;
    }

    /**
     * Update feedback for a chat interaction
     */
    async updateFeedback(logId: number, feedback: number): Promise<void> {
        await this.prisma.chatLog.update({
            where: { id: logId },
            data: {
                userFeedback: feedback,
                feedbackDate: new Date(),
            },
        });

        console.log(`[CHAT FEEDBACK] ID:${logId} | Rating:${feedback === 1 ? '­ƒæì' : '­ƒæÄ'}`);
    }

    /**
     * Get analytics from chat logs
     */
    async getAnalytics(days: number = 30): Promise<ChatAnalytics> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const logs = await this.prisma.chatLog.findMany({
            where: {
                createdAt: {
                    gte: since,
                },
            },
            select: {
                question: true,
                success: true,
                responseTimeMs: true,
                userFeedback: true,
            },
        });

        const totalQuestions = logs.length;
        const successCount = logs.filter((l) => l.success).length;
        const successRate = totalQuestions > 0 ? (successCount / totalQuestions) * 100 : 0;

        const avgResponseTime =
            logs
                .filter((l) => l.responseTimeMs)
                .reduce((sum, l) => sum + (l.responseTimeMs || 0), 0) / totalQuestions || 0;

        // Count question frequency
        const questionCounts = new Map<string, number>();
        logs.forEach((l) => {
            const count = questionCounts.get(l.question) || 0;
            questionCounts.set(l.question, count + 1);
        });

        const topQuestions = Array.from(questionCounts.entries())
            .map(([question, count]) => ({ question, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Feedback stats
        const positive = logs.filter((l) => l.userFeedback === 1).length;
        const negative = logs.filter((l) => l.userFeedback === -1).length;
        const noFeedback = logs.filter((l) => l.userFeedback === null).length;

        return {
            totalQuestions,
            successRate: Math.round(successRate * 10) / 10,
            avgResponseTime: Math.round(avgResponseTime),
            topQuestions,
            feedbackStats: {
                positive,
                negative,
                noFeedback,
            },
        };
    }

    /**
     * Get recent chat logs
     */
    async getRecentLogs(limit: number = 50) {
        return await this.prisma.chatLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                question: true,
                response: true,
                responseTimeMs: true,
                success: true,
                userFeedback: true,
                createdAt: true,
            },
        });
    }
}

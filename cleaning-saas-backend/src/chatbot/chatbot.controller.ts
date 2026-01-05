import { Body, Controller, Post, Get, Param, HttpException, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatLogService } from './chat-log.service';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class ChatQueryDto {
    @IsString()
    question: string;

    @IsOptional()
    @IsString()
    date?: string;
}

export class FeedbackDto {
    @IsInt()
    logId: number;

    @IsInt()
    rating: number; // 1 or -1
}

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatbotController {
    constructor(
        private readonly chatbotService: ChatbotService,
        private readonly chatLogService: ChatLogService,
    ) { }

    @Post('query')
    async query(@Body() chatQueryDto: ChatQueryDto) {
        try {
            const { response, logId } = await this.chatbotService.chat(
                chatQueryDto.question,
                chatQueryDto.date,
            );
            return {
                success: true,
                response,
                logId, // ÔåÉ ID pour le feedback
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Chatbot error:', error);
            throw new HttpException(
                {
                    success: false,
                    error: error.message || 'Une erreur est survenue',
                    timestamp: new Date().toISOString(),
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('feedback')
    async submitFeedback(@Body() feedbackDto: FeedbackDto) {
        try {
            await this.chatLogService.updateFeedback(
                feedbackDto.logId,
                feedbackDto.rating,
            );
            return {
                success: true,
                message: 'Merci pour votre feedback !',
            };
        } catch (error) {
            console.error('Feedback error:', error);
            throw new HttpException(
                {
                    success: false,
                    error: 'Impossible d\'enregistrer le feedback',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('analytics')
    async getAnalytics(@Query('days') days?: string) {
        try {
            const daysNum = days ? parseInt(days, 10) : 30;
            const analytics = await this.chatLogService.getAnalytics(daysNum);
            return {
                success: true,
                data: analytics,
            };
        } catch (error) {
            console.error('Analytics error:', error);
            throw new HttpException(
                {
                    success: false,
                    error: 'Impossible de r├®cup├®rer les analytics',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('logs')
    async getLogs(@Query('limit') limit?: string) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 50;
            const logs = await this.chatLogService.getRecentLogs(limitNum);
            return {
                success: true,
                data: logs,
            };
        } catch (error) {
            console.error('Logs error:', error);
            throw new HttpException(
                {
                    success: false,
                    error: 'Impossible de r├®cup├®rer les logs',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

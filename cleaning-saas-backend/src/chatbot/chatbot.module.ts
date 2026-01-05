import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatLogService } from './chat-log.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ChatbotController],
    providers: [ChatbotService, ChatLogService],
})
export class ChatbotModule { }

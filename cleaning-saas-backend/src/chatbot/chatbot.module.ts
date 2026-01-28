import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatLogService } from './chat-log.service';
import { DatabaseSchemaService } from './services/database-schema.service';
import { SqlAgentService } from './services/sql-agent.service';
import { SqlTemplatesService } from './services/sql-templates.service';
import { DatabaseModule } from '../database/database.module';
import { SpmModule } from '../spm/spm.module';

@Module({
    imports: [DatabaseModule, SpmModule],
    controllers: [ChatbotController],
    providers: [ChatbotService, ChatLogService, DatabaseSchemaService, SqlAgentService, SqlTemplatesService],
})
export class ChatbotModule { }

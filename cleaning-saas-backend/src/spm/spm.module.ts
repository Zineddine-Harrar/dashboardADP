import { Module } from '@nestjs/common';
import { SpmController } from './spm.controller';
import { SpmService } from './spm.service';

@Module({
    controllers: [SpmController],
    providers: [SpmService],
})
export class SpmModule { }

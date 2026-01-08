import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SpmService } from './spm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('spm')
@UseGuards(JwtAuthGuard)
export class SpmController {
    constructor(private readonly spmService: SpmService) { }

    @Get()
    getSpmData(@Query('year') year?: string) {
        return this.spmService.getSpmData(year);
    }
}

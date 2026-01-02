import { Module } from '@nestjs/common';
import { ExcelParserService } from './services/excel-parser.service';
import { GlobalParameterParser } from './services/parsing/global-parameter.parser';
import { ZoneParser } from './services/parsing/zone.parser';
import { ZoneKpiParser } from './services/parsing/zone-kpi.parser';
import { ZoneDemandCategoryKpiParser } from './services/parsing/zone-demand-category-kpi.parser';
import { CrowdInformationParser } from './services/parsing/crowd-information.parser';
import { DataAggregatorService } from './services/data-aggregator.service';
import { EtlOrchestratorService } from './services/etl-orchestrator.service';

/**
 * ETL module
 * Provides services for Excel parsing and data ingestion
 */
@Module({
    providers: [
        ExcelParserService,
        GlobalParameterParser,
        ZoneParser,
        ZoneKpiParser,
        ZoneDemandCategoryKpiParser,
        CrowdInformationParser,
        DataAggregatorService,
        EtlOrchestratorService,
    ],
    exports: [EtlOrchestratorService],
})
export class EtlModule { }

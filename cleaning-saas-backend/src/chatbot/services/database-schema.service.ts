import { Injectable } from '@nestjs/common';

export interface ColumnInfo {
    name: string;
    type: string;
    description: string;
}

export interface TableInfo {
    name: string;
    description: string;
    columns: ColumnInfo[];
}

export interface DatabaseSchema {
    tables: TableInfo[];
}

@Injectable()
export class DatabaseSchemaService {
    getSchema(): DatabaseSchema {
        return {
            tables: [
                {
                    name: 'daily_zone_cleaning_metrics',
                    description: 'Métriques quotidiennes de nettoyage par zone aéroportuaire',
                    columns: [
                        { name: 'id', type: 'INTEGER', description: 'Identifiant unique' },
                        { name: 'date', type: 'DATE', description: 'Date des métriques (format: YYYY-MM-DD)' },
                        { name: 'zoneId', type: 'TEXT', description: 'Identifiant de la zone' },
                        { name: 'zoneName', type: 'TEXT', description: 'Nom de la zone (ex: "Terminal 2F Hall 1")' },
                        { name: 'paxTotal', type: 'INTEGER', description: 'Nombre total de passagers dans la zone' },
                        { name: 'dailyTotalPax', type: 'INTEGER', description: 'Nombre total de passagers pour toute la journée' },
                        { name: 'alertWOs', type: 'INTEGER', description: 'Nombre d\'alertes work orders' },
                        { name: 'occurrencesMaintenance', type: 'INTEGER', description: 'Nombre d\'interventions de maintenance' },
                        { name: 'occurrencesAdditionnelles', type: 'INTEGER', description: 'Nombre d\'interventions additionnelles/renfort' },
                        { name: 'dureeMaintenanceSeconds', type: 'INTEGER', description: 'Durée totale maintenance en secondes' },
                        { name: 'dureeAdditionnelleSeconds', type: 'INTEGER', description: 'Durée totale additionnelle en secondes' },
                    ]
                }
            ]
        };
    }

    getSchemaAsText(): string {
        const schema = this.getSchema();
        let text = 'DATABASE SCHEMA:\n\n';

        schema.tables.forEach(table => {
            text += `TABLE: ${table.name}\n`;
            text += `DESCRIPTION: ${table.description}\n`;
            text += `COLUMNS:\n`;
            table.columns.forEach(col => {
                text += `  - ${col.name} (${col.type}): ${col.description}\n`;
            });
            text += '\n';
        });

        return text;
    }
}

import { Injectable } from '@nestjs/common';

interface SqlTemplate {
    pattern: RegExp;
    generator: (match: RegExpMatchArray) => string;
    description: string;
}

@Injectable()
export class SqlTemplatesService {
    private templates: SqlTemplate[] = [
        // Alertes sur un mois
        {
            pattern: /alert(?:e|es).*(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)/i,
            generator: (match) => {
                const monthMap: Record<string, number> = {
                    'janvier': 1, 'fevrier': 2, 'mars': 3, 'avril': 4,
                    'mai': 5, 'juin': 6, 'juillet': 7, 'aout': 8,
                    'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12
                };
                const monthName = match[0].match(/janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre/i)?.[0].toLowerCase();
                const monthNum = monthName ? monthMap[monthName] : 1;

                return `SELECT 
  SUM("alertWOs") as total_alertes,
  COUNT(DISTINCT "date") as nombre_jours,
  ROUND(AVG("alertWOs"), 1) as moyenne_par_jour
FROM "daily_zone_cleaning_metrics"
WHERE EXTRACT(MONTH FROM "date") = ${monthNum}
  AND EXTRACT(YEAR FROM "date") = 2025`;
            },
            description: 'Nombre d\'alertes sur un mois spécifique'
        },

        // Analyse complète d'un mois
        {
            pattern: /analys(?:e|er).*(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)/i,
            generator: (match) => {
                const monthMap: Record<string, number> = {
                    'janvier': 1, 'fevrier': 2, 'mars': 3, 'avril': 4,
                    'mai': 5, 'juin': 6, 'juillet': 7, 'aout': 8,
                    'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12
                };
                const monthName = match[0].match(/janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre/i)?.[0].toLowerCase();
                const monthNum = monthName ? monthMap[monthName] : 1;

                return `SELECT 
  TO_CHAR("date", 'Month YYYY') as mois,
  COUNT(DISTINCT "date") as nombre_jours,
  SUM("paxTotal") as total_passagers,
  SUM("alertWOs") as total_alertes,
  ROUND(SUM("dureeMaintenanceSeconds") / 3600.0, 1) as heures_maintenance,
  ROUND(SUM("dureeAdditionnelleSeconds") / 3600.0, 1) as heures_additionnelles
FROM "daily_zone_cleaning_metrics"
WHERE EXTRACT(MONTH FROM "date") = ${monthNum}
  AND EXTRACT(YEAR FROM "date") = 2025
GROUP BY TO_CHAR("date", 'Month YYYY')`;
            },
            description: 'Analyse complète d\'un mois'
        },

        // Passagers sur un mois
        {
            pattern: /passager(?:s)?.*(?:janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)/i,
            generator: (match) => {
                const monthMap: Record<string, number> = {
                    'janvier': 1, 'fevrier': 2, 'mars': 3, 'avril': 4,
                    'mai': 5, 'juin': 6, 'juillet': 7, 'aout': 8,
                    'septembre': 9, 'octobre': 10, 'novembre': 11, 'decembre': 12
                };
                const monthName = match[0].match(/janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre/i)?.[0].toLowerCase();
                const monthNum = monthName ? monthMap[monthName] : 1;

                return `SELECT 
  SUM("paxTotal") as total_passagers,
  ROUND(AVG("paxTotal"), 0) as moyenne_par_jour,
  MIN("paxTotal") as minimum,
  MAX("paxTotal") as maximum
FROM "daily_zone_cleaning_metrics"
WHERE EXTRACT(MONTH FROM "date") = ${monthNum}
  AND EXTRACT(YEAR FROM "date") = 2025`;
            },
            description: 'Statistiques passagers pour un mois'
        },

        // Zones les plus sollicitées
        {
            pattern: /zone(?:s)?.*(plus|top|meilleur).*(?:sollicit|alert|occurr)/i,
            generator: () => {
                return `SELECT 
  "zoneId",
  "zoneName",
  SUM("alertWOs") as total_alertes,
  SUM("occurrencesMaintenance") as total_occurrences
FROM "daily_zone_cleaning_metrics"
WHERE "date" >= '2025-01-01'
GROUP BY "zoneId", "zoneName"
ORDER BY total_alertes DESC
LIMIT 10`;
            },
            description: 'Top 10 des zones les plus sollicitées'
        }
    ];

    tryGenerateSql(question: string): string | null {
        console.log('[SQL TEMPLATES] Trying to match question:', question);

        for (const template of this.templates) {
            const match = question.match(template.pattern);
            if (match) {
                const sql = template.generator(match);
                console.log('[SQL TEMPLATES] Matched template:', template.description);
                console.log('[SQL TEMPLATES] Generated SQL:', sql);
                return sql;
            }
        }

        console.log('[SQL TEMPLATES] No template matched');
        return null;
    }
}

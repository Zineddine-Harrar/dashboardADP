import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DatabaseSchemaService } from './database-schema.service';
import { SqlTemplatesService } from './sql-templates.service';

export interface SqlQueryResult {
    success: boolean;
    data?: any[];
    error?: string;
    sql?: string;
}

@Injectable()
export class SqlAgentService {
    constructor(
        private prisma: PrismaService,
        private schemaService: DatabaseSchemaService,
        private templatesService: SqlTemplatesService,
    ) { }

    async generateSql(question: string): Promise<string> {
        // Use OpenAI directly for dynamic SQL generation
        console.log('[SQL AGENT] Using OpenAI to generate SQL for:', question);

        const schema = this.schemaService.getSchemaAsText();

        const prompt = `You are a PostgreSQL expert. Generate a SAFE SELECT query based on the user question.

${schema}

IMPORTANT DATE HANDLING:
- The database contains data from July 2025 to January 2026
- When user asks about "janvier" without year, use EXTRACT(MONTH FROM "date") = 1 AND EXTRACT(YEAR FROM "date") = 2026
- When user asks about months Jul-Dec without year, use year 2025
- When user asks about January, use year 2026
- Available months: July 2025, Aug 2025, Sep 2025, Oct 2025, Nov 2025, Dec 2025, Jan 2026

CRITICAL RULES:
1. Use ONLY SELECT statements (no INSERT, UPDATE, DELETE, DROP, ALTER, CREATE)
2. Always use proper aggregations: SUM(), AVG(), COUNT(), MIN(), MAX()
3. For dates: use format 'YYYY-MM-DD' and TO_CHAR for formatting months
4. Convert seconds to hours: "dureeMaintenanceSeconds" / 3600.0 AS heures_maintenance
5. Use correct column names with camelCase and quotes: "paxTotal", "alertWOs", "zoneName", etc.
6. Add LIMIT clause if not specified (max 100)
7. Return ONLY the SQL query, no explanation, no markdown blocks

EXAMPLES:

Question: "Zones les plus visitées en janvier"
SQL:
SELECT 
  "zoneName",
  COUNT(DISTINCT "date") as nombre_jours,
  SUM("paxTotal") as total_passagers,
  ROUND(AVG("paxTotal"), 0) as moyenne_passagers
FROM "daily_zone_cleaning_metrics"
WHERE EXTRACT(MONTH FROM "date") = 1 AND EXTRACT(YEAR FROM "date") = 2026
GROUP BY "zoneName", "zoneId"
ORDER BY total_passagers DESC
LIMIT 10;

Question: "Compare septembre et novembre"
SQL:
SELECT 
  TO_CHAR("date", 'Month YYYY') as mois,
  COUNT(DISTINCT "date") as jours,
  SUM("paxTotal") as total_passagers,
  SUM("alertWOs") as total_alertes
FROM "daily_zone_cleaning_metrics"
WHERE EXTRACT(MONTH FROM "date") IN (9, 11) AND EXTRACT(YEAR FROM "date") = 2025
GROUP BY TO_CHAR("date", 'Month YYYY'), EXTRACT(MONTH FROM "date")
ORDER BY EXTRACT(MONTH FROM "date");

USER QUESTION: "${question}"

SQL QUERY:`;

        try {
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

            if (!OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY not configured');
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 500,
                }),
            });


            if (!response.ok) {
                throw new Error(`OpenRouter error: ${response.status}`);
            }

            const data = await response.json();
            let rawContent = data.choices[0].message.content.trim();

            console.log('[SQL AGENT] Raw model output:', rawContent.substring(0, 500));

            // Remove <think> tags (DeepSeek R1 reasoning)
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '');

            // Extract SQL from code blocks
            let sql = rawContent.trim();
            sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();

            // If still contains explanations, try to extract SELECT query
            const selectMatch = sql.match(/SELECT[\s\S]*?(?:;|$)/i);
            if (selectMatch) {
                sql = selectMatch[0].replace(/;$/, '').trim();
            }

            // Remove any remaining explanation text before SELECT
            const cleanSelect = sql.match(/SELECT[\s\S]*$/i);
            if (cleanSelect) {
                sql = cleanSelect[0].trim();
            }

            console.log('[SQL AGENT] Extracted SQL:', sql);

            // OpenAI generates correct SQL with proper quotes, no post-processing needed
            console.log('[SQL AGENT] Generated SQL:', sql);

            return sql;
        } catch (error) {
            console.error('[SQL AGENT] Error generating SQL:', error);
            throw new Error('Failed to generate SQL query');
        }
    }

    private validateSql(sql: string): { valid: boolean; error?: string } {
        const upperSql = sql.toUpperCase();

        const forbidden = [
            'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER',
            'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC',
            'EXECUTE', '--', '/*', '*/', ';--'
        ];

        for (const word of forbidden) {
            if (upperSql.includes(word)) {
                return { valid: false, error: `Forbidden keyword: ${word}` };
            }
        }

        if (!upperSql.trim().startsWith('SELECT')) {
            return { valid: false, error: 'Only SELECT queries allowed' };
        }

        return { valid: true };
    }

    async executeSafeSql(sql: string): Promise<any[]> {
        const validation = this.validateSql(sql);
        if (!validation.valid) {
            throw new Error(`SQL validation failed: ${validation.error}`);
        }

        try {
            const results = await this.prisma.$queryRawUnsafe(sql);
            return Array.isArray(results) ? results : [results];
        } catch (error) {
            console.error('[SQL AGENT] Query execution error:', error);
            throw new Error(`SQL execution failed: ${error.message}`);
        }
    }

    async queryDatabase(question: string): Promise<SqlQueryResult> {
        try {
            console.log('[SQL AGENT] Processing question:', question);

            const sql = await this.generateSql(question);
            console.log('[SQL AGENT] Generated SQL:', sql);

            const data = await this.executeSafeSql(sql);
            console.log('[SQL AGENT] Query returned', data.length, 'rows');

            return { success: true, data, sql };
        } catch (error) {
            console.error('[SQL AGENT] Error:', error);
            return { success: false, error: error.message };
        }
    }
}

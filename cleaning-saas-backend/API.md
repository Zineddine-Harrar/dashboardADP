# API Documentation

Documentation complète des endpoints API du SaaS Backend de nettoyage.

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. GET /metrics

Récupère toutes les métriques de zones pour une date donnée.

#### Query Parameters

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `date` | string | ✅ Oui | Date au format YYYY-MM-DD |

#### Exemple de requête

```bash
GET /metrics?date=2025-12-03
```

```bash
curl "http://localhost:3000/metrics?date=2025-12-03"
```

#### Réponse réussie (200 OK)

```json
{
  "date": "2025-12-03",
  "count": 121,
  "data": [
    {
      "id": 1,
      "date": "2025-12-03T00:00:00.000Z",
      "zoneId": "ADP / CDG / 2F / Arrivée / Canyon F1 / Zone Publique Canyon F1 / BS Canyon F1 / BS Femmes Canyon F1",
      "zoneName": "BS Femmes Canyon F1",
      "occurrencesMaintenance": 4,
      "occurrencesAdditionnelles": 1,
      "paxTotal": 0,
      "dureeMaintenanceSeconds": 1800,
      "dureeAdditionnelleSeconds": 600,
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z"
    },
    // ... autres zones
  ]
}
```

#### Réponses d'erreur

**400 Bad Request** - Date manquante ou invalide
```json
{
  "statusCode": 400,
  "message": "Date parameter is required"
}
```

**404 Not Found** - Aucune donnée pour cette date
```json
{
  "statusCode": 404,
  "message": "No metrics found for date: 2025-12-03"
}
```

---

### 2. GET /metrics/:zoneId

Récupère les métriques pour une zone spécifique.

#### Path Parameters

| Paramètre | Type | Description |
|-----------|------|-------------|
| `zoneId` | string | Identifiant de la zone (URL encoded) |

#### Query Parameters

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `date` | string | ❌ Non | Date au format YYYY-MM-DD (optionnel) |

#### Exemple de requête

```bash
# Avec date spécifique
GET /metrics/ADP%20%2F%20CDG%20%2F%202F%20%2F%20Arrivée?date=2025-12-03

# Toutes les dates pour cette zone
GET /metrics/ADP%20%2F%20CDG%20%2F%202F%20%2F%20Arrivée
```

```bash
# Avec date
curl "http://localhost:3000/metrics/ADP%20%2F%20CDG%20%2F%202F%20%2F%20Arrivée?date=2025-12-03"

# Sans date (historique)
curl "http://localhost:3000/metrics/ADP%20%2F%20CDG%20%2F%202F%20%2F%20Arrivée"
```

#### Réponse réussie (200 OK)

```json
{
  "zoneId": "ADP / CDG / 2F / Arrivée",
  "count": 1,
  "data": [
    {
      "id": 1,
      "date": "2025-12-03T00:00:00.000Z",
      "zoneId": "ADP / CDG / 2F / Arrivée",
      "zoneName": "Arrivée",
      "occurrencesMaintenance": 4,
      "occurrencesAdditionnelles": 1,
      "paxTotal": 12500,
      "dureeMaintenanceSeconds": 3600,
      "dureeAdditionnelleSeconds": 1200,
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z"
    }
  ]
}
```

#### Réponses d'erreur

**404 Not Found** - Zone non trouvée
```json
{
  "statusCode": 404,
  "message": "No metrics found for zone \"ADP / CDG / 2F / Arrivée\" on date 2025-12-03"
}
```

---

### 3. GET /metrics/dates/available

Liste toutes les dates pour lesquelles des données sont disponibles dans la base.

#### Exemple de requête

```bash
GET /metrics/dates/available
```

```bash
curl "http://localhost:3000/metrics/dates/available"
```

#### Réponse réussie (200 OK)

```json
{
  "count": 3,
  "dates": [
    "2025-12-03",
    "2025-12-02",
    "2025-12-01"
  ]
}
```

---

### 4. GET /metrics/stats/summary

Récupère des statistiques agrégées pour une date donnée.

#### Query Parameters

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `date` | string | ✅ Oui | Date au format YYYY-MM-DD |

#### Exemple de requête

```bash
GET /metrics/stats/summary?date=2025-12-03
```

```bash
curl "http://localhost:3000/metrics/stats/summary?date=2025-12-03"
```

#### Réponse réussie (200 OK)

```json
{
  "date": "2025-12-03T00:00:00.000Z",
  "totalZones": 121,
  "totalPax": 250000,
  "totalMaintenanceHours": 250.5,
  "totalAdditionnelleHours": 45.2,
  "totalOccurrencesMaintenance": 484,
  "totalOccurrencesAdditionnelles": 121
}
```

#### Description des champs

| Champ | Type | Description |
|-------|------|-------------|
| `date` | string | Date des données |
| `totalZones` | number | Nombre total de zones |
| `totalPax` | number | Total de passagers sur toutes les zones |
| `totalMaintenanceHours` | number | Total heures de maintenance (arrondi à 2 décimales) |
| `totalAdditionnelleHours` | number | Total heures de renfort (arrondi à 2 décimales) |
| `totalOccurrencesMaintenance` | number | Total occurrences de maintenance |
| `totalOccurrencesAdditionnelles` | number | Total occurrences de renfort |

#### Réponses d'erreur

**400 Bad Request** - Date manquante
```json
{
  "statusCode": 400,
  "message": "Date parameter is required"
}
```

**404 Not Found** - Aucune donnée pour cette date
```json
{
  "statusCode": 404,
  "message": "No data found for date: 2025-12-03"
}
```

---

## Modèle de Données

### DailyZoneCleaningMetrics

```typescript
interface DailyZoneCleaningMetrics {
  id: number;                         // ID auto-incrémenté
  date: Date;                         // Date du scénario
  zoneId: string;                     // ID complet de la zone
  zoneName: string;                   // Nom lisible de la zone
  occurrencesMaintenance: number | null;      // Nb occurrences maintenance
  occurrencesAdditionnelles: number | null;   // Nb occurrences renfort
  paxTotal: number | null;                    // Total passagers
  dureeMaintenanceSeconds: number | null;     // Durée ENTRETIEN (sec)
  dureeAdditionnelleSeconds: number | null;   // Durée RENFORT (sec)
  createdAt: Date;                    // Date création
  updatedAt: Date;                    // Date mise à jour
}
```

---

## Codes d'Erreur HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| `200` | OK | Requête réussie |
| `400` | Bad Request | Paramètres invalides ou manquants |
| `404` | Not Found | Ressource non trouvée |
| `500` | Internal Server Error | Erreur serveur |

---

## Exemples d'Utilisation

### JavaScript/TypeScript (fetch)

```typescript
// Récupérer toutes les métriques pour une date
async function getMetrics(date: string) {
  const response = await fetch(`http://localhost:3000/metrics?date=${date}`);
  const data = await response.json();
  return data;
}

// Récupérer les métriques d'une zone
async function getZoneMetrics(zoneId: string, date?: string) {
  const url = date 
    ? `http://localhost:3000/metrics/${encodeURIComponent(zoneId)}?date=${date}`
    : `http://localhost:3000/metrics/${encodeURIComponent(zoneId)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Récupérer les statistiques
async function getStats(date: string) {
  const response = await fetch(`http://localhost:3000/metrics/stats/summary?date=${date}`);
  const data = await response.json();
  return data;
}
```

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:3000"

# Récupérer toutes les métriques
def get_metrics(date: str):
    response = requests.get(f"{BASE_URL}/metrics", params={"date": date})
    return response.json()

# Récupérer les métriques d'une zone
def get_zone_metrics(zone_id: str, date: str = None):
    url = f"{BASE_URL}/metrics/{zone_id}"
    params = {"date": date} if date else {}
    response = requests.get(url, params=params)
    return response.json()

# Récupérer les statistiques
def get_stats(date: str):
    response = requests.get(f"{BASE_URL}/metrics/stats/summary", params={"date": date})
    return response.json()
```

---

## Notes Importantes

1. **URL Encoding** : Les IDs de zones contiennent des caractères spéciaux (`/`, espaces). Assurez-vous d'encoder correctement les URLs.

2. **Format de Date** : Toutes les dates doivent être au format `YYYY-MM-DD` (ISO 8601).

3. **CORS** : L'API a CORS activé par défaut pour faciliter l'intégration frontend.

4. **Pagination** : Non implémentée dans la V1. Toutes les données pour une date sont retournées.

5. **Durées** : Les durées sont stockées en secondes. Pour convertir en heures : `secondes / 3600`.

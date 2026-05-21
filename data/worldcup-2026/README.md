# FIFA World Cup 2026 CSV drop

Place these files from the Kaggle dataset `areezvisram12/fifa-world-cup-2026-match-data-unofficial`:

- `matches.csv`
- `teams.csv`
- `host_cities.csv`
- `tournament_stages.csv`

## Download options

**Kaggle CLI** (after `pip install kaggle` and API credentials in `~/.kaggle/kaggle.json`):

```bash
kaggle datasets download -d areezvisram12/fifa-world-cup-2026-match-data-unofficial -p data/worldcup-2026 --unzip
```

**Python kagglehub**:

```python
import kagglehub
path = kagglehub.dataset_download("areezvisram12/fifa-world-cup-2026-match-data-unofficial")
# Copy the four CSV files into this folder
```

## UEFA playoff winners (2026)

These replace Kaggle placeholders in `teams.csv`:

| Path | Winner | Final |
|------|--------|-------|
| A | Bosnia and Herzegovina | 1–1 vs Italy (4–1 pens) |
| B | Sweden | 3–2 vs Poland |
| C | Türkiye | 1–0 vs Kosovo |
| D | Czechia | 2–2 vs Denmark (3–1 pens) |

**Confirmed groups (playoff winners):**

| Group | Teams |
|-------|--------|
| I | France, Senegal, Norway, Iraq (FIFA Playoff 2) |
| K | Portugal, Colombia, Uzbekistan, DR Congo (FIFA Playoff 1) |

## Import into the app

```bash
npm run import:worldcup -- --group-id <GROUP_UUID> --contest-id <CONTEST_UUID>
```

Or use the owner **Import schedule** page and **upload all four CSV files** (required on Vercel; the server does not have your local `data/worldcup-2026/` folder).

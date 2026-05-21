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

## Import into the app

```bash
npm run import:worldcup -- --group-id <GROUP_UUID> --contest-id <CONTEST_UUID>
```

Or use the owner **Import schedule** page under the group.

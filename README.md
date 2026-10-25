# ATLAS: Temporal Image Change Detection

Training-free change detection pipeline (registration, photometric normalisation,
pixel/SSIM fusion, floor-bounded Otsu) with a FastAPI backend and Next.js interface.

## Run the backend
```powershell
cd services/vision
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
pytest -q
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Run the frontend
```powershell
cd apps/web
npm install
npm run dev   # http://localhost:3000
```

## Reproduce the experiments
```powershell
cd services/vision
python -m experiments.generate_synthetic --out data/synthetic_v2 --split val  --count 15 --seed 1000
python -m experiments.generate_synthetic --out data/synthetic_v2 --split test --count 30 --seed 3000
python -m experiments.run_experiments --data data/synthetic_v2 --out outputs_v2
python -m experiments.make_figures    --data data/synthetic_v2 --out outputs_v2
python -m experiments.significance    --out outputs_v2
```
Results (F1 per scenario, ablation, figures) are in `services/vision/outputs_v2`.
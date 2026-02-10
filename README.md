# Stock Your Lot UI
UI application for Stock Your Lot.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm run preview
```

The login form is demo-only (shows an alert on submit). Replace the `setTimeout` logic in `src/Login.jsx` with your real authentication (e.g. API call or auth provider).

## Deploy to GCP Kubernetes (GKE)

On every push to `main`, GitHub Actions builds a Docker image, pushes it to Google Artifact Registry, and deploys to your GKE cluster.

### Prerequisites

1. **GCP project** with Kubernetes Engine and Artifact Registry APIs enabled.
2. **GKE cluster** (regional or zonal).
3. **Artifact Registry repository** (Docker format) in the same region, e.g.:
   ```bash
   gcloud artifacts repositories create stock-your-lot-ui \
     --repository-format=docker \
     --location=us-central1
   ```
4. **Service account** with permissions to push images and deploy to GKE. Create a key and copy the JSON contents for the secret below.

### GitHub secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Required | Description |
|--------|----------|-------------|
| `GCP_PROJECT_ID` | Yes | GCP project ID |
| `GCP_SA_KEY` | Yes | Full JSON contents of the service account key file |
| `GKE_CLUSTER` | Yes | GKE cluster name |
| `GKE_REGION` | Yes | Region for Artifact Registry and cluster (e.g. `us-central1`) |
| `GKE_ZONE` | No | For zonal clusters only (e.g. `us-central1-a`) |
| `GKE_NAMESPACE` | No | Kubernetes namespace (default: `default`) |
| `ARTIFACT_REGISTRY_REPO` | No | Artifact Registry repo name (default: `stock-your-lot-ui`) |

Merge (or push) to `main` to trigger a deploy.

**If you see "Repository *** not found":** The workflow now creates the Artifact Registry repository automatically if it doesn’t exist. Ensure the **Artifact Registry API** is enabled (`gcloud services enable artifactregistry.googleapis.com`) and your service account has `roles/artifactregistry.repositories.admin` or at least create + push rights. Then re-run the workflow.

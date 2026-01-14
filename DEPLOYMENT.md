# Deployment Guide

This guide explains how to deploy the map-app to Google Cloud Run using Terraform and CI/CD.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Google Cloud SDK** (`gcloud`) installed and authenticated
3. **Terraform** (>= 1.0) installed
4. **Docker** installed (for local testing)
5. **GitHub repository** with Actions enabled

## Initial Setup

### 1. Create a GCP Service Account for CI/CD

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
export SA_NAME="github-actions-sa"
export SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create ${SA_NAME} \
  --display-name="GitHub Actions Service Account" \
  --project=${PROJECT_ID}

# Grant necessary permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.editor"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=${SA_EMAIL} \
  --project=${PROJECT_ID}
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_REGION`: GCP region (e.g., `us-central1`)
- `GCP_SERVICE_NAME`: Service name (e.g., `map-app`)
- `GCP_ARTIFACT_REGISTRY_REPO`: Repository name (e.g., `map-app-repo`)
- `GCP_SA_KEY`: Contents of the `key.json` file created above
- `GOOGLE_MAPS_KEY`: Your Google Maps API key
- `GOOGLE_ROUTES_API_KEY`: (Optional) Your Google Routes API key
- `PLACES_API`: (Optional) Places API URL (default provided)
- `GOOGLE_ROUTES_API_URL`: (Optional) Routes API URL (default provided)

### 3. Configure Terraform (for manual deployment)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
project_id            = "your-gcp-project-id"
region                = "us-central1"
app_name              = "map-app"
google_maps_key       = "your-google-maps-api-key"
google_routes_api_key = "" # Optional
```

## Deployment Methods

### Option 1: Automatic CI/CD Deployment (Recommended)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically deploys when you push to `main` or `master` branch.

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Setup deployment"
   git push origin main
   ```

2. **Monitor deployment:**
   - Go to GitHub → Actions tab
   - Watch the "Deploy to Cloud Run" workflow
   - Once complete, the service URL will be in the workflow summary

### Option 2: Manual Terraform Deployment

1. **Initialize Terraform:**
   ```bash
   cd terraform
   terraform init
   ```

2. **Review the plan:**
   ```bash
   terraform plan
   ```

3. **Apply the configuration:**
   ```bash
   terraform apply
   ```

4. **Build and push Docker image manually:**
   ```bash
   # Authenticate Docker
   gcloud auth configure-docker us-central1-docker.pkg.dev

   # Build the image
   docker build -t us-central1-docker.pkg.dev/PROJECT_ID/map-app-repo/map-app:latest .

   # Push the image
   docker push us-central1-docker.pkg.dev/PROJECT_ID/map-app-repo/map-app:latest

   # Update Cloud Run service
   cd terraform
   terraform apply -var="image_tag=latest"
   ```

## Verifying Deployment

After deployment, you can verify:

1. **Get the service URL:**
   ```bash
   gcloud run services describe map-app --region=us-central1 --format='value(status.url)'
   ```

2. **Or check Terraform outputs:**
   ```bash
   cd terraform
   terraform output cloud_run_service_url
   ```

3. **Test the service:**
   ```bash
   curl $(terraform output -raw cloud_run_service_url)
   ```

## Updating the Deployment

### Via CI/CD
Simply push changes to the main branch. The workflow will:
1. Build a new Docker image
2. Push it to Artifact Registry
3. Update Cloud Run with Terraform

### Via Manual Terraform
1. Update your code
2. Build and push a new Docker image
3. Run `terraform apply` with the new image tag

## Cost Optimization

The default configuration is optimized for cost:

- **Scale to zero**: No cost when idle
- **Free tier**: 2 million requests/month free
- **Low resource limits**: 1 CPU, 512Mi memory

To adjust resources, edit `terraform/variables.tf` or set variables in `terraform.tfvars`:

```hcl
cpu_limit            = "2"      # Increase for better performance
memory_limit         = "1Gi"    # Increase if needed
min_instances        = "1"      # Keep 1+ instances always running
max_instances        = "20"     # Increase for high traffic
```

## Troubleshooting

### Build fails in CI/CD
- Check that all GitHub secrets are set correctly
- Verify the service account has the required permissions
- Check the GitHub Actions logs for specific errors

### Terraform apply fails
- Ensure you're authenticated: `gcloud auth application-default login`
- Verify the project ID is correct
- Check that required APIs are enabled

### Service not accessible
- Verify the IAM policy allows public access (included in Terraform)
- Check Cloud Run service logs: `gcloud run services logs read map-app --region=us-central1`

### Environment variables not working
- Verify secrets are set in GitHub
- Check that Terraform variables are passed correctly
- Review Cloud Run service configuration: `gcloud run services describe map-app --region=us-central1`

## Cleanup

To remove all resources:

```bash
cd terraform
terraform destroy
```

This will remove:
- Cloud Run service
- Artifact Registry repository
- All associated resources

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GitHub Actions for GCP](https://github.com/google-github-actions)

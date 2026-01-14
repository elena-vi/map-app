# Terraform Configuration for Cloud Run Deployment

This directory contains Terraform configuration to deploy the map-app to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project**: You need a GCP project with billing enabled
2. **Terraform**: Install Terraform (>= 1.0)
3. **Google Cloud SDK**: Install `gcloud` CLI
4. **Authentication**: Authenticate with GCP:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

## Setup

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values:
   - `project_id`: Your GCP project ID
   - `google_maps_key`: Your Google Maps API key
   - `google_routes_api_key`: (Optional) Your Google Routes API key
   - Adjust other variables as needed

3. **Initialize Terraform:**
   ```bash
   cd terraform
   terraform init
   ```

4. **Review the plan:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Variables

See `variables.tf` for all available variables. Key variables:

- `project_id` (required): GCP Project ID
- `region` (default: us-central1): GCP Region
- `app_name` (default: map-app): Cloud Run service name
- `google_maps_key` (required): Google Maps API Key
- `google_routes_api_key` (optional): Google Routes API Key
- `min_instances` (default: 0): Minimum instances (0 = scale to zero)
- `max_instances` (default: 10): Maximum instances

## Outputs

After deployment, Terraform will output:
- `cloud_run_service_url`: The URL of your deployed service
- `cloud_run_service_name`: The name of the Cloud Run service
- `artifact_registry_repository`: The Artifact Registry repository name

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
1. Builds the Docker image
2. Pushes it to Artifact Registry
3. Updates the Cloud Run service using Terraform

## Manual Deployment

If you want to deploy manually without CI/CD:

1. **Build and push the Docker image:**
   ```bash
   # Authenticate Docker
   gcloud auth configure-docker REGION-docker.pkg.dev

   # Build the image
   docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/map-app:latest .

   # Push the image
   docker push REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/map-app:latest
   ```

2. **Update Terraform with the new image tag:**
   ```bash
   terraform apply -var="image_tag=latest"
   ```

## Destroying Resources

To remove all resources:
```bash
terraform destroy
```

## Cost Optimization

The default configuration is optimized for cost:
- **Scale to zero**: `min_instances = 0` means no cost when idle
- **Low resource limits**: 1 CPU, 512Mi memory
- **Free tier**: 2 million requests/month free

Adjust `min_instances`, `max_instances`, and resource limits based on your needs.

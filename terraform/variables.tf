variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "map-app"
}

variable "image_tag" {
  description = "Docker image tag (usually git commit SHA or 'latest')"
  type        = string
  default     = "latest"
}

variable "google_maps_key" {
  description = "Google Maps API Key"
  type        = string
  sensitive   = true
}

variable "google_routes_api_key" {
  description = "Google Routes API Key (optional, will use google_maps_key if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "places_api" {
  description = "Google Places API URL"
  type        = string
  default     = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
}

variable "google_routes_api_url" {
  description = "Google Routes API URL"
  type        = string
  default     = "https://routes.googleapis.com/directions/v2:computeRoutes"
}

variable "cpu_limit" {
  description = "CPU limit for Cloud Run service"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit for Cloud Run service"
  type        = string
  default     = "512Mi"
}

variable "container_concurrency" {
  description = "Maximum number of concurrent requests per container"
  type        = number
  default     = 80
}

variable "timeout_seconds" {
  description = "Request timeout in seconds"
  type        = number
  default     = 300
}

variable "min_instances" {
  description = "Minimum number of instances (0 for scale-to-zero)"
  type        = string
  default     = "0"
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = string
  default     = "10"
}

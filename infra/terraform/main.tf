# FleetPulse Terraform Cloud Infrastructure Provisioning
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

# 1. VPC and Networking
resource "aws_vpc" "fleetpulse_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "fleetpulse-${var.environment}-vpc"
    Environment = var.environment
  }
}

# 2. S3 Bucket for Cold Parquet Storage & ML Replay
resource "aws_s3_bucket" "telemetry_lake" {
  bucket = "fleetpulse-telemetry-lake-${var.environment}"

  tags = {
    Name        = "FleetPulse Cold Telemetry Parquet Lake"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "telemetry_lake_crypto" {
  bucket = aws_s3_bucket.telemetry_lake.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

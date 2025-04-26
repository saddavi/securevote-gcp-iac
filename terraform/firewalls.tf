# Internal traffic firewall rule (like giving residents access cards)
resource "google_compute_firewall" "vpc_dev_allow_internal" {
  project = var.project_id # Added project ID reference
  name    = "vpc-dev-allow-internal"
  network = google_compute_network.vpc_dev.name

  # Allow residents (internal IPs) to communicate freely
  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  # Only traffic from your subnet is allowed
  # Using the subnet resource reference is more robust than hardcoding
  source_ranges = [google_compute_subnetwork.subnet_dev.ip_cidr_range] 

  description = "Allow internal traffic between resources in the subnet"
}

# SSH access firewall rule (like a controlled entry point for administrators)
resource "google_compute_firewall" "vpc_dev_allow_ssh" {
  project = var.project_id # Added project ID reference
  name    = "vpc-dev-allow-ssh"
  network = google_compute_network.vpc_dev.name

  allow {
    protocol = "tcp"
    ports    = ["22"]  # SSH port
  }

  # In production, you'd restrict this to your company's IP range
  # WARNING: This allows SSH from anywhere. Replace with your trusted IP/32 for better security.
  source_ranges = ["0.0.0.0/0"] 

  description = "Allow SSH access to resources"
}
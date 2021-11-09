

# ######################################################
# #Shell Script
# ######################################################
resource "null_resource" "create_dotenv" {
  provisioner "local-exec" {
    command = "bash scripts/create-dotenv.sh ${local.code_bucket} ${var.port}"
  }

}

resource "null_resource" "code_zip" {
  provisioner "local-exec" {
    command = "bash scripts/using-local-adinfo-project.sh ${var.project_version} ${local.code_bucket}"
  }

  #depends_on = [google_storage_bucket.adinfo_code, null_resource.create_dotenv]
  # depends_on = [null_resource.create_dotenv]
}


######################################################
#Configurações App Engine
######################################################
resource "google_app_engine_standard_app_version" "adinfo" {
  version_id = "v1"
  service    = "default"
  runtime    = "nodejs12"

  entrypoint {
    shell = "npm start"
  }

  deployment {
    zip {
      source_url = "https://storage.googleapis.com/${local.code_bucket}/adinfo-code-${var.project_version}.zip"
    }
  }

  env_variables = {
    port = var.port
  }

  # automatic_scaling {
  #   max_concurrent_requests = 10
  #   min_idle_instances = 1
  #   max_idle_instances = 3
  #   min_pending_latency = "1s"
  #   max_pending_latency = "5s"
  #   standard_scheduler_settings {
  #     target_cpu_utilization = 0.5
  #     target_throughput_utilization = 0.75
  #     min_instances = 2
  #     max_instances = 10
  #   }
  # }

  delete_service_on_destroy = true
  depends_on = [null_resource.code_zip]
}




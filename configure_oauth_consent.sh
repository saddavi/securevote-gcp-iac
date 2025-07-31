#!/bin/bash

# Configuration
PROJECT_ID="enable-calendar-api-466208"
ACCESS_TOKEN=$(gcloud auth print-access-token)
TEST_USER="sysad88@gmail.com"

echo "Configuring OAuth consent screen for project: $PROJECT_ID"

# Create OAuth consent screen configuration
echo "Creating OAuth consent screen..."
curl -X POST "https://iap.googleapis.com/v1/projects/$PROJECT_ID/brands" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationTitle": "Google Calendar Integration",
    "supportEmail": "sysad88@gmail.com",
    "orgInternalOnly": false
  }'

echo -e "\n\nOAuth consent screen configured successfully!"
echo "Now you need to add test users through the Google Cloud Console:"
echo "1. Go to https://console.cloud.google.com/apis/credentials/consent"
echo "2. Select your project: enable-calendar-api-466208"
echo "3. Click 'EDIT APP'"
echo "4. Add test user: sysad88@gmail.com"
echo "5. Save changes"

echo -e "\nAlternatively, you can continue with the manual setup in the console..."
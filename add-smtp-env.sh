#!/bin/bash

# Script to add SMTP environment variables to Vercel
# Run this script and it will prompt you to enter values for each variable

echo "Adding SMTP environment variables to Vercel..."
echo "You'll be prompted to enter the value for each variable."
echo ""

# Add SMTP_HOST
echo "Adding SMTP_HOST..."
vercel env add SMTP_HOST production

# Add SMTP_PORT
echo "Adding SMTP_PORT..."
vercel env add SMTP_PORT production

# Add SMTP_USER
echo "Adding SMTP_USER..."
vercel env add SMTP_USER production

# Add SMTP_PASSWORD
echo "Adding SMTP_PASSWORD..."
vercel env add SMTP_PASSWORD production

# Add SMTP_FROM_EMAIL
echo "Adding SMTP_FROM_EMAIL..."
vercel env add SMTP_FROM_EMAIL production

echo ""
echo "✅ All SMTP environment variables added!"
echo ""
echo "To also add them to preview/development environments, run:"
echo "  vercel env add SMTP_HOST preview"
echo "  vercel env add SMTP_HOST development"
echo "(and repeat for other variables)"


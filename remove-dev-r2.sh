#!/bin/bash

# Script to remove R2 environment variables from Development environment
# This keeps only Production and Preview environments

echo "Removing R2 environment variables from Development environment..."
echo "This will keep Production and Preview environments intact."
echo ""
read -p "Are you sure you want to remove Development R2 variables? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Removing R2 variables from Development..."

vercel env rm R2_BUCKET development
vercel env rm R2_ENDPOINT development
vercel env rm R2_ACCESS_KEY_ID development
vercel env rm R2_SECRET_ACCESS_KEY development
vercel env rm R2_PUBLIC_URL development

echo ""
echo "✅ Development R2 variables removed!"
echo ""
echo "Remaining R2 variables:"
vercel env ls | grep R2


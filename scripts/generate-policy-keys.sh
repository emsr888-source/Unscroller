#!/bin/bash

# Creator Mode - Policy Key Generation Script
# Generates RSA key pair for signing policies

set -e

echo "🔑 Creator Mode - Policy Key Generation"
echo "========================================"

# Create keys directory
KEYS_DIR="apps/backend/keys"
mkdir -p "$KEYS_DIR"

# Generate RSA private key (2048 bits)
echo "Generating RSA private key..."
openssl genrsa -out "$KEYS_DIR/policy-private.pem" 2048

# Extract public key
echo "Extracting public key..."
openssl rsa -in "$KEYS_DIR/policy-private.pem" \
  -pubout -out "$KEYS_DIR/policy-public.pem"

# Set proper permissions (private key should be restricted)
chmod 600 "$KEYS_DIR/policy-private.pem"
chmod 644 "$KEYS_DIR/policy-public.pem"

echo ""
echo "✅ Policy keys generated successfully!"
echo ""
echo "📁 Keys saved to:"
echo "   Private: $KEYS_DIR/policy-private.pem"
echo "   Public:  $KEYS_DIR/policy-public.pem"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Keep policy-private.pem SECRET (never commit to git)"
echo "   - Add to .gitignore (already configured)"
echo "   - Backup private key securely"
echo "   - Public key can be distributed to clients"
echo ""
echo "🔧 Next steps:"
echo "   1. Set POLICY_PRIVATE_KEY_PATH in .env"
echo "   2. Restart backend server"
echo "   3. Test policy endpoint: curl http://localhost:3000/api/policy"


#!/bin/bash

# AI-Powered Policy Update Script for Creator Mode
# This script demonstrates how the AI system can automatically update policies

echo "🤖 Creator Mode AI Policy Update System"
echo "======================================"

# Check if backend is running
if ! curl -s http://localhost:3000/api/ai/health > /dev/null; then
    echo "❌ Backend not running. Please start with: npm run start:dev"
    exit 1
fi

echo "✅ Backend is running"

# Show current policy stats
echo ""
echo "📊 Current Policy Statistics:"
curl -s http://localhost:3000/api/ai/policy-stats | jq -r '"   Platforms: \(.platforms | join(", "))"'

echo ""
echo "🔍 Testing AI URL Discovery for YouTube..."
echo "   (This may take a few moments as it crawls YouTube)"

# Test URL discovery
DISCOVERY_RESPONSE=$(curl -s "http://localhost:3000/api/ai/discover/youtube")

echo "   Discovered URLs: $(echo $DISCOVERY_RESPONSE | jq '.discoveredUrls')"
echo "   Sample URLs:"
echo $DISCOVERY_RESPONSE | jq -r '.urls[0:3][]' 2>/dev/null || echo "   (Crawling in progress...)"

echo ""
echo "🧠 Testing AI Pattern Analysis..."
echo "   Analyzing sample URLs to classify as distracting vs useful"

# Test pattern analysis with some sample URLs
cat > /tmp/test_urls.json << 'EOF'
{
  "urls": [
    "https://www.youtube.com/shorts/xyz123",
    "https://www.youtube.com/feed/subscriptions",
    "https://www.youtube.com/watch?v=abc123",
    "https://www.youtube.com/",
    "https://i.ytimg.com/vi/abc123/maxresdefault.jpg"
  ],
  "platform": "youtube"
}
EOF

ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d @/tmp/test_urls.json)

echo "   Analysis Results:"
echo $ANALYSIS_RESPONSE | jq -r '.analyses[] | "     \(.url): \(.category) (confidence: \(.confidence))"' 2>/dev/null || echo "   (Analysis in progress...)"

echo ""
echo "🔄 Testing Policy Update Generation..."
echo "   Generating update recommendations for YouTube"

# Test policy update (dry run)
UPDATE_RESPONSE=$(curl -s "http://localhost:3000/api/ai/update-policy/youtube?dryRun=true")

echo "   Update Preview:"
echo $UPDATE_RESPONSE | jq -r '"     New allow patterns: \(.update.newAllowPatterns | length)"' 2>/dev/null || echo "   (Update in progress...)"

echo ""
echo "📋 Available AI Endpoints:"
echo "   GET  /api/ai/health                    - System health check"
echo "   GET  /api/ai/discover/:platform        - Discover new URLs"
echo "   POST /api/ai/analyze                   - Analyze URL patterns"
echo "   POST /api/ai/update-policy/:platform   - Generate policy updates"
echo "   POST /api/ai/update-all-policies       - Update all platforms"
echo "   GET  /api/ai/policy-stats              - Policy statistics"

echo ""
echo "🎯 How the AI System Works:"
echo "   1. URL Discovery: Crawls platforms to find new endpoints"
echo "   2. Pattern Analysis: Classifies URLs as distracting vs useful"
echo "   3. Policy Updates: Generates recommendations automatically"
echo "   4. Auto-Updates: Applies changes with version control"

echo ""
echo "🚀 Your AI-powered Creator Mode is ready!"
echo "   The system will now automatically:"
echo "   • Monitor platform changes"
echo "   • Discover new distracting content"
echo "   • Update blocking rules"
echo "   • Maintain optimal content filtering"

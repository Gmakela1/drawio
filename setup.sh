#!/usr/bin/env bash
# setup.sh — Initialize the e-ai-designs project workspace
#
# Run this from the drawio repo root after cloning:
#   cd ~/vscode/drawio
#   bash setup.sh
#
# This creates the project workspace at ~/e-ai-designs/ by default.
# To use a different location:  bash setup.sh ~/my-other-path

set -e

PROJECTS_DIR="${1:-$HOME/e-ai-designs}"

echo "=== drawio AI Fork — Project Setup ==="
echo "Creating project workspace at: $PROJECTS_DIR"
echo ""

# Create directory structure
mkdir -p "$PROJECTS_DIR/diagrams"
mkdir -p "$PROJECTS_DIR/stencils"
mkdir -p "$PROJECTS_DIR/.pi/skills"

# Copy AI skills from the drawio repo
if [ -d ".pi/skills" ]; then
    cp -r .pi/skills/* "$PROJECTS_DIR/.pi/skills/"
    echo "✓ Skills copied from .pi/skills/"
else
    echo "⚠ No .pi/skills/ found in current directory"
fi

# Create pi settings
echo '{"skills":[".pi/skills"]}' > "$PROJECTS_DIR/.pi/settings.json"
echo "✓ pi settings created"

# Copy a sample diagram if one exists
if [ -f "diagrams/tractor-power.drawio" ]; then
    cp diagrams/tractor-power.drawio "$PROJECTS_DIR/diagrams/"
    echo "✓ Sample diagram copied"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start the server:  cd server && node server.js"
echo "  2. Open editor:       http://localhost:3000/editor"
echo "  3. AI workspace:      cd $PROJECTS_DIR && pi code"
echo ""
echo "To change the projects directory, set DRAWIO_PROJECTS_DIR:"
echo "  export DRAWIO_PROJECTS_DIR=/path/to/your/projects"
echo "  node server/server.js"
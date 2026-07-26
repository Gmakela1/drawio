#!/usr/bin/env bash
# setup.sh — Initialize the e-ai-designs project workspace
#
# Run this from the drawio repo root after cloning:
#   cd ~/vscode/drawio
#   bash setup.sh
#
# The e-ai-designs/ folder (with skills) is already in the repo.
# This script creates the user-specific directories that are gitignored:
#   diagrams/  — your .drawio files
#   stencils/  — custom component libraries

set -e

PROJECTS_DIR="${1:-$(pwd)/e-ai-designs}"

echo "=== drawio AI Fork -- Project Setup ==="
echo "Project workspace: $PROJECTS_DIR"
echo ""

# Create user-specific directories (gitignored, not in repo)
mkdir -p "$PROJECTS_DIR/diagrams"
mkdir -p "$PROJECTS_DIR/stencils"

# Copy a sample diagram if one exists at the old location
if [ -f "diagrams/tractor-power.drawio" ]; then
    cp diagrams/tractor-power.drawio "$PROJECTS_DIR/diagrams/"
    echo "OK Sample diagram copied"
fi

# Create .gitkeep so empty directories are tracked by git
touch "$PROJECTS_DIR/diagrams/.gitkeep"
touch "$PROJECTS_DIR/stencils/.gitkeep"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start the server:  cd server && node server.js"
echo "  2. Open editor:       http://localhost:3000/editor"
echo "  3. AI workspace:      cd $PROJECTS_DIR && pi code"
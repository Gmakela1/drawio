/**
 * Server configuration — points to the user's project directory.
 *
 * The server stores diagrams and stencils in the e-ai-designs folder
 * so the AI workspace (pi code) stays clean and focused.
 *
 * Override with the DRAWIO_PROJECTS_DIR environment variable:
 *   set DRAWIO_PROJECTS_DIR=C:/Users/makel/my-other-projects
 *   node server.js
 */
const path = require('path');

// Default: e-ai-designs is inside the drawio project folder
//   drawio/          ← this repo
//     e-ai-designs/  ← user projects, diagrams, skills
const DEFAULT_PROJECTS_DIR = path.join(__dirname, '..', '..', 'e-ai-designs');

const projectsDir = process.env.DRAWIO_PROJECTS_DIR || DEFAULT_PROJECTS_DIR;

module.exports = {
  diagramsDir: path.join(projectsDir, 'diagrams'),
  stencilsDir: path.join(projectsDir, 'stencils'),
  projectsDir,
};
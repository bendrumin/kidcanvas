const fs = require('fs');
const path = require('path');

// Create an HTML file that renders the logo
const logoHTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 100px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-icon {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: linear-gradient(135deg, #E91E63 0%, #9B59B6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(233, 30, 99, 0.3);
    }
    .logo-icon svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    .logo-text {
      font-size: 64px;
      font-weight: bold;
      background: linear-gradient(135deg, #E91E63 0%, #9B59B6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    <div class="logo-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
    <span class="logo-text">KidCanvas</span>
  </div>
</body>
</html>`;

// Write HTML file
const htmlPath = path.join(__dirname, '../public/logo-generator.html');
fs.writeFileSync(htmlPath, logoHTML);

console.log('Logo HTML generated at:', htmlPath);
console.log('Open this file in a browser and take a screenshot, or use a headless browser tool.');


const fs = require('fs');
const path = require('path');
const premPath = path.join(__dirname, '..', 'prem.json');

function loadPrem() {
  if (!fs.existsSync(premPath)) fs.writeFileSync(premPath, '[]');
  return JSON.parse(fs.readFileSync(premPath));
}

function isPremium(userId) {
  return loadPrem().includes(userId.toString());
}

module.exports = { isPremium };
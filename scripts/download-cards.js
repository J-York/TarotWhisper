const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://archive.org/download/rider-waite-small-jpeg';

// Major Arcana mapping: number -> filename on archive.org
const majorArcanaMap = {
  '00': 'fool',
  '01': 'magician',
  '02': 'priestess',
  '03': 'empress',
  '04': 'emperor',
  '05': 'hierophant',
  '06': 'lovers',
  '07': 'chariot',
  '08': 'strength',
  '09': 'hermit',
  '10': 'fortune',
  '11': 'justice',
  '12': 'hanged',
  '13': 'death',
  '14': 'temperance',
  '15': 'devil',
  '16': 'tower',
  '17': 'star',
  '18': 'moon',
  '19': 'sun',
  '20': 'judgement',
  '21': 'world'
};

// Minor Arcana number mapping
const minorNumberMap = {
  '01': 'ace',
  '02': '2',
  '03': '3',
  '04': '4',
  '05': '5',
  '06': '6',
  '07': '7',
  '08': '8',
  '09': '9',
  '10': '10',
  '11': 'page',
  '12': 'knight',
  '13': 'queen',
  '14': 'king'
};

const suits = ['wands', 'cups', 'swords', 'pentacles'];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function downloadMajorArcana() {
  console.log('Downloading Major Arcana...');
  const destDir = path.join(__dirname, '../public/cards/major');

  for (const [num, name] of Object.entries(majorArcanaMap)) {
    const url = `${BASE_URL}/major_arcana_${name}.jpeg`;
    const destPath = path.join(destDir, `${num}-${name === 'priestess' ? 'high-priestess' : name === 'fortune' ? 'wheel-of-fortune' : name === 'hanged' ? 'hanged-man' : name}.jpg`);

    try {
      console.log(`  Downloading ${num}-${name}...`);
      await downloadFile(url, destPath);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }
}

async function downloadMinorArcana() {
  console.log('Downloading Minor Arcana...');

  for (const suit of suits) {
    console.log(`  Suit: ${suit}`);
    const destDir = path.join(__dirname, `../public/cards/minor/${suit}`);

    for (const [num, name] of Object.entries(minorNumberMap)) {
      const url = `${BASE_URL}/minor_arcana_${suit}_${name}.jpeg`;
      const destPath = path.join(destDir, `${num}.jpg`);

      try {
        console.log(`    Downloading ${num} (${name})...`);
        await downloadFile(url, destPath);
      } catch (err) {
        console.error(`    Failed: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('Starting tarot card download from Internet Archive...');
  console.log('Source: Public Domain Rider-Waite-Smith deck (1909)');
  console.log('');

  await downloadMajorArcana();
  await downloadMinorArcana();

  console.log('');
  console.log('Download complete!');
}

main().catch(console.error);

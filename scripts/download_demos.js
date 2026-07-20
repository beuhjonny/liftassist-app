import fs from 'fs';
import path from 'path';

const PUBLIC_DEMOS_DIR = path.resolve('public/demos');

if (!fs.existsSync(PUBLIC_DEMOS_DIR)) {
  fs.mkdirSync(PUBLIC_DEMOS_DIR, { recursive: true });
}

async function run() {
  console.log('Fetching exercise repository list from GitHub API...');
  try {
    const res = await fetch('https://api.github.com/repos/yuhonas/free-exercise-db/contents/exercises', {
      headers: { 'User-Agent': 'NodeJS-Downloader' }
    });

    if (!res.ok) {
      console.error('Failed to query GitHub API:', res.statusText);
      return;
    }

    const items = await res.json();
    console.log(`Found ${items.length} exercise items in repository.`);

    let count = 0;
    for (const item of items) {
      if (item.type === 'dir') {
        const folderName = item.name;
        const normalizedName = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const targetPath = path.join(PUBLIC_DEMOS_DIR, `${normalizedName}.jpg`);

        if (fs.existsSync(targetPath)) {
          continue;
        }

        const imgUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folderName}/0.jpg`;
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            fs.writeFileSync(targetPath, buffer);
            count++;
            console.log(`[${count}] Saved ${normalizedName}.jpg`);
          }
        } catch (err) {
          console.warn(`Could not download ${folderName}:`, err);
        }
      }
    }

    console.log(`Download complete! ${count} new demo images saved to public/demos/`);
  } catch (err) {
    console.error('Download script failed:', err);
  }
}

run();

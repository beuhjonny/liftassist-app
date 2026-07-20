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

        const target0 = path.join(PUBLIC_DEMOS_DIR, `${normalizedName}_0.jpg`);
        const target1 = path.join(PUBLIC_DEMOS_DIR, `${normalizedName}_1.jpg`);

        // Download Frame 0 (Start Position)
        if (!fs.existsSync(target0)) {
          const imgUrl0 = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folderName}/0.jpg`;
          try {
            const imgRes0 = await fetch(imgUrl0);
            if (imgRes0.ok) {
              fs.writeFileSync(target0, Buffer.from(await imgRes0.arrayBuffer()));
            }
          } catch (e) {}
        }

        // Download Frame 1 (End Position / Peak Contraction)
        if (!fs.existsSync(target1)) {
          const imgUrl1 = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folderName}/1.jpg`;
          try {
            const imgRes1 = await fetch(imgUrl1);
            if (imgRes1.ok) {
              fs.writeFileSync(target1, Buffer.from(await imgRes1.arrayBuffer()));
              count++;
            }
          } catch (e) {}
        }

        if (count % 25 === 0 && count > 0) {
          console.log(`Downloaded ${count} exercise motion loops...`);
        }
      }
    }

    console.log(`Download complete! Both keyframes saved to public/demos/`);
  } catch (err) {
    console.error('Download script failed:', err);
  }
}

run();

import { onRequest } from 'firebase-functions/v2/https';

// Cloud Function proxy to fetch exercise GIFs server-side and stream them to the PWA
export const getExerciseDemo = onRequest({
  cors: true,
  maxInstances: 10,
  memory: '256MiB'
}, async (req, res) => {
  const rawName = (req.query.name as string) || '';
  if (!rawName) {
    res.status(400).send('Missing exercise name query parameter.');
    return;
  }

  const normalizedKey = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');

  // Server-side fallback source (bypasses browser hotlink checks)
  const targetUrl = `https://d205bpvrqc9yn1.cloudfront.net/${normalizedKey}.gif`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!upstreamRes.ok) {
      res.status(404).send('Demo not found.');
      return;
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (error) {
    console.error('Error in getExerciseDemo proxy:', error);
    res.status(500).send('Error fetching demo.');
  }
});

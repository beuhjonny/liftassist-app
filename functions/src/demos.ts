import { onRequest } from 'firebase-functions/v2/https';

// CloudFront ExerciseDB GIF IDs for standard strength exercises
const GIF_ID_MAP: Record<string, string> = {
  'bench_press': '0025',
  'incline_bench_press': '0314',
  'lateral_raise': '0334',
  'hammer_curl': '0306',
  'squat': '0043',
  'deadlift': '0032',
  'overhead_press': '0091',
  'lat_pulldown': '0150',
  'barbell_row': '0027',
  'bicep_curl': '0294',
  'tricep_pushdown': '0201',
  'leg_press': '0739',
  'rear_delt_fly': '0380',
  'cable_fly': '0171',
  'leg_extension': '0585',
  'leg_curl': '0596',
  'calf_raise': '0108',
  'dip': '0251'
};

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

  const key = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  let gifId = GIF_ID_MAP[key];

  if (!gifId) {
    if (key.includes('lateral') || key.includes('raise')) gifId = '0334';
    else if (key.includes('hammer')) gifId = '0306';
    else if (key.includes('incline')) gifId = '0314';
    else if (key.includes('bench') || key.includes('chest_press')) gifId = '0025';
    else if (key.includes('squat')) gifId = '0043';
    else if (key.includes('deadlift') || key.includes('rdl')) gifId = '0032';
    else if (key.includes('press') && (key.includes('shoulder') || key.includes('overhead') || key.includes('military'))) gifId = '0091';
    else if (key.includes('lat') || key.includes('pulldown')) gifId = '0150';
    else if (key.includes('row') || key.includes('helms')) gifId = '0027';
    else if (key.includes('curl')) gifId = '0294';
    else if (key.includes('tricep') || key.includes('pushdown') || key.includes('extension')) gifId = '0201';
    else if (key.includes('fly') || key.includes('rear_delt')) gifId = '0380';
    else if (key.includes('leg_extension')) gifId = '0585';
    else if (key.includes('leg_curl')) gifId = '0596';
    else if (key.includes('calf')) gifId = '0108';
    else if (key.includes('dip')) gifId = '0251';
  }

  if (!gifId) {
    res.status(404).send('Demo not found.');
    return;
  }

  const targetUrl = `https://d205bpvrqc9yn1.cloudfront.net/${gifId}.gif`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!upstreamRes.ok) {
      res.status(404).send('Demo image response not OK.');
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

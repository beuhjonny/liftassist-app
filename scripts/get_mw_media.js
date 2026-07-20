async function run() {
  const urls = [
    'https://api.musclewiki.com/api/v1/exercises/',
    'https://musclewiki.com/api/exercises/',
    'https://media.musclewiki.com/'
  ];

  for (const url of urls) {
    try {
      console.log('Testing endpoint:', url);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`Status for ${url}:`, res.status);
      if (res.ok) {
        const text = await res.text();
        console.log('Response snippet:', text.slice(0, 300));
      }
    } catch (e) {
      console.log('Error testing endpoint:', url, e.message);
    }
  }
}

run();

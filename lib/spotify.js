import fetch from 'node-fetch';

const client_id = 'acc6302297e040aeb6e4ac1fbdfd62c3';
const client_secret = '0e8439a1280a43aba9a5bc0a16f3f009';
const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

async function getAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' })
  });

  const json = await res.json();
  return json.access_token;
}

export const SpotifyAPI = async () => {
  const token = await getAccessToken();

  const fetcher = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return res.json();
  };

  return {
    trackSearch: (q) => fetcher(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`),
    getTracks: (id) => fetcher(`https://api.spotify.com/v1/tracks/${id}`),
    getPlaylistTracks: (playlistId) => fetcher(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`)
  };
};

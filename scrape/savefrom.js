const axios = require("axios");

async function savefrom(videoUrl) {
  const body = new URLSearchParams({
    sf_url: videoUrl,
    sf_submit: "",
    new: 2,
    lang: "id",
    app: "",
    country: "id",
    os: "Windows",
    browser: "Chrome",
    channel: " main",
    "sf-nomad": 1,
  });

  try {
    const { data } = await axios.post("https://worker.sf-tools.com/savefrom.php", body.toString(), {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://id.savefrom.net",
        referer: "https://id.savefrom.net/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36"
      }
    });

    console.log('Raw data from SaveFrom:', data);

    if (!data || !data.url) throw new Error("Invalid response from savefrom");

    return data;
  } catch (error) {
    console.error("Error in savefrom:", error.message);
    throw error;
  }
}
module.exports = { savefrom };
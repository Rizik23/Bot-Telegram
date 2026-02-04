function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pilihHadiah(hadiahPool) {
  const rand = Math.random();
  let cumulativeProbability = 0;
  for (const item of hadiahPool) {
    cumulativeProbability += item.probabilitas;
    if (rand <= cumulativeProbability) {
      return item;
    }
  }
  return hadiahPool[0]; // fallback
}

module.exports = { sleep, pilihHadiah };
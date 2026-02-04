const toRupiah = async (angka) => {
  return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const capital = (text) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

const tanggal = (ms) => {
  const date = new Date(ms);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = {
  toRupiah,
  capital,
  tanggal,
  generateRandomNumber,
};

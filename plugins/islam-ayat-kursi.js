module.exports = (bot) => {
  bot.command('ayatkursi', async (ctx) => {
    const caption = `
*「 Ayat Kursi 」*

اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ

“Allāhu Lā ilāha illā Huwa, Al-Ḥayyul-Qayyūm. Lā ta’khudhuhū sinatun wa lā nawm. Lahū mā fis-samāwāti wa mā fil-arḍ. Man dhalladhī yashfa’u ‘indahū illā bi-idhnih. Ya’lamu mā baina aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishai’im min ‘ilmihī illā bimā shā’a. Wasi’a kursiyyuhus-samāwāti wal-arḍ. Wa lā ya’ūduhū ḥifẓuhumā. Wa Huwal-‘Aliyyul-‘Aẓīm.”

📝 *Artinya:*
Allah, tidak ada Tuhan (yang berhak disembah) melainkan Dia Yang Hidup kekal lagi terus-menerus mengurus (makhluk-Nya); tidak mengantuk dan tidak tidur. Kepunyaan-Nya apa yang di langit dan di bumi. Tiada yang dapat memberi syafa'at di sisi Allah tanpa izin-Nya. 

Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.

📖 *(QS. Al-Baqarah: 255)*
    `.trim();

    await ctx.replyWithMarkdown(caption);
  });
};
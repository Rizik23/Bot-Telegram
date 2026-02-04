module.exports = (bot) => {
  bot.command('bacaansholat', async (ctx) => {
    const bacaanshalat = {
      result: [
        {
          id: 1,
          name: "Bacaan Iftitah",
          arabic: "اللَّهُ أَكْبَرُ كَبِيرًا ... وَأَنَا أَوَّلُ الْمُسْلِمِينَ",
          latin: "Alloohu akbar kabiirow wal hamdu lillaahi ... wa ana awwalul muslimiin",
          terjemahan: "Allah Maha Besar ... aku adalah orang yang pertama berserah diri"
        },
        {
          id: 2,
          name: "Al Fatihah",
          arabic: "بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ ... وَلَا الضَّالِّينَ",
          latin: "1. Bismillahirrahmanirrahim, 2. Alhamdulillahi rabbil alamin, ... 7. waladhaalin",
          terjemahan: "1. Dengan menyebut nama Allah ... bukan (pula jalan) mereka yang sesat"
        },
        {
          id: 3,
          name: "Bacaan Ruku",
          arabic: "(3x) سُبْحَانَ رَبِّيَ الْعَظِيْمِ وَبِحَمْدِهِ",
          latin: "Subhana Rabbiyal Adzimi Wabihamdih (3x)",
          terjemahan: "Maha Suci Tuhanku Yang Maha Agung Dan Dengan Memuji-Nya"
        },
        {
          id: 4,
          name: "Bacaan Sujud",
          arabic: "(3x) سُبْحَانَ رَبِّىَ الْأَعْلَى وَبِحَمْدِهِ",
          latin: "Subhaana robbiyal a'la wabihamdih (3x)",
          terjemahan: "Mahasuci Tuhanku yang Mahatinggi dan segala puji bagiNya"
        },
        {
          id: 5,
          name: "Duduk Diantara Dua Sujud",
          arabic: "رَبِّ اغْفِرْلِيْ وَارْحَمْنِيْ ... وَاعْفُ عَنِّيْ",
          latin: "Rabbighfirli Warhamni ... Wa'fuannii",
          terjemahan: "Ya Allah, ampunilah dosaku ... dan berilah ampunan kepadaku"
        },
        {
          id: 6,
          name: "Duduk Tasyahud Awal",
          arabic: "اَلتَّحِيَّاتُ الْمُبَارَكَاتُ ... مُحَمَّدٍ",
          latin: "Attahiyyaatul mubaarokaatush sholawaatuth ... Sayyidina Muhammad",
          terjemahan: "Segala penghormatan ... Ya Tuhan kami, selawatkanlah ke atas Nabi Muhammad"
        },
        {
          id: 7,
          name: "Duduk Tasyahud Akhir",
          arabic: "اَلتَّحِيَّاتُ ... حَمِيْدٌ مَجِيْدٌ",
          latin: "Attahiyyaatul mubaarokaatush sholawaatuth ... hamiidummajid",
          terjemahan: "Segala penghormatan ... Sesungguhnya Engkau Maha Terpuji lagi Maha Agung"
        },
        {
          id: 8,
          name: "Salam",
          arabic: "اَلسَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ",
          latin: "Assalamualaikum Warohmatullahi Wabarokatuh",
          terjemahan: "Semoga keselamatan, rohmat dan berkah ALLAH selalu tercurah untuk kamu sekalian."
        }
      ]
    };

    let text = `🕌 *Bacaan Sholat Lengkap:*\n\n`;
    for (const item of bacaanshalat.result) {
      text += `*${item.name}*\n📖 ${item.arabic}\n🔤 ${item.latin}\n📝 ${item.terjemahan}\n\n`;
    }

    await ctx.replyWithMarkdown(text.trim());
  });
};
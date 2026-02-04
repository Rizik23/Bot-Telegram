function safeHandler(fn) {
  return async (ctx, next) => {
    try {
      await fn(ctx, next);
    } catch (err) {
      console.error('[SAFE ERROR]', err);
      ctx.reply('Terjadi kesalahan. Coba lagi nanti!');
    }
  };
}

module.exports = safeHandler;

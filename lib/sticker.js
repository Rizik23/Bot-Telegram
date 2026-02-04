/**
 * Image/Video to Sticker (auto choose best available method)
 * @param {Buffer} img - Image/Video Buffer
 * @param {String} url - Image/Video URL
 * @param {String} packname - Sticker Packname
 * @param {String} author - Sticker Author
 * @param {...any} args - Additional EXIF metadata (categories, extra)
 */
async function sticker(img, url, packname = '', author = '', ...args) {
  let lastError, stiker
  const support = global.support || {
    ffmpeg: true,
    ffprobe: true,
    ffmpegWebp: true,
    convert: true,
    magick: false,
    gm: false,
    find: false
  }

  const methods = [
    sticker3,
    support.ffmpeg && sticker6,
    sticker5,
    support.ffmpeg && support.ffmpegWebp && sticker4,
    support.ffmpeg && (support.convert || support.magick || support.gm) && sticker2,
    sticker1
  ].filter(Boolean)

  for (let func of methods) {
    try {
      stiker = await func(img, url, packname, author, ...args)

      if (!Buffer.isBuffer(stiker)) {
        if (typeof stiker === 'string' && stiker.includes('html')) continue
        throw stiker.toString()
      }

      if (stiker.toString('hex').includes('57454250')) { // "WEBP"
        try {
          return await addExif(stiker, packname, author, ...args)
        } catch (e) {
          console.error('addExif failed:', e)
          return stiker
        }
      }

      return stiker
    } catch (err) {
      lastError = err
      continue
    }
  }

  console.error('All sticker methods failed:', lastError)
  return lastError
}
export { sticker }
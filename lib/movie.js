const { cmd } = require("../command");
const axios = require("axios");
const NodeCache = require("node-cache");

// Cache setup
const movieCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const theme = {
  header: "🔍 *𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳 cinema*\n━━━━━━━━━━━━━━━━━━\n",
  footer: "\n━━━━━━━━━━━━━━━━━━\n⚡ Powered by 𝙳𝙰𝚁𝙺-𝙺𝙽𝙸𝙶𝙷𝚃-𝚇𝙼𝙳",
  box: (title, content) => `📑 *${title}*\n\n${content}${theme.footer}`,
  emojis: ["🔸", "🎥", "📥", "🎞️", "📦", "⏬"]
};

cmd({
  pattern: "sinhalasub",
  alias: ["sb"],
  desc: "Search Sinhala-subbed movies and download",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
  if (!q) {
    return await conn.sendMessage(from, {
      text: theme.box("Usage", "Use `.sinhalasub <movie name>` to search Sinhala-subbed films.\nEg: `.sinhalasub new`"),
    }, { quoted: mek });
  }

  try {
    const cacheKey = `movie_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://suhas-bro-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
      const response = await axios.get(url);
      data = response.data;

      if (!data.status || !data.result.data || data.result.data.length === 0) {
        throw new Error("❌ No movies found!");
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.result.data.map((m, i) => ({
      number: i + 1,
      title: m.title.replace(/Sinhala Subtitles.*$/, "").trim(),
      link: m.link
    }));

    let replyText = `${theme.header}`;
    movieList.forEach(m => {
      replyText += `${theme.emojis[0]} ${m.number}. *${m.title}*\n`;
    });
    replyText += `\n🔢 Reply with a movie number to get download links`;

    const sentMsg = await conn.sendMessage(from, { text: theme.box("Search Results", replyText) }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        await conn.sendMessage(from, { text: theme.box("Cancelled", "Search cancelled.") }, { quoted: msg });
        return;
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);

        if (!selected) {
          return await conn.sendMessage(from, { text: theme.box("Invalid", "Invalid movie number.") }, { quoted: msg });
        }

        const fetchURL = `https://suhas-bro-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(selected.link)}`;
        const res = await axios.get(fetchURL);

        const result = res.data.result.data;
        const links = result.pixeldrain_dl || [];

        if (!links.length) {
          return await conn.sendMessage(from, {
            text: theme.box("Unavailable", "No download links found for this movie.")
          }, { quoted: msg });
        }

        let linkText = `🎬 *${selected.title}*\n\n`;
        links.forEach((l, i) => {
          linkText += `${theme.emojis[2]} ${i + 1}. *${l.quality}* (${l.size})\n`;
        });
        linkText += `\n📥 Reply with quality number to get download`;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: result.image || "https://i.ibb.co/dw3rSBwN/6200.jpg" },
          caption: theme.box("Download Options", linkText)
        }, { quoted: msg });

        movieMap.set(downloadMsg.key.id, { selected, links });
      } else if (movieMap.has(repliedId)) {
        const { selected, links } = movieMap.get(repliedId);
        const choice = parseInt(replyText);
        const chosen = links[choice - 1];

        if (!chosen) {
          return await conn.sendMessage(from, {
            text: theme.box("Invalid", "Invalid quality number.")
          }, { quoted: msg });
        }

        const sizeGB = chosen.size.toLowerCase().includes("gb")
          ? parseFloat(chosen.size.toLowerCase().replace("gb", ""))
          : parseFloat(chosen.size.toLowerCase().replace("mb", "")) / 1024;

        if (sizeGB > 2) {
          return await conn.sendMessage(from, {
            text: theme.box("Large File", `File too large (${chosen.size})\nDirect Link: ${chosen.link}`)
          }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: theme.box("📽️ your movie!", `🎬 ${selected.title}\n⏳ Quality: ${chosen.quality}\n🗃️ Size: ${chosen.size}`)
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    console.log("movie error:", err.message);
    await conn.sendMessage(from, {
      text: theme.box("Error", `An error occurred!\n\n${err.message || "Try again later."}`)
    }, { quoted: mek });
  }
});


cmd({
  pattern: "sinhalasub2",
  alias: ["sb2"],
  desc: "Search Sinhala-subbed movies and download",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
  if (!q) {
    return await conn.sendMessage(from, {
      text: theme.box("Usage", "Use `.sinhalasub2 <movie name>` to search Sinhala-subbed films.\nEg: `.sinhalasub2 new`"),
    }, { quoted: mek });
  }

  try {
    const cacheKey = `movie_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://www.dark-yasiya-api.site/movie/sinhalasub/search?text=${encodeURIComponent(q)}`;
      const response = await axios.get(url);
      data = response.data;

      if (!data.status || !data.result.data || data.result.data.length === 0) {
        throw new Error("❌ No movies found!");
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.result.data.map((m, i) => ({
      number: i + 1,
      title: m.title.replace(/Sinhala Subtitles.*$/, "").trim(),
      link: m.link
    }));

    let replyText = `${theme.header}`;
    movieList.forEach(m => {
      replyText += `${theme.emojis[0]} ${m.number}. *${m.title}*\n`;
    });
    replyText += `\n🔢 Reply with a movie number to get download links`;

    const sentMsg = await conn.sendMessage(from, { text: theme.box("Search Results", replyText) }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        await conn.sendMessage(from, { text: theme.box("Cancelled", "Search cancelled.") }, { quoted: msg });
        return;
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);

        if (!selected) {
          return await conn.sendMessage(from, { text: theme.box("Invalid", "Invalid movie number.") }, { quoted: msg });
        }

        const fetchURL = `https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(selected.link)}`;
        const res = await axios.get(fetchURL);

        const result = res.data.result.data;
        const links = result.dl_links || [];

        if (!links.length) {
          return await conn.sendMessage(from, {
            text: theme.box("Unavailable", "No download links found for this movie.")
          }, { quoted: msg });
        }

        let linkText = `🎬 *${selected.title}*\n\n`;
        links.forEach((l, i) => {
          linkText += `${theme.emojis[2]} ${i + 1}. *${l.quality}* (${l.size})\n`;
        });
        linkText += `\n📥 Reply with quality number to get download`;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: result.image || "https://i.ibb.co/dw3rSBwN/6200.jpg" },
          caption: theme.box("Download Options", linkText)
        }, { quoted: msg });

        movieMap.set(downloadMsg.key.id, { selected, links });
      } else if (movieMap.has(repliedId)) {
        const { selected, links } = movieMap.get(repliedId);
        const choice = parseInt(replyText);
        const chosen = links[choice - 1];

        if (!chosen) {
          return await conn.sendMessage(from, {
            text: theme.box("Invalid", "Invalid quality number.")
          }, { quoted: msg });
        }

        const sizeGB = chosen.size.toLowerCase().includes("gb")
          ? parseFloat(chosen.size.toLowerCase().replace("gb", ""))
          : parseFloat(chosen.size.toLowerCase().replace("mb", "")) / 1024;

        if (sizeGB > 2) {
          return await conn.sendMessage(from, {
            text: theme.box("Large File", `File too large (${chosen.size})\nDirect Link: ${chosen.link}`)
          }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: theme.box("your movie!", `🎬 ${selected.title}\n⏳ Quality: ${chosen.quality}\n🗃️ Size: ${chosen.size}`)
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    console.log("movie error:", err.message);
    await conn.sendMessage(from, {
      text: theme.box("Error", `An error occurred!\n\n${err.message || "Try again later."}`)
    }, { quoted: mek });
  }
});


cmd({
  pattern: "pirate",
  desc: "Search Sinhala-subbed movies and download",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
  if (!q) {
    return await conn.sendMessage(from, {
      text: theme.box("Usage", "Use `.pirate <movie name>` to search Sinhala-subbed films.\nEg: `.pirate new`"),
    }, { quoted: mek });
  }

  try {
    const cacheKey = `movie_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://suhas-bro-api.vercel.app/movie/pirate/search?text=${encodeURIComponent(q)}`;
      const response = await axios.get(url);
      data = response.data;

      if (!data.status || !data.result.data || data.result.data.length === 0) {
        throw new Error("❌ No movies found!");
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.result.data.map((m, i) => ({
      number: i + 1,
      title: m.title.replace(/Sinhala Subtitles.*$/, "").trim(),
      link: m.link
    }));

    let replyText = `${theme.header}`;
    movieList.forEach(m => {
      replyText += `${theme.emojis[0]} ${m.number}. *${m.title}*\n`;
    });
    replyText += `\n🔢 Reply with a movie number to get download links`;

    const sentMsg = await conn.sendMessage(from, { text: theme.box("Search Results", replyText) }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        await conn.sendMessage(from, { text: theme.box("Cancelled", "Search cancelled.") }, { quoted: msg });
        return;
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);

        if (!selected) {
          return await conn.sendMessage(from, { text: theme.box("Invalid", "Invalid movie number.") }, { quoted: msg });
        }

        const fetchURL = `https://suhas-bro-api.vercel.app/movie/pirate/movie?url=${encodeURIComponent(selected.link)}`;
        const res = await axios.get(fetchURL);

        const result = res.data.result.data;
        const links = result.dl_links || [];

        if (!links.length) {
          return await conn.sendMessage(from, {
            text: theme.box("Unavailable", "No download links found for this movie.")
          }, { quoted: msg });
        }

        let linkText = `🎬 *${selected.title}*\n\n`;
        links.forEach((l, i) => {
          linkText += `${theme.emojis[2]} ${i + 1}. *${l.quality}* (${l.size})\n`;
        });
        linkText += `\n📥 Reply with quality number to get download`;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: result.image || "https://i.ibb.co/dw3rSBwN/6200.jpg" },
          caption: theme.box("Download Options", linkText)
        }, { quoted: msg });

        movieMap.set(downloadMsg.key.id, { selected, links });
      } else if (movieMap.has(repliedId)) {
        const { selected, links } = movieMap.get(repliedId);
        const choice = parseInt(replyText);
        const chosen = links[choice - 1];

        if (!chosen) {
          return await conn.sendMessage(from, {
            text: theme.box("Invalid", "Invalid quality number.")
          }, { quoted: msg });
        }

        const sizeGB = chosen.size.toLowerCase().includes("gb")
          ? parseFloat(chosen.size.toLowerCase().replace("gb", ""))
          : parseFloat(chosen.size.toLowerCase().replace("mb", "")) / 1024;

        if (sizeGB > 2) {
          return await conn.sendMessage(from, {
            text: theme.box("Large File", `File too large (${chosen.size})\nDirect Link: ${chosen.link}`)
          }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: theme.box("your movie!", `🎬 ${selected.title}\n⏳ Quality: ${chosen.quality}\n🗃️ Size: ${chosen.size}`)
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    console.log("movie error:", err.message);
    await conn.sendMessage(from, {
      text: theme.box("Error", `An error occurred!\n\n${err.message || "Try again later."}`)
    }, { quoted: mek });
  }
});


cmd({
  pattern: "pirate2",
  desc: "Search Sinhala-subbed movies and download",
  category: "media",
  react: "🎬",
  filename: __filename
}, async (conn, mek, m, { from, q, args }) => {
  if (!q) {
    return await conn.sendMessage(from, {
      text: theme.box("Usage", "Use `.pirate2 <movie name>` to search Sinhala-subbed films.\nEg: `.pirate2 new`"),
    }, { quoted: mek });
  }

  try {
    const cacheKey = `movie_${q.toLowerCase()}`;
    let data = movieCache.get(cacheKey);

    if (!data) {
      const url = `https://www.dark-yasiya-api.site/movie/pirate/search?text=${encodeURIComponent(q)}`;
      const response = await axios.get(url);
      data = response.data;

      if (!data.status || !data.result.data || data.result.data.length === 0) {
        throw new Error("❌ No movies found!");
      }

      movieCache.set(cacheKey, data);
    }

    const movieList = data.result.data.map((m, i) => ({
      number: i + 1,
      title: m.title.replace(/Sinhala Subtitles.*$/, "").trim(),
      link: m.link
    }));

    let replyText = `${theme.header}`;
    movieList.forEach(m => {
      replyText += `${theme.emojis[0]} ${m.number}. *${m.title}*\n`;
    });
    replyText += `\n🔢 Reply with a movie number to get download links`;

    const sentMsg = await conn.sendMessage(from, { text: theme.box("Search Results", replyText) }, { quoted: mek });

    const movieMap = new Map();

    const listener = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const replyText = msg.message.extendedTextMessage.text.trim();
      const repliedId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", listener);
        await conn.sendMessage(from, { text: theme.box("Cancelled", "Search cancelled.") }, { quoted: msg });
        return;
      }

      if (repliedId === sentMsg.key.id) {
        const num = parseInt(replyText);
        const selected = movieList.find(m => m.number === num);

        if (!selected) {
          return await conn.sendMessage(from, { text: theme.box("Invalid", "Invalid movie number.") }, { quoted: msg });
        }

        const fetchURL = `https://www.dark-yasiya-api.site/movie/pirate/movie?url=${encodeURIComponent(selected.link)}`;
        const res = await axios.get(fetchURL);

        const result = res.data.result.data;
        const links = result.dl_links || [];

        if (!links.length) {
          return await conn.sendMessage(from, {
            text: theme.box("Unavailable", "No download links found for this movie.")
          }, { quoted: msg });
        }

        let linkText = `🎬 *${selected.title}*\n\n`;
        links.forEach((l, i) => {
          linkText += `${theme.emojis[2]} ${i + 1}. *${l.quality}* (${l.size})\n`;
        });
        linkText += `\n📥 Reply with quality number to get download`;

        const downloadMsg = await conn.sendMessage(from, {
          image: { url: result.image || "https://i.ibb.co/dw3rSBwN/6200.jpg" },
          caption: theme.box("Download Options", linkText)
        }, { quoted: msg });

        movieMap.set(downloadMsg.key.id, { selected, links });
      } else if (movieMap.has(repliedId)) {
        const { selected, links } = movieMap.get(repliedId);
        const choice = parseInt(replyText);
        const chosen = links[choice - 1];

        if (!chosen) {
          return await conn.sendMessage(from, {
            text: theme.box("Invalid", "Invalid quality number.")
          }, { quoted: msg });
        }

        const sizeGB = chosen.size.toLowerCase().includes("gb")
          ? parseFloat(chosen.size.toLowerCase().replace("gb", ""))
          : parseFloat(chosen.size.toLowerCase().replace("mb", "")) / 1024;

        if (sizeGB > 2) {
          return await conn.sendMessage(from, {
            text: theme.box("Large File", `File too large (${chosen.size})\nDirect Link: ${chosen.link}`)
          }, { quoted: msg });
        }

        await conn.sendMessage(from, {
          document: { url: chosen.link },
          mimetype: "video/mp4",
          fileName: `${selected.title} - ${chosen.quality}.mp4`,
          caption: theme.box("your movie!", `🎬 ${selected.title}\n⏳ Quality: ${chosen.quality}\n🗃️ Size: ${chosen.size}`)
        }, { quoted: msg });
      }
    };

    conn.ev.on("messages.upsert", listener);

  } catch (err) {
    console.log("movie error:", err.message);
    await conn.sendMessage(from, {
      text: theme.box("Error", `An error occurred!\n\n${err.message || "Try again later."}`)
    }, { quoted: mek });
  }
});

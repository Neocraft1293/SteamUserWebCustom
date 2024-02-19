const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const config = require('./config.json');

const app = express();
const port = 3058;

// Execution du script steamrecup.js au démarrage du serveur
exec('node steamrecup.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });

  // Récupère les données du fichier steam_profile.json
const getSteamProfileData = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('steam_profile.json', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
// Execution du script steamrecup2.js au démarrage du serveur
exec('node steamrecup2.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });







// Formate le temps de jeu en heures et minutes
const formatPlaytime = (playtime) => {
  const hours = Math.floor(playtime / 60);
  const minutes = playtime % 60;
  return `${hours}h ${minutes}m`;
};

app.get('/', async (req, res) => {
    try {
      const profileData = await getSteamProfileData();
      const ownedGames = profileData.ownedGames;
      const totalPlaytime = ownedGames.reduce((acc, game) => acc + game.playtime_forever, 0);
      const windowsPlaytime = ownedGames.reduce((acc, game) => acc + (game.playtime_windows_forever || 0), 0);
      const macPlaytime = ownedGames.reduce((acc, game) => acc + (game.playtime_mac_forever || 0), 0);
      const linuxPlaytime = ownedGames.reduce((acc, game) => acc + (game.playtime_linux_forever || 0), 0);
  
      // Get the current date and time in the user's timezone
      const userDate = new Date().toLocaleString(undefined, { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  
      const html = `
        <html>
          <head>
            <title>Steam Profile ${profileData.personaname}</title>
          </head>
          <body>
            <h1>Steam Profile ${profileData.personaname}</h1>
            <p><img src="${profileData.avatarfull}" alt="Avatar"></p>
            <p>- Steam ID: ${profileData.steamid}</p>
            <p>- Pays: ${profileData.loccountrycode}</p>
            <p>- Dernière mise à jour: ${userDate}</p>
            <p>- Temps de jeu total: ${formatPlaytime(totalPlaytime)}</p>
            <p>- Temps de jeu sur Windows: ${formatPlaytime(windowsPlaytime)}</p>
            <p>- Temps de jeu sur Linux: ${formatPlaytime(linuxPlaytime)}</p>
            <p><a href="${profileData.profileurl}" target="_blank"><button>Visit Profile</button></a></p>
            <h2>Owned Games:</h2>
            <ul>
              ${ownedGames.map(game => `
                <li>
                  <img src="http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg" alt="${game.name}">
                  ${game.name}
                  <br>Temps de jeu total: ${formatPlaytime(game.playtime_forever)}
                  <br>Temps de jeu sur Windows: ${formatPlaytime(game.playtime_windows_forever || 0)}
                  <br>Temps de jeu sur Linux: ${formatPlaytime(game.playtime_linux_forever || 0)}
                </li>
              `).join('')}
            </ul>
          </body>
        </html>
      `;
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error retrieving Steam profile data');
    }
  });
  
  
  app.get('/refresh', async (req, res) => {
    const token = req.query.token; // Récupère le token depuis l'URL
    if (token !== config.tokenrefresh) {
      res.status(401).send('Invalid token');
      return;
    } else {
        exec('node steamrecup.js', (err, stdout, stderr) => {
            if (err) {
              console.error(err);
              return;
            }
            console.log(stdout);
          });
          const html = `
          <html>
            <head>
              <title>Steam Profile</title>
            </head>
            <body>
              <h1>Steam Profile</h1>
              <p>refresh fait</p>
              <p><a href="/" target="_blank"><button>Visit Profile</button></a></p>
            </body>
          </html>
        `;
        res.send(html);
    }

  });
  

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const axios = require('axios');
const fs = require('fs');

const config = require('./config.json');
const STEAM_API_KEY = config.token;
const STEAM_ID = config.steamId;

// Fonction pour récupérer les données du profil Steam
const getSteamProfileData = async () => {
  try {
    const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`);
    const profileData = response.data.response.players[0];
    const ownedGamesResponse = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1`);
    const ownedGamesData = ownedGamesResponse.data.response;
    profileData.ownedGames = ownedGamesData.games;

    // Récupérer le temps de jeu total
    const totalTimeResponse = await axios.get(`http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}`);
    const totalTimeData = totalTimeResponse.data.response;
    const totalTime = totalTimeData.games.reduce((acc, game) => acc + game.playtime_forever, 0);
    profileData.total_playtime = {
      date: new Date().toISOString(),
      total: totalTime,
      windows: 0,
      linux: 0
    };

    // Calculer le temps de jeu pour chaque plate-forme
    profileData.ownedGames.forEach((game) => {
      if (game.playtime_windows_forever) {
        profileData.total_playtime.windows += game.playtime_windows_forever;
      }
      if (game.playtime_linux_forever) {
        profileData.total_playtime.linux += game.playtime_linux_forever;
      }
    });

    return profileData;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Fonction pour enregistrer les données du profil Steam dans un fichier JSON
const saveSteamProfileDataToJSON = async () => {
  try {
    let steamProfileData = {};
    try {
      // Essayez de lire les données existantes du fichier JSON
      const existingData = fs.readFileSync('steam_profile_data.json', 'utf8');
      steamProfileData = JSON.parse(existingData);
    } catch (error) {
      // Si le fichier n'existe pas ou s'il y a une erreur de lecture, continuez avec un objet vide
      console.log("Fichier steam_profile_data.json non trouvé ou illisible. Création d'un nouveau fichier.");
    }

    const profileData = await getSteamProfileData();
    const currentDate = new Date().toISOString();

    steamProfileData.user = {
      name: profileData.personaname,
      avatar: profileData.avatar,
      steamid: profileData.steamid,
      totalPlaytime: {
        ...steamProfileData.user?.totalPlaytime,
        [currentDate]: {
          total: profileData.total_playtime.total || 0,
          windows: profileData.total_playtime.windows || 0,
          linux: profileData.total_playtime.linux || 0
        }
      }
    };

    // Si les données des jeux existent déjà dans le fichier, conservez-les
    if (steamProfileData.games) {
      profileData.ownedGames.forEach((game) => {
        const gameId = game.appid;
        if (steamProfileData.games[gameId]) {
          steamProfileData.games[gameId].gametime[currentDate] = {
            playtime_forever: game.playtime_forever,
            windowsPlaytime: game.playtime_windows_forever,
            linuxPlaytime: game.playtime_linux_forever
          };
        } else {
          steamProfileData.games[gameId] = {
            name: game.name,
            img_icon_url: `http://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${gameId}/${game.img_icon_url}.jpg`,
            gametime: {
              [currentDate]: {
                playtime_forever: game.playtime_forever,
                windowsPlaytime: game.playtime_windows_forever,
                linuxPlaytime: game.playtime_linux_forever
              }
            }
          };
        }
      });
    } else {
      steamProfileData.games = {};
      profileData.ownedGames.forEach((game) => {
        const gameId = game.appid;
        steamProfileData.games[gameId] = {
          name: game.name,
          img_icon_url: `http://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${gameId}/${game.img_icon_url}.jpg`,
          gametime: {
            [currentDate]: {
              playtime_forever: game.playtime_forever,
              windowsPlaytime: game.playtime_windows_forever,
              linuxPlaytime: game.playtime_linux_forever
            }
          }
        };
      });
    }

    fs.writeFile('steam_profile_data.json', JSON.stringify(steamProfileData), (err) => {
      if (err) {
        console.error(err);
        throw err;
      } else {
        console.log('Données du profil Steam mises à jour et enregistrées dans steam_profile_data.json');
      }
    });
  } catch (error) {
    console.error("Une erreur s'est produite lors de la mise à jour des données du profil Steam:", error);
    throw error;
  }
};

// Appel de la fonction saveSteamProfileDataToJSON
saveSteamProfileDataToJSON();

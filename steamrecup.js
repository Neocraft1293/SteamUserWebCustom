const axios = require('axios');
const fs = require('fs');

const config = require('./config.json');
const STEAM_API_KEY = config.token;
const STEAM_ID = config.steamId;

const getSteamProfileData = async () => {
  try {
    const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${STEAM_ID}`);
    const profileData = response.data.response.players[0];
    const ownedGamesResponse = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1`);
    const ownedGamesData = ownedGamesResponse.data.response;
    profileData.ownedGames = ownedGamesData.games;
    profileData.lastUpdated = new Date().toISOString();
    return profileData;
  } catch (error) {
    console.error(error);
  }
};

const saveSteamProfileData = async () => {
  const profileData = await getSteamProfileData();
  fs.writeFile('steam_profile.json', JSON.stringify(profileData), (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Steam profile data saved to steam_profile.json');
    }
  });
};

saveSteamProfileData();

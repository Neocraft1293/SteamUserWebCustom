const express = require('express');
const fs = require('fs');
const app = express();
const Chart = require('chart.js');

// Définir une route pour afficher la page web avec le graphique
app.get('/', (req, res) => {
    // Lire les données de jeu à partir du fichier JSON
    fs.readFile('steam_profile_data.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Une erreur s'est produite lors de la lecture du fichier JSON:", err);
            res.status(500).send('Erreur lors de la lecture des données.');
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            const { games } = jsonData;

            const currentDate = new Date();
            let closestDate = null;

            // Trouver la date de jeu la plus proche de la date actuelle
            for (const gameId in games) {
                if (Object.hasOwnProperty.call(games, gameId)) {
                    const game = games[gameId];
                    for (const dateStr in game.gametime) {
                        const date = new Date(dateStr);
                        if (!closestDate || Math.abs(date - currentDate) < Math.abs(closestDate - currentDate)) {
                            closestDate = date;
                        }
                    }
                }
            }
            //la varibale de la date la plus proche est declarée avec la variable closestDate
            

            if (!closestDate) {
                res.status(500).send('Aucune donnée de temps de jeu disponible.');
                return;
            }
            else{
                console.log("La date la plus proche est: ", closestDate);
            }   

            let jeuLabels = [];
            let tempsJeuWindows = [];
            let tempsJeuLinux = [];

            // Extraire les temps de jeu correspondants à la date la plus proche
            for (const gameId in games) {
                if (Object.hasOwnProperty.call(games, gameId)) {
                    const game = games[gameId];
                    const gameTime = game.gametime[closestDate.toISOString()];
                    if (gameTime && (gameTime.windowsPlaytime + gameTime.linuxPlaytime > 0)) { 
                        jeuLabels.push(game.name);
                        tempsJeuWindows.push(gameTime.windowsPlaytime / 60); // Convertir en heures
                        tempsJeuLinux.push(gameTime.linuxPlaytime / 60); // Convertir en heures
                    }
                }
            }

            // Combiner les temps de jeu Windows et Linux pour obtenir le temps total de jeu
            const tempsJeuTotal = tempsJeuWindows.map((value, index) => value + tempsJeuLinux[index]);

            // Trier les jeux par temps de jeu total
            const sortedIndexes = tempsJeuTotal.map((value, index) => index).sort((a, b) => tempsJeuTotal[b] - tempsJeuTotal[a]);
            jeuLabels = sortedIndexes.map(index => jeuLabels[index]);
            tempsJeuWindows = sortedIndexes.map(index => tempsJeuWindows[index]);
            tempsJeuLinux = sortedIndexes.map(index => tempsJeuLinux[index]);

            // Créer un graphique
            const chart = createChart(jeuLabels, tempsJeuWindows, tempsJeuLinux);

            // Rendre une page HTML avec le graphique
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Comparaison du temps de jeu</title>
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body>
                    <h1>Comparaison du temps de jeu</h1>
                    <canvas id="myChart" width="800" height="400"></canvas>
                    <script>
                        ${chart}
                    </script>
                </body>
                </html>
            `);
        } catch (error) {
            console.error("Une erreur s'est produite lors de l'analyse des données JSON:", error);
            res.status(500).send('Erreur lors de l\'analyse des données JSON.');
        }
    });
});

// Fonction pour créer un graphique de comparaison des temps de jeu
function createChart(jeuLabels, tempsJeuWindows, tempsJeuLinux) {
    const data = {
        labels: jeuLabels,
        datasets: [{
            label: 'Temps de jeu sur Windows (heures)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            data: tempsJeuWindows,
        }, {
            label: 'Temps de jeu sur Linux (heures)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            data: tempsJeuLinux,
        }]
    };
    const config = {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };
    return `new Chart(document.getElementById('myChart').getContext('2d'), ${JSON.stringify(config)});`;
}

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

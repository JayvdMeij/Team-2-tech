# Matching Website
Project tech team 2 repo

## Inhoudsopgave
1. Projectbeschrijving
2. Doelen
3. Functies
4. Technologieën
5. Installatie

## Projectbeschrijving
De **Matching Website** helpt de gebruiker om andere gamers te vinden met vergelijkbare interesses, apparaten (mobiel of console) en beschikbaarheid, zodat ze samen kunnen spelen!

## Doelen
- Gebruiksvriendelijke matching website voor gamers.
- Integratie van voorkeuren om gebruikers te matchen.
- Profielen maken en bewerken.
- Gebruik van Node.js en MongoDB voor de back-end.

## Functies
- **Registratie en inloggen**
- **Zoekfunctionaliteit met filters**
- **Profielbeheer**
- **Matchmaking en vriendenlijst**

## Technologieën
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **API's**: Rawg API

## Installatie
1. Clone deze repo
2. Ga naar project folder:
3. Run command: npm install
4. Maak een .env bestand aan en plak hierin het volgende:
PORT=
MONGO_URI=
DB_NAME=
appName=
SESSION_SECRET=
RAWG_API_KEY=
4. Zet achter port bijvoorbeeld "3000"
5. Plak achter MONGO_URI jou link van je MondoDB cluster, deze ziet eruit als volgt:
mongodb+srv://<db_username>:<db_password>@clusternaaam.abcdefg.mongodb.net/
6. Plak achter DB_NAME de naam van je cluster
7. Zet achter SESSION_SECRET een willekeurige en geheime tekenreeks
8. Zet achter RAWG_API_KEY jou rawg api key deze kun je hier aanvragen:
https://rawg.io/apidocs

tijdelijk:
   <label for="gameSearch">Favorite games</label>
   <% if (user.favoriteGames && user.favoriteGames.length > 0) { %>
    <ul>
      <% user.favoriteGames.forEach(game => { %>
        <li><%= game.name, game.background_image %></li>
      <% }) %>
    </ul>
   <% } else { %>
    <p>No favorite games added yet.</p>
   <% } %>
        <div id="gameSearchField">
            <input type="text" id="gameSearch" placeholder="Search for games..." autocomplete="off" />
            <div id="searchResults"></div>
        </div>

        <div id="selectedGames"></div>
        <input type="hidden" name="favoriteGames" id="favoriteGamesInput" />

      </div>
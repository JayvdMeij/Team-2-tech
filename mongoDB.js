//In dit bestand alle functies zetten die nodig zijn om verbinging te maken met MongoDB.
//Hierin ook de functie die nodig is om een query te maken en opvragen naar MongoDB, zoals registreren en inloggen.

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function runGetStarted() {
  // uri uit .env
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    const database = client.db('sample_mflix');
    const movies = database.collection('movies');

    // Queries for a movie that has a title value of 'Back to the Future'
    const query = { title: 'Back to the Future' };
    const movie = await movies.findOne(query);
    console.log(movie);
  } finally {
    await client.close();
  }
}
runGetStarted().catch(console.dir);
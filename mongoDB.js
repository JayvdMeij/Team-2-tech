//In dit bestand alle functies zetten die nodig zijn om verbinging te maken met MongoDB.
//Hierin ook de functie die nodig is om een query te maken en opvragen naar MongoDB, zoals registreren en inloggen.

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('Locations');
    console.log("MongoDB verbonden");
  }
  return db;
}

module.exports = connectDB;

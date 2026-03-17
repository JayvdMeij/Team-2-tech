//In dit bestand alle functies zetten die nodig zijn om verbinging te maken met MongoDB.
//Hierin ook de functie die nodig is om een query te maken en opvragen naar MongoDB, zoals registreren en inloggen.

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME || 'GameMatch';

if (!uri) {
  throw new Error('MONGO_URI ontbreekt in je .env bestand.');
}

const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log(`MongoDB verbonden met database: ${dbName}`);
  }

  return db;
}

module.exports = connectDB;

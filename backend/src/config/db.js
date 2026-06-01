import mysql from 'mysql2/promise';

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

connection.connect((err) => {
  if (err) {
    console.error('DB 연결 실패:', err);
  } else {
    console.log('DB 연결 성공');
  }
});

export const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '비밀번호',
  database: 'your_db'
});

module.exports = connection;
require('dotenv').config();

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT
});

connection.connect((err) => {
  if (err) {
    console.error('❌ DB 연결 실패:', err);
  } else {
    console.log('✅ DB 연결 성공');
  }
});

// 카카오 디벨로퍼
const authRouter = require("./src/routes/authRouter");

app.use("/auth", authRouter);
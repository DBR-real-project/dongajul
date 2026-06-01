const db = require('../config/db');

// 이메일로 유저 찾기
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0]);
      }
    );
  });
};

// 회원가입
const createUser = (email, password_hash, nickname) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [email, password_hash, nickname],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

module.exports = { findUserByEmail, createUser };

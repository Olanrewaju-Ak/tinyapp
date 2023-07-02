//

/**
 * TinyUrl Generator
 * @returns tinyURl string
 */
const generateRandomString = function () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6; //because we want a 6char string
  let result = '';
  for (let i = 0; i < length; i++) {
    let index = Math.floor(Math.random() * characters.length);
    result += characters.charAt(index);
  }
  return result;
};

/**
 *
 * @param {*} email
 * @returns
 */
const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return;
};

/**
 * @param {*} id
 */
const urlsForUser = function (id, database) {
  let urls = {};
  for (const url in database) {
    if (database[url].userId === id) {
      urls[url] = database[url];
    }
  }
  return urls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};

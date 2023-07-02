const { assert } = require('chai');
const { getUserByEmail } = require('../helpers');

const testUsers = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedUserId = 'userRandomID';
    return assert.equal(expectedUserId, user.id);
  });
  it('should return undefined if the email is nonexistent in the database', function () {
    const user = getUserByEmail('random@yahoo.com', testUsers);
    const expectedUser = undefined;
    return assert.equal(expectedUser, user);
  });
});

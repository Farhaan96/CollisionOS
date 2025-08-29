module.exports = (socket, next) => {
  try {
    socket.userId = 'dev-user';
    socket.shopId = 'dev-shop';
    next();
  } catch (e) {
    next();
  }
};

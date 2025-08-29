function handleJobUpdates(socket, data) {
  socket.to(`shop_${socket.shopId}`).emit('job_update', data);
}

module.exports = { handleJobUpdates };

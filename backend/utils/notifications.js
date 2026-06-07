const Notification = require('../models/Notification');
const { sendNotificationToUser } = require('../socket/socketManager');

exports.createNotification = async (data, io) => {
  try {
    const notification = await Notification.create(data);
    const populated = await notification.populate('sender', 'name avatar');
    if (io) {
      sendNotificationToUser(io, data.recipient, populated);
    }
    return populated;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

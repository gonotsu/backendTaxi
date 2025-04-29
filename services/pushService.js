// services/pushService.js
const fetch = require('node-fetch');

const sendPushNotification = async(pushToken, title, body) => {
    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: pushToken,
            sound: 'default',
            title,
            body,
        }),
    });
};

module.exports = { sendPushNotification };
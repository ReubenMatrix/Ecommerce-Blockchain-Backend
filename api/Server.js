const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Redis client
const client2 = createClient({
    password: 'yD7nCBhoVssmLGhoNZ3wYGUQAIzjc1rt',
    socket: {
        host: 'redis-16271.c90.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 16271
    }
});

client2.connect()
  .then(() => console.log('Connected to Redis Cloud'))
  .catch(err => console.error('Error connecting to Redis:', err));

app.use(cors());
app.use(bodyParser.json());

// Twilio credentials
const accountSid = 'AC802fec99b3d95a9b0c020b18211c320c'; 
const authToken = '7cb5c2e201e0d1934c94e88f11f9a6f0';  
const twilioClient = twilio(accountSid, authToken);

// Endpoint to send WhatsApp messages
app.post('/send-whatsapp', (req, res) => {
    const { name, phone } = req.body;

    const messageBody = `Hello ${name}, thank you for using BlockBazaar! Your order will be shipped soon.`;

    twilioClient.messages
        .create({
            body: messageBody,
            from: 'whatsapp:+14155238886', 
            to: `whatsapp:${phone}`
        })
        .then(message => {
            console.log('Message sent:', message.sid);
            res.status(200).json({ success: true, sid: message.sid });
        })
        .catch(error => {
            console.error('Error sending WhatsApp message:', error);
            res.status(500).json({ success: false, error: error.message });
        });
});

// Endpoint to add payment details
app.post('/add-payment', async (req, res) => {
    const { userId, paymentDetails } = req.body;

    try {
        // Generate a unique key for this payment
        const paymentId = `payment:${Date.now()}`;
        
        // Create a key for the user's payments
        const userPaymentsKey = `user:${userId}:payments`;

        // Store the payment details
        await client2.hSet(paymentId, paymentDetails);

        // Add the payment ID to the user's list of payments
        await client2.lPush(userPaymentsKey, paymentId);

        res.status(200).json({ message: 'Payment details added successfully', paymentId });
    } catch (error) {
        console.error('Error adding payment details to Redis:', error);
        res.status(500).json({ error: 'Failed to add payment details' });
    }
});

// Endpoint to fetch payment history for a user
app.get('/user-payments/:userId', async (req, res) => {
    const userId = req.params.userId;
    const userPaymentsKey = `user:${userId}:payments`;

    try {
        // Get all payment IDs for the user
        const paymentIds = await client2.lRange(userPaymentsKey, 0, -1);

        // Fetch details for each payment
        const paymentDetails = await Promise.all(paymentIds.map(async (paymentId) => {
            const details = await client2.hGetAll(paymentId);
            return { paymentId, ...details };
        }));

        res.status(200).json(paymentDetails);
    } catch (error) {
        console.error('Error fetching user payments:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const twilio = require('twilio');
// const { createClient } = require('redis');


// const app = express();
// const port = process.env.PORT || 5000;



// const client2 = createClient({
//     password: 'yD7nCBhoVssmLGhoNZ3wYGUQAIzjc1rt',
//     socket: {
//         host: 'redis-16271.c90.us-east-1-3.ec2.redns.redis-cloud.com',
//         port: 16271
//     }
// });

// client2.connect()
//   .then(() => console.log('Connected to Redis Cloud'))

// app.use(cors());
// app.use(bodyParser.json());

// const accountSid = 'AC802fec99b3d95a9b0c020b18211c320c'; 
// const authToken = '7cb5c2e201e0d1934c94e88f11f9a6f0';  
// const client = twilio(accountSid, authToken);

// app.post('/send-whatsapp', (req, res) => {
//     const { name, phone } = req.body;

//     const messageBody = `Hello ${name}, thank you for using BlockBazaar! Your order will be shipped soon.`;

//     client.messages
//         .create({
//             body: messageBody,
//             from: 'whatsapp:+14155238886', 
//             to: `whatsapp:${phone}`
//         })
//         .then(message => {
//             console.log('Message sent:', message.sid);
//             res.status(200).json({ success: true, sid: message.sid });
//         })
//         .catch(error => {
//             console.error('Error sending WhatsApp message:', error);
//             res.status(500).json({ success: false, error: error.message });
//         });
// });


// app.post('/add-payment', async (req, res) => {
//   const { userId, paymentDetails } = req.body;

//   try {
//     // Generate a unique key for this payment
//     const paymentId = `payment:${Date.now()}`;
    
//     // Create a key for the user's payments
//     const userPaymentsKey = `user:${userId}:payments`;

//     // Store the payment details
//     await client2.hSet(paymentId, paymentDetails);

//     // Add the payment ID to the user's list of payments
//     await client2.lPush(userPaymentsKey, paymentId);

//     res.status(200).json({ message: 'Payment details added successfully', paymentId });
//   } catch (error) {
//     console.error('Error adding payment details to Redis:', error);
//     res.status(500).json({ error: 'Failed to add payment details' });
//   }
// });



// // In Server.js
// app.get('/user-payments/:userId', async (req, res) => {
//   const userId = req.params.userId;
//   const userPaymentsKey = `user:${userId}:payments`;

//   try {
//     // Get all payment IDs for the user
//     const paymentIds = await client2.lRange(userPaymentsKey, 0, -1);

//     // Fetch details for each payment
//     const paymentDetails = await Promise.all(paymentIds.map(async (paymentId) => {
//       const details = await client2.hGetAll(paymentId);
//       return { paymentId, ...details };
//     }));

//     res.status(200).json(paymentDetails);
//   } catch (error) {
//     console.error('Error fetching user payments:', error);
//     res.status(500).json({ error: 'Failed to fetch payment history' });
//   }
// });




// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

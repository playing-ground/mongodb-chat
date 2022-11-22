import { MongoClient } from 'mongodb'
import { Server } from 'socket.io'
import * as dotenv from 'dotenv'
dotenv.config()

// Connect to Mongo
const mongo = new MongoClient(process.env.MONGO_CONNECTION_STRING)

//Connect to Socket.io
const client = new Server({
  cors: {
    origin: '*',
  },
})

client.on('connection', async (socket) => {
  let chat = mongo.db('mongodbchat').collection('chats')

  console.log("I'm in...")

  // Create function to send status
  const sendStatus = (s) => {
    socket.emit('status', s)
  }

  // Get chats from Mongo collection
  try {
    const res = await chat.find().limit(100).sort({ _id: 1 }).toArray()
    socket.emit('output', res)
  } catch (err) {
    console.error(`Something went wrong: ${err}`)
  }

  // Handle input events
  socket.on('input', async (data) => {
    let name = data.name
    let message = data.message

    // Check for name and message
    if (name == '' || message == '') {
      // Send error status
      sendStatus('Please enter a name and message')
    } else {
      try {
        // Insert message
        await chat.insertOne({ name: name, message: message })
        client.emit('output', [data])

        // Send status object
        sendStatus({
          message: 'Message sent',
          clear: true,
        })
      } catch (err) {
        console.error(`Something went wrong: ${err}`)
      }
    }
  })
  // Handle clear
  socket.on('clear', async (data) => {
    // Remove all chats from collection
    await chat.deleteMany({})
    socket.emit('cleared')
  })
})

client.listen(3000)

console.log('Everything good so far')

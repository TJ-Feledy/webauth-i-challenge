const express = require('express')
const bcryptjs = require('bcryptjs')

const db = require('./data/dbConfig.js')

const server = express()

server.use(express.json())

server.get('/', (req, res) => {
  res.send('Server is up and running!')
})

server.post('/api/register', (req, res) => {
  let user = req.body

  user.password = bcryptjs.hashSync(user.password, 10)

  db('users').insert(user)
    .then(newUser => {
      res.status(201).json(newUser)
    })
    .catch(err => {
      res.status(500).json({ errorMessage: `${err}` })
    })
})

server.post('/api/login', (req, res) => {
  const { username, password } = req.body

  db(users).where({ username })
    .first()
    .then(user => {
      if (user && bcryptjs.compareSync(password, user.password)) {
        res.status(200).json({ message: 'Logged in' })
      }else {
        res.status(401).json({ message: 'You shall not pass!' })
      }
    })
    .catch(err => {
      res.status(500).json({ errorMessage: `${err}` })
    })
})



module.exports = server
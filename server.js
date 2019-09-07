const express = require('express')
const bcryptjs = require('bcryptjs')
const session = require('express-session')
const connectSessionKnex = require('connect-session-knex')

const db = require('./data/dbConfig.js')

const server = express()

const knexSessionStore = connectSessionKnex(session)

const sessionConfig = {
  name: 'cool stuff',
  secret: 'i am tired',
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false,
    httpOnly: true
  },
  resave: false,
  saveUninitialized: false,
  store: new knexSessionStore({
    knex: db,
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 1000 * 60 * 60
  })
}

server.use(express.json())
server.use(session(sessionConfig))

server.get('/', (req, res) => {
  res.send('Server is up and running!')
})

server.post('/api/register', (req, res) => {
  let user = req.body

  user.password = bcryptjs.hashSync(user.password, 10)

  db('users').insert(user)
    .then(ids => {
      req.session.user = user
      db('users').where({id: ids[0]})
      .then(newUser => {
        res.status(201).json(newUser)
      })
      .catch(err => {
        res.status(500).json({ errorMessage: `${err}` })
      })
    })
    .catch(err => {
      res.status(500).json({ errorMessage: `${err}` })
    })
})

server.post('/api/login', (req, res) => {
  const { username, password } = req.body

  db('users').where({ username })
    .first()
    .then(user => {
      if (user && bcryptjs.compareSync(password, user.password)) {
        req.session.user = user
        res.status(200).json({ message: 'Logged in' })
      }else {
        res.status(401).json({ message: 'You shall not pass!' })
      }
    })
    .catch(err => {
      res.status(500).json({ errorMessage: `${err}` })
    })
})

server.get('/api/users', restricted, (req, res) => {
  db('users').select('username')
    .then(users => {
      res.json(users)
    })
    .catch(err => {
      res.status(500).json({ errorMessage: `${err}` })
    })
})

// **********Custom middleware*************

function restricted(req, res, next) {
  const { user } = req.session

  if (req.session && user) {
    next()
  }else {
    res.status(401).json({ message: 'You shall not pass!' })
  }
}

module.exports = server
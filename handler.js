'use strict';

const serverless = require('serverless-http')
const express = require('express')
const app = express()
const AWS = require('aws-sdk')
const bodyParser = require('body-parser')

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;

if (IS_OFFLINE === 'true') {
   dynamoDB = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8200'
   });
} else {
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}

var rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
  
  app.use(bodyParser.json({ verify: rawBodySaver }));
  app.use(bodyParser.urlencoded({ verify: rawBodySaver, extended: true }));
  app.use(bodyParser.raw({ verify: rawBodySaver, type: '*/*' }));


app.get('/', (req, res)=>{
    res.send("Hola  mundo")
})

app.post('/users', (req, res)=> {
    const {userId, name} = req.body
    
    const params = {
      TableName: process.env.USERS_TABLE,
      Item: {
        userId, name
      }
    }
    
    dynamoDB.put(params, (error) => {
        if (error) {
          console.log(error);
          res.status(400).json({
            error: 'No se ha podido crear el usuario'
          })
        } else {
          res.json({userId, name})
        }
    })
})

app.get('/users', (req, res)=>{
    const params = {
        TableName: process.env.USERS_TABLE
    }

    dynamoDB.scan(params, (err, response)=>{
        if(err) {
            res.status(400).json({
                error: "No se realizo la consulta"
            })
        } else {
            const {Items} = response;
            res.json({
                success: true,
                message: "Usuarios cargados correctamente",
                users: Items
            })
        }
    })
})


app.get('/users/:userId', (req, res)=>{
    const params = {
        TableName: process.env.USERS_TABLE,
        Key: {
            userId: req.params.userId
        }
    }

    dynamoDB.get(params, (err, response)=>{
        if(err) {
            console.log(err)
            return res.status(400).json({
                error: "No se realizo la consulta"
            })
        } 
        
        if(response.Item){
            const Item = response.Item;
            return res.json({
                success: true,
                message: "Usuario cargado correctamente",
                users: response.Item
            })
        } else {
            return res.status(400).json({
                error: "Usuario no entontrado",
            })
        }
    })
})

module.exports.generic = serverless(app)
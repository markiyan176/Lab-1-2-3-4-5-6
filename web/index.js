import express from 'express';
import bodyParser from 'body-parser';
import { USERS, ORDERS } from './db.js';
import { authorizationMiddleware } from './middlewares.js';

const app = express();

app.use(bodyParser.json());

/**
 * POST -- create resource
 * req -> input data
 * res -> output data
 */
app.post('/users', (req, res) => {
 const { body } = req;

 console.log(`body`, JSON.stringify(body));

 const isUserExist = USERS.some(el => el.login === body.login);
 if (isUserExist) {
  return res.status(400).send({ message: `user with login ${body.login} already exists` });
 }

 USERS.push(body);

 res.status(200).send({ message: 'User was created' });
});

app.get('/users', (req, res) => {
 const users = USERS.map(user => {
  const { password, ...other } = user;
  return other;
 });
 return res
  .status(200)
  .send(users);
});

app.get('/address/from/last-5', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const userOrders = ORDERS.filter(el => el.login === user.login);

  const uniqueFromAddresses = [];

  userOrders.forEach(order => {
    const { from } = order;

    if (!uniqueFromAddresses.includes(from)) {
      uniqueFromAddresses.push(from);
    }
  });

  const last5UniqueFromAddresses = uniqueFromAddresses.slice(-5);

  if (last5UniqueFromAddresses.length === 0) {
    return res.status(400).send({ message: `User was not found by token: ${user.token}` });
  }

  return res.status(200).send(last5UniqueFromAddresses);
});

app.get('/address/to/last-5', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const userOrders = ORDERS.filter(el => el.login === user.login);

  const uniqueToAddresses = [];

  userOrders.forEach(order => {
    const { to } = order;

    if (!uniqueToAddresses.includes(to)) {
      uniqueToAddresses.push(to);
    }
  });

  const last5UniqueToAddresses = uniqueToAddresses.slice(-3).reverse();

  if (uniqueToAddresses.length === 0) {
    return res.status(400).send({ message: `User was not found by token: ${user.token}` });
  }

  return res.status(200).send(last5UniqueToAddresses);
});

app.post('/login', (req, res) => {
 const { body } = req;

 const user = USERS
  .find(el => el.login === body.login && el.password === body.password);

 if (!user) {
  return res.status(400).send({ message: 'User was not found' });
 }

 const token = crypto.randomUUID();

 user.token = token;
 USERS.save(user.login, { token });

 return res.status(200).send({
  token,
  message: 'User was login'
 });
});

app.post('/orders', authorizationMiddleware, (req, res) => {
 const { body, user } = req;

 // Generate random price between 20 and 100
 const price = Math.floor(Math.random() * (100 - 20 + 1)) + 20;

 const order = {
  ...body,
  login: user.login,
  price: price
 };

 ORDERS.push(order);

 return res.status(200).send({ message: 'Order was created', order });
});

app.get('/orders', authorizationMiddleware, (req, res) => {
 const { user } = req;

 const orders = ORDERS.filter(el => el.login === user.login);

 return res.status(200).send(orders);
});

app.get('/orders/lowest', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const userOrders = ORDERS.filter(order => order.login === user.login);

  if (userOrders.length === 0) {

      return res.status(404).send({ message: `User does not have any orders yet` });
  }

  let lowestOrder = userOrders[0];
  for (let i = 1; i < userOrders.length; i++) {
      if (userOrders[i].price < lowestOrder.price) {
          lowestOrder = userOrders[i];
      }
  }

  return res.status(200).send(lowestOrder);
});


app.get('/orders/highest', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const userOrders = ORDERS.filter(order => order.login === user.login);

  if (userOrders.length === 0) {
    return res.status(404).send({ message: `User does not have any orders yet` });
  }

  let highestOrder = userOrders[0];
  for (let i = 1; i < userOrders.length; i++) {
    if (userOrders[i].price > highestOrder.price) {
      highestOrder = userOrders[i];
    }
  }

  return res.status(200).send(highestOrder);
});

app.listen(8080, () => console.log('Server was started'));

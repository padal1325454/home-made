const express = require('express');
const cors = require('cors');
const data = require('./data.cjs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/reset', (_req, res) => {
  data.reset();
  res.json({ ok: true });
});

app.get('/users', (_req, res) => res.json(data.getAll('users')));
app.post('/users', (req, res) => {
  const user = data.createItem('users', req.body);
  res.json(user);
});
app.put('/users/:id', (req, res) => {
  const user = data.updateItem('users', req.params.id, req.body);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.get('/customers', (_req, res) => res.json(data.getAll('customers')));
app.post('/customers', (req, res) => {
  const customer = data.createItem('customers', req.body);
  res.json(customer);
});
app.put('/customers/:id', (req, res) => {
  const customer = data.updateItem('customers', req.params.id, req.body);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json(customer);
});

app.get('/products', (_req, res) => res.json(data.getAll('products')));
app.post('/products', (req, res) => {
  const product = data.createItem('products', req.body);
  res.json(product);
});
app.put('/products/:id', (req, res) => {
  const product = data.updateItem('products', req.params.id, req.body);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.get('/orders', (_req, res) => res.json(data.getAll('orders')));
app.post('/orders', (req, res) => {
  const order = data.createItem('orders', req.body);
  res.json(order);
});
app.put('/orders/:id', (req, res) => {
  const order = data.updateItem('orders', req.params.id, req.body);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

app.get('/messages', (_req, res) => res.json(data.getAll('messages')));
app.post('/messages', (req, res) => {
  const msg = data.createItem('messages', req.body);
  res.json(msg);
});

app.get('/settings', (_req, res) => res.json(data.getAll('settings')));
app.put('/settings', (req, res) => {
  data.setAll('settings', req.body);
  res.json(data.getAll('settings'));
});

app.get('/next/order-number', (_req, res) => {
  res.json({ value: data.nextOrderNumber() });
});
app.get('/next/invoice-number', (_req, res) => {
  res.json({ value: data.nextInvoiceNumber() });
});

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});

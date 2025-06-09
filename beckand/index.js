const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'segredo123';

app.use(cors());
app.use(bodyParser.json());

let produtos = [];
let currentId = 1;

const usuarios = [{ username: 'administrador', password: '1234' }];

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}


app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  const user = usuarios.find(u => u.usuario === usuario && u.senha === senha);
  if (!user) return res.status(401).json({ mensagem: 'Credenciais inválidas' });

  const token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Endpoints protegidos
app.get('/produtos', autenticarToken, (req, res) => res.json(produtos));

app.post('/produtos', autenticarToken, (req, res) => {
  const produto = { id: currentId++, ...req.body };
  produtos.push(produto);
  res.status(201).json(produto);
});

// Endpoints públicos
app.put('/produto/:id', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.sendStatus(404);
  produtos[index] = { ...produtos[index], ...req.body };
  res.json(produtos[index]);
});

app.patch('/produto/:id', (req, res) => {
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  if (!produto) return res.sendStatus(404);
  Object.assign(produto, req.body);
  res.json(produto);
});

app.delete('/produto/:id', (req, res) => {
  produtos = produtos.filter(p => p.id !== parseInt(req.params.id));
  res.sendStatus(204);
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

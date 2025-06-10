const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4000;
const SECRET_KEY = 'segredo123';

app.use(cors());
app.use(bodyParser.json());

let produtos = [];
let currentId = 1;

// Usuário padrão para login
const usuarios = [{ usuario: 'admin', senha: '123' }];

// Middleware de autenticação com JWT
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

// Rota de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = usuarios.find(u => u.usuario === username && u.senha === password);
  if (!user) return res.status(401).json({ mensagem: 'Credenciais inválidas' });

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Rotas protegidas de produtos
app.get('/produtos', autenticarToken, (req, res) => {
  res.json(produtos);
});

app.post('/produtos', autenticarToken, (req, res) => {
  const produto = { id: currentId++, ...req.body };
  produtos.push(produto);
  res.status(201).json(produto);
});

app.patch('/produtos/:id', autenticarToken, (req, res) => {
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  if (!produto) return res.sendStatus(404);
  Object.assign(produto, req.body);
  res.json(produto);
});

app.put('/produtos/:id', autenticarToken, (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.sendStatus(404);
  produtos[index] = { ...produtos[index], ...req.body };
  res.json(produtos[index]);
});

app.delete('/produtos/:id', autenticarToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = produtos.findIndex(p => p.id === id);
  if (index === -1) return res.sendStatus(404);
  produtos.splice(index, 1);
  res.sendStatus(204);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});

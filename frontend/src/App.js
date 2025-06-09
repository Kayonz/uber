import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container, AppBar, Toolbar, Typography, Button, TextField, Box, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogActions, DialogContent, DialogTitle, CssBaseline
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const API_URL = 'http://localhost:3000';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isCriando, setIsCriando] = useState(false);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const newToken = response.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (err) {
      setError('Falha no login. Verifique as credenciais ou se o servidor backend está rodando.');
      console.error('Erro no login:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setProdutos([]);
    setError('');
  };

  const buscarProdutos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Sessão expirada ou inválida. Faça login novamente.');
        handleLogout();
      } else {
        setError('Erro ao buscar produtos. Verifique a conexão com o backend.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!produtoEditando || !token) return;

    const { id, nome, preco, descricao, quantidade } = produtoEditando;
    if (!nome || preco === '' || descricao === '' || quantidade === '') {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    const dadosProduto = {
      nome,
      preco: parseFloat(preco),
      descricao,
      quantidade: parseInt(quantidade),
    };

    setLoading(true);
    setError('');
    try {
      if (isCriando) {
        await api.post('/produtos', dadosProduto);
      } else {
        await api.patch(`/produtos/${id}`, dadosProduto);
      }
      handleCloseDialog();
      buscarProdutos();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setError('Erro ao salvar produto.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Sessão expirada ou inválida. Faça login novamente.');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirProduto = async (id) => {
    if (!token || !window.confirm('Tem certeza que deseja excluir este produto?')) return;
    setLoading(true);
    setError('');
    try {
      await api.delete(`/produtos/${id}`);
      buscarProdutos();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      setError('Erro ao excluir produto.');
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Sessão expirada ou inválida. Faça login novamente.');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (produto = null) => {
    if (produto) {
      setProdutoEditando({ ...produto });
      setIsCriando(false);
    } else {
      setProdutoEditando({ nome: '', preco: '', descricao: '', quantidade: '' });
      setIsCriando(true);
    }
    setError('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setProdutoEditando(null);
    setIsCriando(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProdutoEditando(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (token) {
      buscarProdutos();
    }
  }, [token, buscarProdutos]);

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Gerenciamento de Produtos</Typography>
          {token && (
            <Button color="inherit" onClick={handleLogout}>Sair</Button>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {!token ? (
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Login</Typography>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Usuário"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Entrar'}
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Produtos Cadastrados</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Adicionar Produto
              </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading && !openDialog && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell align="right">Preço</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell align="right">Quantidade</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {produtos.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Nenhum produto cadastrado.</TableCell>
                    </TableRow>
                  ) : (
                    produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell>{produto.id}</TableCell>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell align="right">R$ {produto.preco.toFixed(2)}</TableCell>
                        <TableCell>{produto.descricao}</TableCell>
                        <TableCell align="right">{produto.quantidade}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" onClick={() => handleOpenDialog(produto)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleExcluirProduto(produto.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{isCriando ? 'Cadastrar Novo Produto' : 'Editar Produto'}</DialogTitle>
          <Box component="form" onSubmit={handleSalvarProduto}>
            <DialogContent>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField
                autoFocus
                margin="dense"
                name="nome"
                label="Nome do Produto"
                fullWidth
                value={produtoEditando?.nome || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                margin="dense"
                name="preco"
                label="Preço (R$)"
                type="number"
                fullWidth
                value={produtoEditando?.preco || ''}
                onChange={handleInputChange}
                required
                inputProps={{ step: '0.01' }}
              />
              <TextField
                margin="dense"
                name="descricao"
                label="Descrição"
                multiline
                rows={3}
                fullWidth
                value={produtoEditando?.descricao || ''}
                onChange={handleInputChange}
                required
              />
              <TextField
                margin="dense"
                name="quantidade"
                label="Quantidade em Estoque"
                type="number"
                fullWidth
                value={produtoEditando?.quantidade || ''}
                onChange={handleInputChange}
                required
                inputProps={{ min: '0' }}
              />
            </DialogContent>
            <DialogActions sx={{ pb: 2, pr: 2 }}>
              <Button onClick={handleCloseDialog} color="secondary">Cancelar</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (isCriando ? 'Cadastrar' : 'Salvar Alterações')}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Container>
    </>
  );
}

export default App;
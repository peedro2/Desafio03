const pool = require("../conexao");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
    const verificarEmail = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );

    if (verificarEmail.rows.length > 0) {
      return res.status(400).json({
        mensagem: "Já existe usuário cadastrado com o e-mail informado.",
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = await pool.query(
      "insert into usuarios (nome, email, senha) values ($1, $2, $3) returning id, nome, email",
      [nome, email, senhaCriptografada]
    );

    return res.status(201).json(novoUsuario.rows[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
    const usuario = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );

    if (usuario.rowCount < 1) {
      return res
        .status(404)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha);

    if (!senhaValida) {
      return res
        .status(400)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }

    const token = jwt.sign({ id: usuario.rows[0].id }, "senha123", {
      expiresIn: "8h",
    });

    const { senha: _, ...usuarioLogado } = usuario.rows[0];

    return res.json({ usuario: usuarioLogado, token });
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const usuario = async (req, res) => {
  try {
    let usuarioid = req.usuario.id;
    const usuario = await pool.query(
      "select id, nome, email from usuarios where id = $1",
      [usuarioid]
    );

    return res.json(usuario.rows[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const atualizarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
    let usuarioid = req.usuario.id;

    const verificarEmail = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );

    if (verificarEmail.rows.length > 0) {
      return res.status(400).json({
        mensagem:
          "O e-mail informado já está sendo utilizado por outro usuário.",
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = await pool.query(
      "update usuarios set nome = $1, email = $2, senha = $3 where id = $4",
      [nome, email, senhaCriptografada, usuarioid]
    );

    return res.status(200).json();
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const listarCategorias = async (req, res) => {
  try {
    const categorias = await pool.query("select * from categorias");

    return res.status(200).json(categorias.rows);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const listarTransacoes = async (req, res) => {
  try {
    let usuarioid = req.usuario.id;
    const transacoes = await pool.query(
      "select transacoes.*, categorias.descricao as categoria_nome from transacoes join categorias on transacoes.categoria_id = categorias.id where transacoes.usuario_id = $1",
      [usuarioid]
    );

    return res.status(200).json(transacoes.rows);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const detalharTransacoes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const transacaoId = req.params.id;

    const transacao = await pool.query(
      "select * from transacoes where usuario_id = $1 and id = $2",
      [usuarioId, transacaoId]
    );

    if (transacao.rows.length === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

    return res.json(transacao.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const cadastrarTransacao = async (req, res) => {
  const { descricao, valor, data, categoria_id, tipo } = req.body;
  const usuario_id = req.usuario.id; 
  if (!descricao || !valor || !data || !categoria_id || !tipo) {
    return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
  
    const categoria = await pool.query(
      "select * from categorias where id = $1",
      [categoria_id]
    );

    if (categoria.rows.length === 0) {
      return res.status(400).json({ mensagem: "Categoria não encontrada." });
    }

  
    if (tipo !== "entrada" && tipo !== "saida") {
      return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
    }

    const novaTransacao = await pool.query(
      "insert into transacoes (descricao, valor, data, categoria_id, tipo, usuario_id) values ($1, $2, $3, $4, $5, $6) returning id, tipo, descricao, valor, data, usuario_id, categoria_id",
      [descricao, valor, data, categoria_id, tipo, usuario_id]
    );

    return res.status(201).json(novaTransacao.rows[0]);
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};



const atualizarTransacao = async (req, res) => {
  const { descricao, valor, data, categoria_id, tipo } = req.body;
  const usuario_id = req.usuario.id; 

  const transacaoId = req.params.id;

  if (!descricao || !valor || !data || !categoria_id || !tipo) {
    return res.status(400).json({ mensagem: "Todos os campos são obrigatórios." });
  }

  try {
   
    const transacao = await pool.query(
      "select * from transacoes where id = $1 and usuario_id = $2",
      [transacaoId, usuario_id]
    );

    if (transacao.rows.length === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada ou não pertence ao usuário logado." });
    }

    const categoria = await pool.query(
      "select * from categorias where id = $1",
      [categoria_id]
    );

    if (categoria.rows.length === 0) {
      return res.status(400).json({ mensagem: "Categoria não encontrada." });
    }

    if (tipo !== "entrada" && tipo !== "saida") {
      return res.status(400).json({ mensagem: "O tipo deve ser 'entrada' ou 'saida'." });
    }

    await pool.query(
      "update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 where id = $6",
      [descricao, valor, data, categoria_id, tipo, transacaoId]
    );

    return res.status(204).send(); 
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};
const excluirTransacao = async (req, res) => {

  const transacaoId = req.params.id;
  const usuario_id = req.usuario.id;

  try {
  
    const transacao = await pool.query(
      "select * from transacoes where id = $1 and usuario_id = $2",
      [transacaoId, usuario_id]
    );

    if (transacao.rows.length === 0) {
      return res.status(404).json({ mensagem: "Transação não encontrada." });
    }

  
    await pool.query(
      "delete from transacoes where id = $1",
      [transacaoId]
    );

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

const obterExtrato = async (req, res) => {
  const usuario_id = req.usuario.id;

  try {
   //calcular a soma das entradas
    const somaEntradas = await pool.query(
      "select sum(valor) as somaentradas from transacoes where usuario_id = $1 and tipo = 'entrada'",
      [usuario_id]
    );

    //calcular soma saidas 
    const somaSaidas = await pool.query(
      "select sum(valor) as somasaidas from transacoes where usuario_id = $1 and tipo = 'saida'",
      [usuario_id]
    );
    //  // imprimir 
    // const valorEntradas = parseFloat(somaEntradas.rows[0].somaentradas) || 0;
    // const valorSaidas = parseFloat(somaSaidas.rows[0].somasaidas) || 0;

    const extratox = {
      entrada: somasaidas,
      saida: somaentradas,
    };

    return res.status(200).json(extratox);
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
};

module.exports = {
  cadastrarUsuario,
  login,
  usuario,
  atualizarUsuario,
  listarCategorias,
  listarTransacoes,
  detalharTransacoes,
  cadastrarTransacao,
  atualizarTransacao,
  excluirTransacao,
  obterExtrato
};



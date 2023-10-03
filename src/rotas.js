const express = require("express");
const {
  cadastrarUsuario,
  login,
  usuario,
  atualizarUsuario,
} = require("./controlador/controladores");
const verificarUsuarioLogado = require("./intermediario/intermediarios");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);
rotas.post("/login", login);

rotas.use(verificarUsuarioLogado);

rotas.get("/usuario", usuario);
rotas.put("/usuario", atualizarUsuario);

module.exports = rotas;

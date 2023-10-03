const express = require("express");
const {
  cadastrarUsuario,
  login,
  usuario,
} = require("./controlador/controladores");
const verificarUsuarioLogado = require("./intermediario/intermediarios");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);
rotas.post("/login", login);

rotas.use(verificarUsuarioLogado);

rotas.get("/usuario", usuario);

module.exports = rotas;

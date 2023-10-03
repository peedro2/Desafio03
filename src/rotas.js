const express = require("express");
const { cadastrarUsuario, login } = require("./controlador/controladores");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);
rotas.post("/login", login);

module.exports = rotas;

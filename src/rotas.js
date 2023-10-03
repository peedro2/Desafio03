const express = require("express");
const { cadastrarUsuario } = require("./controlador/controladores");

const rotas = express();

rotas.post("/usuario", cadastrarUsuario);

module.exports = rotas;

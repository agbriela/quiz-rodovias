import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc,
    increment
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let perguntas = [];
let perguntaAtual = 0;
let tempo = 20;
let intervalo;

const pergunta = document.getElementById("pergunta");
const alternativas = document.getElementById("alternativas");
const timer = document.getElementById("timer");

carregarPerguntas();

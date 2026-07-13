import { db } from "./firebase-config.js";

import {
    doc,
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

// Inicia o carregamento
carregarPerguntas();

async function carregarPerguntas() {
    const resposta = await fetch("./perguntas.json");
    perguntas = await resposta.json();
    carregarPergunta();
}

function carregarPergunta() {
    clearInterval(intervalo);

    tempo = 20;

    const p = perguntas[perguntaAtual];

    pergunta.innerHTML = p.pergunta;

    alternativas.innerHTML = "";

    p.alternativas.forEach((texto, indice) => {

        const botao = document.createElement("button");

        botao.classList.add("alternativa");

        botao.innerHTML = texto;

        botao.onclick = () => responder(indice);

        alternativas.appendChild(botao);
    });

    iniciarTimer();
}

function iniciarTimer() {
    timer.innerHTML = tempo;

    intervalo = setInterval(() => {
        tempo--;

        timer.innerHTML = tempo;

        if (tempo <= 0) {
            clearInterval(intervalo);
            proximaPergunta();
        }
    }, 1000);
}

async function responder(indice) {

    clearInterval(intervalo);

    const p = perguntas[perguntaAtual];

    const participanteId =
        localStorage.getItem("participante");

    if (indice === p.correta) {

        const pontos = 100 + tempo * 5;

        await updateDoc(
            doc(db, "participantes", participanteId),
            {
                pontos: increment(pontos)
            }
        );
    }

    proximaPergunta();
}

function proximaPergunta() {

    perguntaAtual++;

    if (perguntaAtual >= perguntas.length) {
        pergunta.innerHTML = "🏆 Quiz Finalizado!";
        alternativas.innerHTML = "";
        timer.innerHTML = "";
        return;
    }

    carregarPergunta();
}

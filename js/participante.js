import { db } from "./firebase-config.js";

import {
    doc,
    onSnapshot,
    updateDoc,
    increment,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

let perguntas = [];
let perguntaAtual = 0;
let tempo = 20;
let intervalo = null;

const pergunta =
    document.getElementById("pergunta");

const alternativas =
    document.getElementById("alternativas");

const timer =
    document.getElementById("timer");

const barra =
    document.getElementById("barra");

// Carrega as perguntas
carregarPerguntas();

async function carregarPerguntas() {

    const resposta =
        await fetch("./perguntas.json");

    perguntas =
        await resposta.json();

    escutarPergunta();
}

// Escuta a pergunta atual do Firebase
function escutarPergunta() {

    const ref =
        doc(db, "controle", "jogo");

    onSnapshot(ref, (snapshot) => {

        if (!snapshot.exists()) return;

        perguntaAtual =
            snapshot.data().perguntaAtual;

        if (perguntaAtual >= perguntas.length) {
            finalizarQuiz();
            return;
        }

        carregarPergunta();
    });
}

// Carrega a pergunta na tela
function carregarPergunta() {

    clearInterval(intervalo);

    tempo = 20;

    const p = perguntas[perguntaAtual];

    pergunta.innerHTML =
        p.pergunta;

    alternativas.innerHTML = "";

    p.alternativas.forEach(
        (texto, indice) => {

            const botao =
                document.createElement("button");

            botao.classList.add(
                "alternativa"
            );

            botao.innerHTML = texto;

            botao.onclick =
                () => responder(indice);

            alternativas.appendChild(botao);
        }
    );

    atualizarBarra();

    iniciarTimer();
}

// Cronômetro
function iniciarTimer() {

    timer.innerHTML = tempo;

    intervalo = setInterval(() => {

        tempo--;

        timer.innerHTML = tempo;

        if (tempo <= 0) {

            clearInterval(intervalo);

            desabilitarBotoes();
        }

    }, 1000);
}

// Responde uma pergunta
async function responder(indice) {

    const participanteId =
        localStorage.getItem(
            "participante"
        );

    if (!participanteId) return;

    const respostaRef =
        doc(
            db,
            "respostas",
            participanteId
        );

    const respostaSalva =
        await getDoc(respostaRef);

    // Já respondeu esta pergunta
    if (
        respostaSalva.exists() &&
        respostaSalva.data().pergunta ===
            perguntaAtual
    ) {
        return;
    }

    await setDoc(
        respostaRef,
        {
            pergunta: perguntaAtual,
            resposta: indice
        }
    );

    clearInterval(intervalo);

    const p =
        perguntas[perguntaAtual];

    if (indice === p.correta) {

        const pontos =
            100 + (tempo * 5);

        await updateDoc(
            doc(
                db,
                "participantes",
                participanteId
            ),
            {
                pontos:
                    increment(
                        pontos
                    )
            }
        );

        pergunta.innerHTML =
            "✅ Resposta correta!";
    }
    else {

        pergunta.innerHTML =
            "❌ Resposta incorreta!";
    }

    desabilitarBotoes();
}

// Desabilita as alternativas
function desabilitarBotoes() {

    const botoes =
        document.querySelectorAll(
            ".alternativa"
        );

    botoes.forEach(
        botao =>
            botao.disabled = true
    );
}

// Atualiza a barra de progresso
function atualizarBarra() {

    if (!barra) return;

    const porcentagem =
        ((perguntaAtual + 1)
            / perguntas.length)
        * 100;

    barra.style.width =
        porcentagem + "%";
}

// Finaliza o quiz
function finalizarQuiz() {

    clearInterval(intervalo);

    pergunta.innerHTML =
        "🏆 Quiz Finalizado!";

    alternativas.innerHTML = "";
}

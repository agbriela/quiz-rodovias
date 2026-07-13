import { db } from "./firebase-config.js";

import {
    doc,
    updateDoc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

document
.getElementById("proxima")
.addEventListener("click", proximaPergunta);

async function proximaPergunta() {

    const ref =
        doc(db, "controle", "jogo");

    const dados =
        await getDoc(ref);

    const atual =
        dados.data().perguntaAtual;

    await updateDoc(ref, {
        perguntaAtual:
            atual + 1
    });
}

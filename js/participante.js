import {
    onSnapshot,
    doc,
    updateDoc
}
from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let tempo = 20;

function responder(indice) {

    const pontos =
        100 +
        tempo * 5;

    updateDoc(
        doc(db,
        "participantes",
        localStorage.getItem(
            "participante")),
        {
            pontos:
                increment(pontos)
        }
    );
}

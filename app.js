import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyDCRCgLmu0otr0e9IRpEzWw9VKxMdW8hgY",
    authDomain: "kilometerzaehler-21137.firebaseapp.com",
    projectId: "kilometerzaehler-21137",
    storageBucket: "kilometerzaehler-21137.appspot.com",
    messagingSenderId: "1038240895552",
    appId: "1:1038240895552:web:fa3c50ff3fcef471bf45a5"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Chart-Referenz
let kmChart;

// Funktionen zum Hinzufügen von Kilometern und Bildern
const addKilometers = async (group, km, imageFile, name) => {
    const imageUrl = await uploadImage(group, imageFile);
    
    const docRef = doc(db, "kilometer", group);
    await updateDoc(docRef, {
        entries: arrayUnion({ kilometers: km, imageUrl, name }) // Name hinzufügen
    });

    // Tabelle aktualisieren
    updateTable(group);
};

// Bild hochladen
const uploadImage = async (group, file) => {
    const storageRef = ref(storage, `${group}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

// Formulare verarbeiten
document.getElementById("group1-form").onsubmit = async (e) => {
    e.preventDefault();
    const km = document.getElementById("group1-km").value;
    const imageFile = document.getElementById("group1-image").files[0];
    const name = document.getElementById("group1-name").value;
    await addKilometers("group1", Number(km), imageFile, name);
    document.getElementById("group1-km").value = '';
    document.getElementById("group1-image").value = '';
    document.getElementById("group1-name").value = '';
    updateChart(); // Diagramm aktualisieren
};

document.getElementById("group2-form").onsubmit = async (e) => {
    e.preventDefault();
    const km = document.getElementById("group2-km").value;
    const imageFile = document.getElementById("group2-image").files[0];
    const name = document.getElementById("group2-name").value;
    await addKilometers("group2", Number(km), imageFile, name);
    document.getElementById("group2-km").value = '';
    document.getElementById("group2-image").value = '';
    document.getElementById("group2-name").value = '';
    updateChart(); // Diagramm aktualisieren
};

// Diagramm laden oder aktualisieren
const updateChart = async () => {
    const group1Data = await getGroupData("group1");
    const group2Data = await getGroupData("group2");

    // Wenn das Diagramm bereits existiert, zerstöre es
    if (kmChart) {
        kmChart.destroy();
    }

    const ctx = document.getElementById('kmChart').getContext('2d');
    kmChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Gruppe 1', 'Gruppe 2'],
            datasets: [{
                label: 'Kilometer',
                data: [group1Data.totalKm, group2Data.totalKm],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

// Gruppendaten abrufen
const getGroupData = async (group) => {
    const docRef = doc(db, "kilometer", group);
    const docSnap = await getDoc(docRef);
    let totalKm = 0;

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.entries)) {
            totalKm = data.entries.reduce((acc, entry) => acc + entry.kilometers, 0);
        }
    } else {
        console.log("No such document!");
    }

    return { totalKm };
};

// Tabelle aktualisieren
const updateTable = async (group) => {
    const docRef = doc(db, "kilometer", group);
    const docSnap = await getDoc(docRef);
    const tableBody = document.querySelector(`#${group}-table tbody`);
    tableBody.innerHTML = ''; // Leeren des Tabelleninhalts

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.entries)) {
            data.entries.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.name}</td>
                    <td>${entry.kilometers}</td>
                    <td><img src="${entry.imageUrl}" alt="Bild" style="width: 50px; height: auto; cursor: pointer;" class="thumbnail"></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
};

// Diagramm und Tabellen beim Laden der Seite laden
window.onload = () => {
    updateChart();
    updateTable("group1");
    updateTable("group2");
};

// Modal-Handling
const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.getElementsByClassName("close")[0];

// Bild im Modal anzeigen
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("thumbnail")) {
        modal.style.display = "block";
        modalImage.src = event.target.src; // Setze das Bild im Modal
    }
});

// Schließe das Modal, wenn das 'x' oder der Hintergrund angeklickt wird
closeModal.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

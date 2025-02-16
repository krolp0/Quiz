/*************** 1) Deklaracja głównego elementu ***************/
const appDiv = document.getElementById('app');

/*************** 2) Konfiguracja Supabase ***************/
// Wklej swoje dane (URL i klucz anon) – bez żadnych dodatkowych ścieżek
const SUPABASE_URL = "https://mdpyylbbhgvtbrpuejet.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHl5bGJiaGd2dGJycHVlamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MzIxMzIsImV4cCI6MjA1NTIwODEzMn0.31noUOdLve6sKZAA2iTgzKd8nO0Zrz9tel5nbEziMHo";
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*************** 3) Funkcje pomocnicze ***************/
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function generateToken() {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * Zapisuje metadane quizu (session_data) do tabeli 'quizzes' – np. partner1Name, partner2Name, quizQuestions.
 * Nie dotyczy odpowiedzi partnerów – te zapiszemy osobno w partner1_answers / partner2_answers.
 */
async function saveSessionData(token, sessionData) {
  console.log("saveSessionData() – zapisuję session_data w Supabase...", token);
  try {
    // Tworzymy/upsertujemy wiersz z tokenem i session_data, resztę kolumn pozostawiamy nienaruszoną
    const { data, error } = await supabase
      .from('quizzes')
      .upsert({ token, session_data: sessionData }, { onConflict: 'token' });
    if (error) {
      console.error("Błąd przy zapisie session_data do Supabase:", error);
    } else {
      console.log("session_data zapisane w Supabase:", data);
    }
  } catch (err) {
    console.error("Błąd przy zapisie session_data:", err);
  }
}

/**
 * Zapisuje odpowiedzi partnera w osobnej kolumnie partner1_answers lub partner2_answers.
 */
async function savePartnerAnswers(token, partner, answersObj) {
  const columnName = (partner === "1") ? "partner1_answers" : "partner2_answers";
  console.log(`savePartnerAnswers() – zapisuję odpowiedzi partner${partner} w kolumnie ${columnName}`, token);

  try {
    // Tworzymy/upsertujemy wiersz z tokenem i kolumną partnerX_answers
    const { data, error } = await supabase
      .from('quizzes')
      .upsert({ token, [columnName]: answersObj }, { onConflict: 'token' });
    if (error) {
      console.error("Błąd przy zapisie odpowiedzi do Supabase:", error);
    } else {
      console.log(`Odpowiedzi partner${partner} zapisane w Supabase:`, data);
    }
  } catch (err) {
    console.error("Błąd przy zapisie odpowiedzi partnera:", err);
  }
}

/**
 * Odczytuje pełne dane z tabeli 'quizzes':
 * - session_data (metadane quizu),
 * - partner1_answers,
 * - partner2_answers.
 */
async function loadQuizRow(token) {
  console.log("loadQuizRow() – wczytuję wiersz z Supabase, token:", token);
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('session_data, partner1_answers, partner2_answers')
      .eq('token', token)
      .single();
    if (error) {
      console.error("Błąd przy odczycie z Supabase:", error);
      return null;
    }
    return data; // { session_data, partner1_answers, partner2_answers }
  } catch (err) {
    console.error("Błąd loadQuizRow:", err);
    return null;
  }
}

function formatText(text, p1, p2) {
  return text.replace(/{p1}/g, p1).replace(/{p2}/g, p2);
}

/*************** 4) Dane Quizu ***************/
const fullQuizData = [
  {
    category: "Życie codzienne",
    questions: [
      { id: "codzienne1",  type: "comparative", text: "Kto jest bardziej zorganizowany? {p1} vs {p2}" },
      { id: "codzienne2",  type: "comparative", text: "Kto lepiej zarządza czasem? {p1} vs {p2}" },
      { id: "codzienne3",  type: "comparative", text: "Kto bardziej dba o porządek w domu? {p1} vs {p2}" },
      { id: "codzienne4",  type: "comparative", text: "Kto częściej podejmuje inicjatywę w codziennych zadaniach? {p1} vs {p2}" },
      { id: "codzienne5",  type: "comparative", text: "Kto lepiej radzi sobie z obowiązkami domowymi? {p1} vs {p2}" },
      { id: "codzienne6",  type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej punktualny niż {p2}?" },
      { id: "codzienne7",  type: "yesno",       text: "Czy {p1} skuteczniej organizuje wspólne sprawy?" },
      { id: "codzienne8",  type: "yesno",       text: "Czy {p2} częściej dba o detale dnia codziennego?" },
      { id: "codzienne9",  type: "yesno",       text: "Czy oboje podchodzicie do codziennych obowiązków podobnie?" },
      { id: "codzienne10", type: "yesno",       text: "Czy {p2} jest bardziej skrupulatny w planowaniu dnia?" }
    ]
  },
  // ... (Pozostałe kategorie: Romantyzm, Przygody, Plany na przyszłość, Intymność)
];

/*************** 5) Logika quizu ***************/

/** Partner 1 tworzy quiz – wpisuje imiona */
async function showCreateQuiz() {
  appDiv.innerHTML = `
    <h1>Quiz dla Zakochanych</h1>
    <p>Wprowadź imiona obojga partnerów, aby utworzyć quiz.</p>
    <form id="createQuizForm">
      <label for="partner1Name">Imię Partnera 1:</label>
      <input type="text" id="partner1Name" name="partner1Name" required />
      <label for="partner2Name">Imię Partnera 2:</label>
      <input type="text" id="partner2Name" name="partner2Name" required />
      <button type="submit">Utwórz Quiz</button>
    </form>
  `;
  document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = e.target.partner1Name.value.trim();
    const p2 = e.target.partner2Name.value.trim();
    if (!p1 || !p2) {
      alert("Podaj oba imiona.");
      return;
    }
    const token = generateToken();
    // Tworzymy session_data z metadanymi
    const sessionData = {
      partner1Name: p1,
      partner2Name: p2,
      selectedCategories: [],
      quizQuestions: []
    };
    // Zapisujemy w kolumnie session_data
    await saveSessionData(token, sessionData);
    console.log("Utworzono quiz, token:", token);
    window.location.href = `?token=${token}&partner=1`;
  });
}

/** Partner 1 wybiera kategorie */
async function showCategorySelection(sessionData, token) {
  let categoryOptions = fullQuizData.map((cat, index) => {
    return `<div>
              <label>
                <input type="checkbox" name="category" value="${cat.category}" ${index === 0 ? "checked" : ""}>
                ${cat.category}
              </label>
            </div>`;
  }).join("");
  appDiv.innerHTML = `
    <h2>Wybierz kategorie quizu</h2>
    <form id="categoryForm">
      ${categoryOptions}
      <button type="submit">Zapisz wybór kategorii</button>
    </form>
  `;
  document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const selected = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
    if (!selected || selected.length === 0) {
      alert("Wybierz przynajmniej jedną kategorię.");
      return;
    }
    const selectedCats = fullQuizData.filter(cat => selected.includes(cat.category));

    // Zaktualizuj session_data w bazie
    sessionData.selectedCategories = selectedCats;
    await saveSessionData(token, sessionData);
    showQuizLink(token, sessionData);
  });
}

/** Ekran dla Partnera 1 – link do Partnera 2 i przycisk startu quizu */
function showQuizLink(token, sessionData) {
  const baseUrl = window.location.origin + window.location.pathname;
  const partner2Link = `${baseUrl}?token=${token}&partner=2`;
  appDiv.innerHTML = `
    <h2>Quiz stworzony!</h2>
    <p>Wyślij ten link Partnerowi 2:</p>
    <div class="link-box" id="partner2Link">${partner2Link}</div>
    <button id="copyBtn">Kopiuj link</button>
    <hr />
    <p>Jako <strong>${sessionData.partner1Name}</strong> kliknij przycisk, aby rozpocząć quiz.</p>
    <button id="startQuizBtn">Rozpocznij quiz</button>
  `;
  document.getElementById('copyBtn').addEventListener('click', () => {
    const linkText = document.getElementById('partner2Link').innerText;
    navigator.clipboard.writeText(linkText).then(() => {
      alert("Link został skopiowany!");
    });
  });
  document.getElementById('startQuizBtn').addEventListener('click', () => {
    startQuiz(token, sessionData, "1");
  });
}

/** Rozpoczęcie quizu – tworzymy listę pytań z wybranych kategorii */
async function startQuiz(token, sessionData, partner) {
  console.log(`startQuiz() – Partner ${partner}`);
  let quizQuestions = [];
  const categories = (sessionData.selectedCategories && sessionData.selectedCategories.length > 0)
    ? sessionData.selectedCategories
    : fullQuizData;
  categories.forEach(cat => {
    cat.questions.forEach(q => {
      quizQuestions.push({ ...q, category: cat.category });
    });
  });
  sessionData.quizQuestions = quizQuestions;
  // Zapisz w session_data
  await saveSessionData(token, sessionData);

  // Lokalne odpowiedzi partnera
  let localAnswers = {};
  showQuestion(0, quizQuestions, token, sessionData, partner, localAnswers);
}

/** Wyświetlanie pojedynczego pytania – automatyczne przejście do następnego */
function showQuestion(index, quizQuestions, token, sessionData, partner, localAnswers) {
  if (index >= quizQuestions.length) {
    console.log(`Partner ${partner} ukończył quiz. Zapisuję odpowiedzi w kolumnie partner${partner}_answers...`);
    savePartnerAnswers(token, partner, localAnswers)
      .then(() => {
        showQuizResults(token);
      });
    return;
  }
  const total = quizQuestions.length;
  const current = quizQuestions[index];
  const p1 = sessionData.partner1Name;
  const p2 = sessionData.partner2Name;
  const questionText = formatText(current.text, p1, p2);

  let optionsHTML = "";
  if (current.type === "comparative") {
    optionsHTML = `
      <div class="tile" data-answer="1">${p1}</div>
      <div class="tile" data-answer="2">${p2}</div>
    `;
  } else if (current.type === "yesno") {
    optionsHTML = `
      <div class="tile" data-answer="tak">Tak</div>
      <div class="tile" data-answer="nie">Nie</div>
    `;
  }

  appDiv.innerHTML = `
    <div class="progress">Pytanie ${index + 1} z ${total}</div>
    <h2>${questionText}</h2>
    <div class="tile-container">
      ${optionsHTML}
    </div>
  `;

  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const answer = tile.getAttribute('data-answer');
      console.log(`Partner ${partner} kliknął ${current.id}, odpowiedź: ${answer}`);
      localAnswers[current.id] = {
        category: current.category,
        type: current.type,
        answer: answer
      };
      setTimeout(() => {
        showQuestion(index + 1, quizQuestions, token, sessionData, partner, localAnswers);
      }, 300);
    });
  });
}

/** Wyświetlanie wyników – czekamy, aż oboje partnerzy skończą (polling co 1s) */
async function showQuizResults(token) {
  const quizRow = await loadQuizRow(token);
  if (!quizRow) {
    appDiv.innerHTML = "<p>Błąd: Nie można załadować quizu z bazy.</p>";
    return;
  }
  const sessionData = quizRow.session_data || {};
  const answers1 = quizRow.partner1_answers || {};
  const answers2 = quizRow.partner2_answers || {};
  const p1 = sessionData.partner1Name || "Partner1";
  const p2 = sessionData.partner2Name || "Partner2";
  const quizQuestions = sessionData.quizQuestions || [];

  // Sprawdź, czy oboje mają komplet odpowiedzi
  if (Object.keys(answers1).length !== quizQuestions.length ||
      Object.keys(answers2).length !== quizQuestions.length) {
    console.log("Oczekiwanie na zakończenie quizu przez oboje partnerów...");
    appDiv.innerHTML = `<p>Oczekiwanie na zakończenie quizu przez oboje partnerów...</p>`;
    setTimeout(() => showQuizResults(token), 1000);
    return;
  }

  // Oblicz statystyki
  let total = quizQuestions.length;
  let agreements = 0;
  let detailsHTML = quizQuestions.map(q => {
    const questionText = formatText(q.text, p1, p2);
    const a1 = answers1[q.id]?.answer;
    const a2 = answers2[q.id]?.answer;
    // Zamiana "1" -> p1, "2" -> p2
    const answer1 = (a1 === "1") ? p1 : (a1 === "2") ? p2 : a1;
    const answer2 = (a2 === "1") ? p1 : (a2 === "2") ? p2 : a2;
    if (a1 === a2) agreements++;
    return `
      <li>
        <strong>${q.category}:</strong> ${questionText}<br />
        <em>Partner 1:</em> ${answer1}<br />
        <em>Partner 2:</em> ${answer2}
      </li>
    `;
  }).join("");
  const overallAgreement = ((agreements / total) * 100).toFixed(2);

  appDiv.innerHTML = `
    <h2>Wyniki Quizu</h2>
    <p><strong>${p1}</strong> vs <strong>${p2}</strong></p>
    <p>Ogólna zgodność: <strong>${overallAgreement}%</strong></p>
    <h3>Szczegółowe odpowiedzi:</h3>
    <ul>${detailsHTML}</ul>
    <button id="resetBtn">Resetuj Quiz</button>
  `;
  document.getElementById('resetBtn').addEventListener('click', () => {
    window.location.href = window.location.origin + window.location.pathname;
  });
}

/*************** 6) Główna logika ***************/
(async function main() {
  const token = getQueryParam('token');
  const partner = getQueryParam('partner');
  console.log("main() – Token:", token, "Partner:", partner);

  if (!token) {
    // Brak tokenu – Partner 1 tworzy nowy quiz
    showCreateQuiz();
  } else {
    // Pobierz row z bazy
    const quizRow = await loadQuizRow(token);
    if (!quizRow) {
      appDiv.innerHTML = "<p>Błąd: Nie znaleziono quizu w bazie. Sprawdź link.</p>";
      return;
    }
    const sessionData = quizRow.session_data || {};
    if (partner === "1") {
      if (!sessionData.selectedCategories || sessionData.selectedCategories.length === 0) {
        // Pokaż wybór kategorii
        showCategorySelection(sessionData, token);
      } else {
        // Pokaż link i przycisk start
        showQuizLink(token, sessionData);
      }
    } else if (partner === "2") {
      console.log("Partner 2 wykryty – uruchamiam quiz.");
      // Jeśli quizQuestions jeszcze nie istnieje (Partner1 nie wybrał kategorii), poinformuj
      if (!sessionData.quizQuestions || sessionData.quizQuestions.length === 0) {
        appDiv.innerHTML = `<p>Partner 1 nie skonfigurował jeszcze quizu. Spróbuj ponownie później.</p>`;
        return;
      }
      startQuiz(token, sessionData, "2");
    } else {
      appDiv.innerHTML = "<p>Błąd: Nieprawidłowy parametr partner.</p>";
    }
  }
})();

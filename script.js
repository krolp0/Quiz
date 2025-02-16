/*************** 1) Deklaracja głównego elementu ***************/
const appDiv = document.getElementById('app');

/*************** 2) Konfiguracja Supabase ***************/
// Uzupełnij swoim URL i kluczem anon
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
 * Pobiera pełny wiersz (session_data, partner1_answers, partner2_answers)
 * z tabeli quizzes dla danego tokenu.
 */
async function loadQuizRow(token) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('session_data, partner1_answers, partner2_answers')
      .eq('token', token)
      .single();
    if (error) {
      console.error("Błąd loadQuizRow:", error);
      return null;
    }
    return data; // { session_data, partner1_answers, partner2_answers }
  } catch (err) {
    console.error("Błąd loadQuizRow:", err);
    return null;
  }
}

/**
 * Upsertuje CAŁY wiersz (token, session_data, partner1_answers, partner2_answers).
 * Zawsze przekazujemy session_data (niepuste), żeby nie naruszyć NOT NULL.
 */
async function upsertQuizRow(token, sessionData, partner1Answers, partner2Answers) {
  // Upewnij się, że session_data nie jest null – wstaw pusty obiekt jeśli brak
  const finalSessionData = sessionData || {};

  // Jeśli kolumny partnerX_answers są nieustawione, wstaw pusty obiekt, żeby nie było undefined
  const finalPartner1 = partner1Answers || {};
  const finalPartner2 = partner2Answers || {};

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .upsert({
        token,
        session_data: finalSessionData,
        partner1_answers: finalPartner1,
        partner2_answers: finalPartner2
      }, { onConflict: 'token' });
    if (error) {
      console.error("Błąd przy upsertQuizRow:", error);
    } else {
      console.log("upsertQuizRow – zapisany wiersz:", data);
    }
  } catch (err) {
    console.error("Błąd upsertQuizRow:", err);
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
  {
    category: "Romantyzm",
    questions: [
      { id: "romantyzm1",  type: "comparative", text: "Kto jest bardziej romantyczny? {p1} vs {p2}" },
      { id: "romantyzm2",  type: "comparative", text: "Kto częściej organizuje niespodzianki? {p1} vs {p2}" },
      { id: "romantyzm3",  type: "comparative", text: "Kto lepiej planuje romantyczne kolacje? {p1} vs {p2}" },
      { id: "romantyzm4",  type: "comparative", text: "Kto bardziej pamięta romantyczne chwile? {p1} vs {p2}" },
      { id: "romantyzm5",  type: "comparative", text: "Kto lepiej wyraża swoje uczucia? {p1} vs {p2}" },
      { id: "romantyzm6",  type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej sentymentalny niż {p2}?" },
      { id: "romantyzm7",  type: "yesno",       text: "Czy {p2} częściej inicjuje romantyczne gesty?" },
      { id: "romantyzm8",  type: "yesno",       text: "Czy oboje dbacie o romantyczną atmosferę w związku?" },
      { id: "romantyzm9",  type: "yesno",       text: "Czy {p1} częściej myśli o niespodziankach?" },
      { id: "romantyzm10", type: "yesno",       text: "Czy {p2} lepiej utrzymuje romantyczny nastrój?" }
    ]
  },
  {
    category: "Przygody i spontaniczność",
    questions: [
      { id: "przygody1",   type: "comparative", text: "Kto jest bardziej spontaniczny? {p1} vs {p2}" },
      { id: "przygody2",   type: "comparative", text: "Kto częściej inicjuje niespodziankę? {p1} vs {p2}" },
      { id: "przygody3",   type: "comparative", text: "Kto bardziej kocha przygody? {p1} vs {p2}" },
      { id: "przygody4",   type: "comparative", text: "Kto częściej podejmuje ryzykowne decyzje? {p1} vs {p2}" },
      { id: "przygody5",   type: "comparative", text: "Kto lepiej adaptuje się do nowych sytuacji? {p1} vs {p2}" },
      { id: "przygody6",   type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej otwarty na nowe doświadczenia?" },
      { id: "przygody7",   type: "yesno",       text: "Czy {p2} częściej szuka przygód?" },
      { id: "przygody8",   type: "yesno",       text: "Czy oboje podejmujecie spontaniczne decyzje?" },
      { id: "przygody9",   type: "yesno",       text: "Czy {p1} jest bardziej skłonny do spontanicznych wypraw?" },
      { id: "przygody10",  type: "yesno",       text: "Czy {p2} lepiej radzi sobie w nieprzewidywalnych sytuacjach?" }
    ]
  },
  {
    category: "Plany na przyszłość",
    questions: [
      { id: "przyszlosc1",  type: "comparative", text: "Kto jest bardziej zorientowany na przyszłość? {p1} vs {p2}" },
      { id: "przyszlosc2",  type: "comparative", text: "Kto częściej planuje długoterminowe cele? {p1} vs {p2}" },
      { id: "przyszlosc3",  type: "comparative", text: "Kto lepiej wizualizuje wspólną przyszłość? {p1} vs {p2}" },
      { id: "przyszlosc4",  type: "comparative", text: "Kto częściej myśli o wspólnych planach? {p1} vs {p2}" },
      { id: "przyszlosc5",  type: "comparative", text: "Kto bardziej angażuje się w planowanie przyszłości? {p1} vs {p2}" },
      { id: "przyszlosc6",  type: "yesno",       text: "Czy uważasz, że {p1} lepiej planuje przyszłość niż {p2}?" },
      { id: "przyszlosc7",  type: "yesno",       text: "Czy {p2} częściej myśli o długoterminowych celach?" },
      { id: "przyszlosc8",  type: "yesno",       text: "Czy oboje macie podobne wizje przyszłości?" },
      { id: "przyszlosc9",  type: "yesno",       text: "Czy {p1} jest bardziej zdecydowany w planach?" },
      { id: "przyszlosc10", type: "yesno",       text: "Czy {p2} częściej przejmuje inicjatywę w planowaniu przyszłości?" }
    ]
  },
  {
    category: "Intymność",
    questions: [
      { id: "intymnosc1",  type: "comparative", text: "Kto jest bardziej czuły? {p1} vs {p2}" },
      { id: "intymnosc2",  type: "comparative", text: "Kto częściej inicjuje intymne gesty? {p1} vs {p2}" },
      { id: "intymnosc3",  type: "comparative", text: "Kto lepiej rozumie potrzeby partnera? {p1} vs {p2}" },
      { id: "intymnosc4",  type: "comparative", text: "Kto częściej wyraża swoje uczucia? {p1} vs {p2}" },
      { id: "intymnosc5",  type: "comparative", text: "Kto jest bardziej zmysłowy? {p1} vs {p2}" },
      { id: "intymnosc6",  type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej intymny niż {p2}?" },
      { id: "intymnosc7",  type: "yesno",       text: "Czy {p2} częściej dba o intymność w związku?" },
      { id: "intymnosc8",  type: "yesno",       text: "Czy oboje czujecie głęboką więź emocjonalną?" },
      { id: "intymnosc9",  type: "yesno",       text: "Czy {p1} lepiej komunikuje swoje potrzeby intymne?" },
      { id: "intymnosc10", type: "yesno",       text: "Czy {p2} częściej okazuje uczucia w sposób intymny?" }
    ]
  }
];


/*************** 5) Logika quizu ***************/

/**
 * Tworzy nowy quiz: wstawiamy wiersz z tokenem, session_data = { partner1Name, partner2Name, ... },
 * partner1_answers i partner2_answers ustawiamy jako pusty obiekt {}.
 */
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
    // session_data (metadane)
    const sessionData = {
      partner1Name: p1,
      partner2Name: p2,
      selectedCategories: [],
      quizQuestions: []
    };
    // Tworzymy nowy wiersz z pustymi odpowiedziami
    await upsertQuizRow(token, sessionData, {}, {});
    console.log("Utworzono quiz, token:", token);
    window.location.href = `?token=${token}&partner=1`;
  });
}

/**
 * Wybór kategorii przez Partnera 1 – aktualizujemy session_data w bazie,
 * ale partner1_answers i partner2_answers pozostają nienaruszone.
 */
async function showCategorySelection(token, sessionData) {
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
    if (!selected.length) {
      alert("Wybierz przynajmniej jedną kategorię.");
      return;
    }
    const selectedCats = fullQuizData.filter(cat => selected.includes(cat.category));
    sessionData.selectedCategories = selectedCats;
    // Zapisz z powrotem w session_data
    await upsertQuizRow(token, sessionData, sessionData.partner1_answers || {}, sessionData.partner2_answers || {});
    showQuizLink(token, sessionData);
  });
}

/**
 * Strona linku dla Partnera 2 i przycisk startu dla Partnera 1
 */
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

/**
 * Rozpoczęcie quizu – budujemy listę pytań z wybranych kategorii, zapisujemy w session_data.
 */
async function startQuiz(token, sessionData, partner) {
  let quizQuestions = [];
  const cats = sessionData.selectedCategories && sessionData.selectedCategories.length > 0
    ? sessionData.selectedCategories
    : fullQuizData;
  cats.forEach(cat => {
    cat.questions.forEach(q => {
      quizQuestions.push({ ...q, category: cat.category });
    });
  });
  sessionData.quizQuestions = quizQuestions;
  // Zapisz session_data
  // Do upsertu pobierzmy aktualne partner1_answers i partner2_answers, by nie nadpisać
  const existingRow = await loadQuizRow(token);
  const existingSessionData = existingRow?.session_data || {};
  const p1Answers = existingRow?.partner1_answers || {};
  const p2Answers = existingRow?.partner2_answers || {};

  // Scal session_data (by zachować partner1Name, partner2Name)
  const newSessionData = { ...existingSessionData, ...sessionData };
  await upsertQuizRow(token, newSessionData, p1Answers, p2Answers);

  // Odpowiedzi lokalne
  let localAnswers = {};
  showQuestion(0, quizQuestions, token, newSessionData, partner, localAnswers);
}

/** Wyświetlanie pojedynczego pytania */
function showQuestion(index, quizQuestions, token, sessionData, partner, localAnswers) {
  if (index >= quizQuestions.length) {
    console.log(`Partner ${partner} ukończył quiz. Zapisujemy odpowiedzi w partner${partner}_answers.`);
    saveFinalAnswers(token, sessionData, partner, localAnswers);
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
      localAnswers[current.id] = {
        category: current.category,
        type: current.type,
        answer
      };
      setTimeout(() => {
        showQuestion(index + 1, quizQuestions, token, sessionData, partner, localAnswers);
      }, 300);
    });
  });
}

/**
 * Po ukończeniu quizu przez danego partnera – zapisujemy odpowiedzi w partnerX_answers,
 * ale jednocześnie zachowujemy session_data i drugą kolumnę z odpowiedziami drugiego partnera.
 */
async function saveFinalAnswers(token, sessionData, partner, localAnswers) {
  // Pobierz bieżący stan, by wypełnić resztę kolumn
  const row = await loadQuizRow(token);
  if (!row) {
    console.error("Nie znaleziono wiersza, nie można zapisać odpowiedzi partnera.");
    return;
  }
  // Metadane
  const finalSessionData = row.session_data || {};
  // Odpowiedzi drugiego partnera
  const p1Answers = row.partner1_answers || {};
  const p2Answers = row.partner2_answers || {};

  if (partner === "1") {
    // Zaktualizuj partner1_answers
    const merged1 = { ...p1Answers, ...localAnswers };
    await upsertQuizRow(token, finalSessionData, merged1, p2Answers);
  } else {
    // Zaktualizuj partner2_answers
    const merged2 = { ...p2Answers, ...localAnswers };
    await upsertQuizRow(token, finalSessionData, p1Answers, merged2);
  }
  // Po zapisaniu – sprawdź wyniki
  showQuizResults(token);
}

/** Wyświetlanie wyników – czekamy, aż oboje partnerzy zakończą */
async function showQuizResults(token) {
  const row = await loadQuizRow(token);
  if (!row) {
    appDiv.innerHTML = "<p>Błąd: Nie można załadować quizu z bazy.</p>";
    return;
  }
  const sessionData = row.session_data || {};
  const answers1 = row.partner1_answers || {};
  const answers2 = row.partner2_answers || {};
  const p1 = sessionData.partner1Name || "Partner1";
  const p2 = sessionData.partner2Name || "Partner2";
  const quizQuestions = sessionData.quizQuestions || [];

  // Sprawdź, czy oboje mają komplet
  if (Object.keys(answers1).length !== quizQuestions.length ||
      Object.keys(answers2).length !== quizQuestions.length) {
    console.log("Oczekiwanie na zakończenie quizu przez oboje partnerów...");
    appDiv.innerHTML = `<p>Oczekiwanie na zakończenie quizu przez oboje partnerów...</p>`;
    setTimeout(() => showQuizResults(token), 1000);
    return;
  }
  // Oblicz zgodność
  let total = quizQuestions.length;
  let agreements = 0;
  let detailsHTML = quizQuestions.map(q => {
    const questionText = formatText(q.text, p1, p2);
    const a1 = answers1[q.id]?.answer;
    const a2 = answers2[q.id]?.answer;
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
    // Partner 1 tworzy quiz
    showCreateQuiz();
  } else {
    const row = await loadQuizRow(token);
    if (!row) {
      appDiv.innerHTML = "<p>Błąd: Nie znaleziono quizu w bazie. Sprawdź link.</p>";
      return;
    }
    const sessionData = row.session_data || {};

    if (partner === "1") {
      // Partner 1 – jeśli nie wybrał kategorii, pokaż wybór
      if (!sessionData.selectedCategories || sessionData.selectedCategories.length === 0) {
        showCategorySelection(token, sessionData);
      } else {
        showQuizLink(token, sessionData);
      }
    } else if (partner === "2") {
      console.log("Partner 2 wykryty – uruchamiam quiz.");
      // Sprawdź, czy quizQuestions istnieje
      if (!sessionData.quizQuestions || sessionData.quizQuestions.length === 0) {
        appDiv.innerHTML = `<p>Partner 1 nie skonfigurował jeszcze quizu.</p>`;
        return;
      }
      startQuiz(token, sessionData, "2");
    } else {
      appDiv.innerHTML = "<p>Błąd: Nieprawidłowy parametr partner.</p>";
    }
  }
})();

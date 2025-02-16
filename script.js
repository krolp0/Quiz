/*************** 1) Deklaracja głównego elementu ***************/
// Załóżmy, że w index.html masz: <div class="container" id="app">Ładowanie...</div>
const appDiv = document.getElementById('app');

/*************** 2) Konfiguracja Supabase ***************/
// Skopiuj dokładnie swój URL i klucz anon:
const SUPABASE_URL = "https://mdpyylbbhgvtbrpuejet.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHl5bGJiaGd2dGJycHVlamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MzIxMzIsImV4cCI6MjA1NTIwODEzMn0.31noUOdLve6sKZAA2iTgzKd8nO0Zrz9tel5nbEziMHo";
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*************** 3) Funkcje pomocnicze ***************/
/** Pobieranie parametru z URL, np. ?token=abc123&partner=1 */
function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

/** Generowanie losowego tokenu quizu */
function generateToken() {
  return Math.random().toString(36).substr(2, 8);
}

/** Zapis sesji w tabeli 'quizzes' */
async function saveSession(token, sessionData) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .upsert({ token, session_data: sessionData });
    if (error) {
      console.error("Błąd przy zapisie do Supabase:", error);
    } else {
      console.log("Sesja zapisana w Supabase:", data);
    }
  } catch (err) {
    console.error("Błąd przy zapisie sesji:", err);
  }
}

/** Odczyt sesji z tabeli 'quizzes' */
async function loadSession(token) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('session_data')
      .eq('token', token)
      .single();
    if (error) {
      console.error("Błąd przy odczycie z Supabase:", error);
      return null;
    }
    return data ? data.session_data : null;
  } catch (err) {
    console.error("Błąd loadSession:", err);
    return null;
  }
}

/** Zamiana placeholderów {p1}, {p2} w tekście */
function formatText(text, p1, p2) {
  return text.replace(/{p1}/g, p1).replace(/{p2}/g, p2);
}

/*************** 4) Dane Quizu ***************/
/** Pełna baza pytań – 5 kategorii, każda 10 pytań */
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
      { id: "przygody2",   type: "comparative", text: "Kto częściej inicjuje niespodziewane wypady? {p1} vs {p2}" },
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

/** Partner 1 tworzy quiz (wpisuje dwa imiona) */
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
    const sessionData = {
      token,
      partner1Name: p1,
      partner2Name: p2,
      answers: {}
    };
    await saveSession(token, sessionData);
    console.log("Utworzono quiz, token:", token);
    // Przekierowanie do Partnera 1
    window.location.href = `?token=${token}&partner=1`;
  });
}

/** Partner 1 widzi link dla Partnera 2 i przycisk "Rozpocznij quiz" */
async function showQuizLink(sessionData) {
  const baseUrl = window.location.origin + window.location.pathname;
  const partner2Link = `${baseUrl}?token=${sessionData.token}&partner=2`;
  appDiv.innerHTML = `
    <h2>Quiz stworzony!</h2>
    <p>Wyślij ten link Partnerowi 2:</p>
    <div class="link-box" id="partner2Link">${partner2Link}</div>
    <button id="copyBtn">Kopiuj link</button>
    <hr />
    <p>Jako <strong>${sessionData.partner1Name}</strong> możesz już rozpocząć quiz.</p>
    <button id="startQuizBtn">Rozpocznij quiz</button>
  `;
  document.getElementById('copyBtn').addEventListener('click', () => {
    const linkText = document.getElementById('partner2Link').innerText;
    navigator.clipboard.writeText(linkText).then(() => {
      alert("Link został skopiowany!");
    });
  });
  document.getElementById('startQuizBtn').addEventListener('click', () => {
    startQuiz(sessionData, "1");
  });
}

/** Rozpoczęcie quizu – używamy wszystkich kategorii */
async function startQuiz(sessionData, partner) {
  console.log(`startQuiz dla partner=${partner}`);
  let quizQuestions = [];
  // Ładujemy WSZYSTKIE pytania (bez wyboru kategorii)
  fullQuizData.forEach(cat => {
    cat.questions.forEach(q => {
      quizQuestions.push({ ...q, category: cat.category });
    });
  });
  sessionData.quizQuestions = quizQuestions;
  if (!sessionData.answers["partner" + partner]) {
    sessionData.answers["partner" + partner] = {};
  }
  await saveSession(sessionData.token, sessionData);
  showQuestion(0, quizQuestions, sessionData, partner);
}

/** Wyświetlanie pojedynczego pytania z przyciskiem "Przejdź dalej" */
async function showQuestion(index, quizQuestions, sessionData, partner) {
  if (index >= quizQuestions.length) {
    console.log(`Partner ${partner} skończył odpowiadać.`);
    await saveSession(sessionData.token, sessionData);
    showQuizResults(sessionData);
    return;
  }
  const total = quizQuestions.length;
  const current = quizQuestions[index];
  const p1 = sessionData.partner1Name;
  const p2 = sessionData.partner2Name;
  const questionText = formatText(current.text, p1, p2);
  
  let optionsHTML = "";
  if (current.type === "comparative") {
    // "1" oznacza p1, "2" oznacza p2
    optionsHTML = `
      <div class="tile" data-answer="1">${p1}</div>
      <div class="tile" data-answer="2">${p2}</div>
    `;
  } else if (current.type === "yesno") {
    // "tak" / "nie"
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
    <div id="nextContainer" style="display: none; text-align: center; margin-top: 20px;">
      <button id="nextBtn">Przejdź dalej</button>
    </div>
  `;
  
  let selectedAnswer = null;
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', () => {
      // Podświetlenie wybranego kafelka
      document.querySelectorAll('.tile').forEach(t => t.style.border = "none");
      tile.style.border = "2px solid #d6336c";
      selectedAnswer = tile.getAttribute('data-answer');
      // Pokazujemy przycisk
      document.getElementById('nextContainer').style.display = "block";
    });
  });
  
  // Po kliknięciu "Przejdź dalej"
  document.getElementById('nextBtn').addEventListener('click', async () => {
    if (!selectedAnswer) {
      alert("Wybierz odpowiedź, aby przejść dalej.");
      return;
    }
    // Zapisujemy odpowiedź
    sessionData.answers["partner" + partner][current.id] = {
      category: current.category,
      type: current.type,
      answer: selectedAnswer
    };
    await saveSession(sessionData.token, sessionData);
    showQuestion(index + 1, quizQuestions, sessionData, partner);
  });
}

/** Wyświetlanie wyników: procent zgodności + szczegółowe odpowiedzi */
async function showQuizResults(sessionData) {
  // Ładujemy najnowsze dane (Partner 2 mógł jeszcze coś dopisać)
  const latestSession = await loadSession(sessionData.token);
  if (!latestSession) {
    appDiv.innerHTML = "<p>Błąd: Nie można załadować quizu z bazy.</p>";
    return;
  }
  const quizQuestions = latestSession.quizQuestions;
  const answers1 = latestSession.answers.partner1;
  const answers2 = latestSession.answers.partner2;
  const p1 = latestSession.partner1Name;
  const p2 = latestSession.partner2Name;
  
  // Jeśli jedna osoba nie skończyła
  if (!answers1 || !answers2 || Object.keys(answers1).length !== quizQuestions.length || Object.keys(answers2).length !== quizQuestions.length) {
    console.log("Jeszcze nie wszyscy skończyli. Polling...");
    appDiv.innerHTML = `<p>Oczekiwanie na zakończenie quizu przez oboje partnerów...</p>`;
    setTimeout(() => showQuizResults(latestSession), 5000);
    return;
  }
  
  // Obliczanie procentu zgodności
  let total = quizQuestions.length;
  let agreements = 0;
  quizQuestions.forEach(q => {
    const a1 = answers1[q.id]?.answer;
    const a2 = answers2[q.id]?.answer;
    if (a1 === a2) {
      agreements++;
    }
  });
  const overallAgreement = ((agreements / total) * 100).toFixed(2);

  // Szczegółowe porównanie odpowiedzi
  let detailsHTML = quizQuestions.map(q => {
    const a1 = answers1[q.id]?.answer;
    const a2 = answers2[q.id]?.answer;

    // Zamieniamy "1" -> p1, "2" -> p2, a "tak"/"nie" zostawiamy
    const answer1 = (a1 === "1") ? p1 : (a1 === "2") ? p2 : a1;
    const answer2 = (a2 === "1") ? p2 : (a2 === "2") ? p2 : a2;
    // Uwaga: w if (a2 === "1") moglibyśmy dać p1, ale tu zależy, co chcesz pokazać
    // Najczęściej "1" = Partner 1, "2" = Partner 2, "tak"/"nie" = tak/nie.

    return `
      <li>
        <strong>${q.category}: ${q.text}</strong><br />
        <em>Partner 1:</em> ${answer1}<br />
        <em>Partner 2:</em> ${answer2}
      </li>
    `;
  }).join("");

  appDiv.innerHTML = `
    <h2>Wyniki Quizu</h2>
    <p><strong>${p1}</strong> vs <strong>${p2}</strong></p>
    <p>Ogólna zgodność: <strong>${overallAgreement}%</strong></p>
    <h3>Szczegółowe odpowiedzi:</h3>
    <ul>${detailsHTML}</ul>
    <button id="resetBtn">Resetuj Quiz</button>
  `;
  document.getElementById('resetBtn').addEventListener('click', async () => {
    // Po prostu przeładowujemy stronę
    window.location.href = window.location.origin + window.location.pathname;
  });
}

/*************** 6) Główna logika ***************/
(async function main() {
  const token = getQueryParam('token');
  const partner = getQueryParam('partner');
  console.log("Token:", token, "Partner:", partner);

  if (!token) {
    // Partner 1 tworzy nowy quiz
    showCreateQuiz();
  } else {
    // Odczytujemy dane z Supabase
    const sessionData = await loadSession(token);
    console.log("Załadowane sessionData:", sessionData);

    if (!sessionData) {
      appDiv.innerHTML = "<p>Błąd: Nie znaleziono quizu w bazie. Sprawdź link.</p>";
      return;
    }
    if (partner === "1") {
      // Partner 1 → widzi link do Partnera 2 i przycisk "Rozpocznij quiz"
      showQuizLink(sessionData);
    } else if (partner === "2") {
      // Partner 2 → od razu startuje quiz
      console.log("Partner 2 wykryty – uruchamiam quiz.");
      startQuiz(sessionData, "2");
    } else {
      appDiv.innerHTML = "<p>Błąd: Nieprawidłowy parametr partner.</p>";
    }
  }
})();

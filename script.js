
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

  // Jeśli kolumny partnerX_answers są nieustawione, wstaw pusty obiekt
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
// Pełna baza pytań – 5 kategorii × 3 poziomy, itp.
/*************** 1) Definicja pytań (fullQuizData) ***************/
const fullQuizData = [
  // 1) Życie codzienne – 3 poziomy
  {
    category: "Życie codzienne (Łatwa)",
    questions: [
      { id: "codzienne_easy1",  type: "comparative", text: "Kto częściej robi poranne śniadanie? {p1} vs {p2}" },
      { id: "codzienne_easy2",  type: "comparative", text: "Kto szybciej ogarnia zakupy spożywcze? {p1} vs {p2}" },
      { id: "codzienne_easy3",  type: "comparative", text: "Kto bardziej lubi organizować wspólne spacery? {p1} vs {p2}" },
      { id: "codzienne_easy4",  type: "comparative", text: "Kto częściej rozładowuje zmywarkę? {p1} vs {p2}" },
      { id: "codzienne_easy5",  type: "comparative", text: "Kto jest bardziej punktualny na co dzień? {p1} vs {p2}" },
      { id: "codzienne_easy6",  type: "yesno",       text: "Czy uważasz, że {p1} chętniej pomaga w gotowaniu?" },
      { id: "codzienne_easy7",  type: "yesno",       text: "Czy {p2} częściej dba o czystość w mieszkaniu?" },
      { id: "codzienne_easy8",  type: "yesno",       text: "Czy oboje lubicie podobne aktywności w wolnym czasie?" },
      { id: "codzienne_easy9",  type: "yesno",       text: "Czy {p1} pamięta o terminach rachunków?" },
      { id: "codzienne_easy10", type: "yesno",       text: "Czy {p2} jest bardziej zorganizowany w planowaniu dnia?" }
    ]
  },
  {
    category: "Życie codzienne (Trudna)",
    questions: [
      { id: "codzienne_hard1",  type: "comparative", text: "Kto potrafi lepiej zarządzać domowym budżetem? {p1} vs {p2}" },
      { id: "codzienne_hard2",  type: "comparative", text: "Kto częściej dba o porządek w łazience? {p1} vs {p2}" },
      { id: "codzienne_hard3",  type: "comparative", text: "Kto lepiej planuje tygodniowy jadłospis? {p1} vs {p2}" },
      { id: "codzienne_hard4",  type: "comparative", text: "Kto częściej ogarnia naprawy i konserwacje? {p1} vs {p2}" },
      { id: "codzienne_hard5",  type: "comparative", text: "Kto jest bardziej konsekwentny w codziennych zadaniach? {p1} vs {p2}" },
      { id: "codzienne_hard6",  type: "yesno",       text: "Czy {p1} lubi spisywać listy rzeczy do zrobienia?" },
      { id: "codzienne_hard7",  type: "yesno",       text: "Czy {p2} przejmuje się bardziej drobnymi wydatkami?" },
      { id: "codzienne_hard8",  type: "yesno",       text: "Czy oboje macie podobne tempo wykonywania obowiązków?" },
      { id: "codzienne_hard9",  type: "yesno",       text: "Czy {p1} jest bardziej rygorystyczny w pilnowaniu porządku?" },
      { id: "codzienne_hard10", type: "yesno",       text: "Czy {p2} częściej planuje zakupy z wyprzedzeniem?" }
    ]
  },
  {
    category: "Życie codzienne (Najtrudniejsza)",
    questions: [
      { id: "codzienne_extreme1",  type: "comparative", text: "Kto częściej przejmuje inicjatywę w trudnych sytuacjach domowych? {p1} vs {p2}" },
      { id: "codzienne_extreme2",  type: "comparative", text: "Kto lepiej radzi sobie z presją czasu w codziennych obowiązkach? {p1} vs {p2}" },
      { id: "codzienne_extreme3",  type: "comparative", text: "Kto bardziej zwraca uwagę na detale w organizacji domu? {p1} vs {p2}" },
      { id: "codzienne_extreme4",  type: "comparative", text: "Kto lepiej ustala priorytety przy dużej liczbie zadań? {p1} vs {p2}" },
      { id: "codzienne_extreme5",  type: "comparative", text: "Kto potrafi lepiej motywować drugą osobę do działania? {p1} vs {p2}" },
      { id: "codzienne_extreme6",  type: "yesno",       text: "Czy uważasz, że {p1} ma bardziej zdyscyplinowane podejście do domowych obowiązków?" },
      { id: "codzienne_extreme7",  type: "yesno",       text: "Czy {p2} częściej narzuca wysokie standardy czystości?" },
      { id: "codzienne_extreme8",  type: "yesno",       text: "Czy oboje macie takie same priorytety w kwestii codziennej organizacji?" },
      { id: "codzienne_extreme9",  type: "yesno",       text: "Czy {p1} jest bardziej wymagający wobec siebie i partnera?" },
      { id: "codzienne_extreme10", type: "yesno",       text: "Czy {p2} potrafi podejmować trudne decyzje w sprawach domowych?" }
    ]
  },
  // 2) Romantyzm – 3 poziomy
  {
    category: "Romantyzm (Łatwa)",
    questions: [
      { id: "romantyzm_easy1",  type: "comparative", text: "Kto częściej wysyła miłe wiadomości w ciągu dnia? {p1} vs {p2}" },
      { id: "romantyzm_easy2",  type: "comparative", text: "Kto bardziej lubi romantyczne filmy? {p1} vs {p2}" },
      { id: "romantyzm_easy3",  type: "comparative", text: "Kto częściej proponuje wieczorne spacery? {p1} vs {p2}" },
      { id: "romantyzm_easy4",  type: "comparative", text: "Kto jest bardziej sentymentalny? {p1} vs {p2}" },
      { id: "romantyzm_easy5",  type: "comparative", text: "Kto chętniej słucha romantycznej muzyki? {p1} vs {p2}" },
      { id: "romantyzm_easy6",  type: "yesno",       text: "Czy {p1} częściej planuje wspólne kolacje przy świecach?" },
      { id: "romantyzm_easy7",  type: "yesno",       text: "Czy {p2} pisze częściej liściki z miłymi słowami?" },
      { id: "romantyzm_easy8",  type: "yesno",       text: "Czy oboje cieszycie się na wspólne oglądanie zachodu słońca?" },
      { id: "romantyzm_easy9",  type: "yesno",       text: "Czy {p1} bardziej dba o rocznice i ważne daty?" },
      { id: "romantyzm_easy10", type: "yesno",       text: "Czy {p2} jest skłonny do romantycznych niespodzianek?" }
    ]
  },
  {
    category: "Romantyzm (Trudna)",
    questions: [
      { id: "romantyzm_hard1",  type: "comparative", text: "Kto głębiej przeżywa romantyczne wspomnienia? {p1} vs {p2}" },
      { id: "romantyzm_hard2",  type: "comparative", text: "Kto częściej organizuje wyjątkowe randki? {p1} vs {p2}" },
      { id: "romantyzm_hard3",  type: "comparative", text: "Kto jest bardziej kreatywny w wyrażaniu uczuć? {p1} vs {p2}" },
      { id: "romantyzm_hard4",  type: "comparative", text: "Kto potrafi lepiej zaskoczyć partnera drobnymi gestami? {p1} vs {p2}" },
      { id: "romantyzm_hard5",  type: "comparative", text: "Kto lepiej dba o romantyczną atmosferę na co dzień? {p1} vs {p2}" },
      { id: "romantyzm_hard6",  type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej otwarty w okazywaniu uczuć?" },
      { id: "romantyzm_hard7",  type: "yesno",       text: "Czy {p2} częściej chce rozmawiać o emocjach i marzeniach?" },
      { id: "romantyzm_hard8",  type: "yesno",       text: "Czy oboje jesteście na tym samym poziomie romantyczności?" },
      { id: "romantyzm_hard9",  type: "yesno",       text: "Czy {p1} chętniej pisze wiersze lub listy miłosne?" },
      { id: "romantyzm_hard10", type: "yesno",       text: "Czy {p2} częściej wyraża miłość poprzez gesty i prezenty?" }
    ]
  },
  {
    category: "Romantyzm (Najtrudniejsza)",
    questions: [
      { id: "romantyzm_extreme1",  type: "comparative", text: "Kto głębiej analizuje symbolikę romantycznych gestów? {p1} vs {p2}" },
      { id: "romantyzm_extreme2",  type: "comparative", text: "Kto częściej inicjuje rozmowy o wspólnej przyszłości? {p1} vs {p2}" },
      { id: "romantyzm_extreme3",  type: "comparative", text: "Kto jest bardziej wrażliwy na brak romantycznych gestów? {p1} vs {p2}" },
      { id: "romantyzm_extreme4",  type: "comparative", text: "Kto potrafi mocniej zaskoczyć partnera w kluczowych momentach? {p1} vs {p2}" },
      { id: "romantyzm_extreme5",  type: "comparative", text: "Kto lepiej pamięta szczegóły pierwszych randek? {p1} vs {p2}" },
      { id: "romantyzm_extreme6",  type: "yesno",       text: "Czy {p1} częściej domaga się głębokich wyznań uczuć?" },
      { id: "romantyzm_extreme7",  type: "yesno",       text: "Czy {p2} bardziej potrzebuje romantycznych potwierdzeń miłości?" },
      { id: "romantyzm_extreme8",  type: "yesno",       text: "Czy oboje macie podobne oczekiwania co do intensywności romantyzmu?" },
      { id: "romantyzm_extreme9",  type: "yesno",       text: "Czy {p1} czasem ma zbyt wysokie wymagania co do romantycznych gestów?" },
      { id: "romantyzm_extreme10", type: "yesno",       text: "Czy {p2} uważa, że romantyzm to klucz do szczęśliwego związku?" }
    ]
  },
  // 3) Przygody i spontaniczność – 3 poziomy
  {
    category: "Przygody i spontaniczność (Łatwa)",
    questions: [
      { id: "przygody_easy1",  type: "comparative", text: "Kto częściej proponuje spontaniczne wypady? {p1} vs {p2}" },
      { id: "przygody_easy2",  type: "comparative", text: "Kto bardziej lubi krótkie, nieplanowane wycieczki? {p1} vs {p2}" },
      { id: "przygody_easy3",  type: "comparative", text: "Kto częściej zaskakuje partnera pomysłami na weekend? {p1} vs {p2}" },
      { id: "przygody_easy4",  type: "comparative", text: "Kto chętniej próbuje nowych aktywności na co dzień? {p1} vs {p2}" },
      { id: "przygody_easy5",  type: "comparative", text: "Kto bardziej lubi spontaniczne spotkania ze znajomymi? {p1} vs {p2}" },
      { id: "przygody_easy6",  type: "yesno",       text: "Czy {p1} jest otwarty na niespodziewane wyzwania?" },
      { id: "przygody_easy7",  type: "yesno",       text: "Czy {p2} czasem boi się spontanicznych decyzji?" },
      { id: "przygody_easy8",  type: "yesno",       text: "Czy oboje macie podobne tempo życia na co dzień?" },
      { id: "przygody_easy9",  type: "yesno",       text: "Czy {p1} częściej rezygnuje z planów, by zrobić coś spontanicznego?" },
      { id: "przygody_easy10", type: "yesno",       text: "Czy {p2} uważa spontaniczność za istotny element w związku?" }
    ]
  },
  {
    category: "Przygody i spontaniczność (Trudna)",
    questions: [
      { id: "przygody_hard1",  type: "comparative", text: "Kto jest bardziej skłonny do ryzykownych decyzji w podróży? {p1} vs {p2}" },
      { id: "przygody_hard2",  type: "comparative", text: "Kto częściej przekonuje partnera do nieplanowanych aktywności? {p1} vs {p2}" },
      { id: "przygody_hard3",  type: "comparative", text: "Kto potrafi lepiej improwizować w niespodziewanych sytuacjach? {p1} vs {p2}" },
      { id: "przygody_hard4",  type: "comparative", text: "Kto ma większą chęć próbowania ekstremalnych sportów? {p1} vs {p2}" },
      { id: "przygody_hard5",  type: "comparative", text: "Kto bardziej pociąga partnera w kierunku nowych doświadczeń? {p1} vs {p2}" },
      { id: "przygody_hard6",  type: "yesno",       text: "Czy {p1} bywa zbyt zachowawczy przy spontanicznych planach?" },
      { id: "przygody_hard7",  type: "yesno",       text: "Czy {p2} częściej namawia na dalekie, nieplanowane podróże?" },
      { id: "przygody_hard8",  type: "yesno",       text: "Czy oboje akceptujecie nagłe zmiany planów bez stresu?" },
      { id: "przygody_hard9",  type: "yesno",       text: "Czy {p1} czasem waha się z podjęciem spontanicznych decyzji?" },
      { id: "przygody_hard10", type: "yesno",       text: "Czy {p2} uważa, że spontaniczność ożywia waszą relację?" }
    ]
  },
  {
    category: "Przygody i spontaniczność (Najtrudniejsza)",
    questions: [
      { id: "przygody_extreme1",  type: "comparative", text: "Kto lepiej odnajduje się w totalnie nieprzewidywalnych okolicznościach? {p1} vs {p2}" },
      { id: "przygody_extreme2",  type: "comparative", text: "Kto chętniej bierze udział w ekstremalnych formach rozrywki? {p1} vs {p2}" },
      { id: "przygody_extreme3",  type: "comparative", text: "Kto bardziej czerpie radość z podejmowania ryzyka? {p1} vs {p2}" },
      { id: "przygody_extreme4",  type: "comparative", text: "Kto szybciej adaptuje się do niespodziewanych zmian planu? {p1} vs {p2}" },
      { id: "przygody_extreme5",  type: "comparative", text: "Kto częściej namawia na przygody w nieznanych miejscach? {p1} vs {p2}" },
      { id: "przygody_extreme6",  type: "yesno",       text: "Czy {p1} potrzebuje silniejszych bodźców przygodowych?" },
      { id: "przygody_extreme7",  type: "yesno",       text: "Czy {p2} jest bardziej odporny na stres związany ze spontanicznymi decyzjami?" },
      { id: "przygody_extreme8",  type: "yesno",       text: "Czy oboje macie takie samo podejście do ryzyka i adrenaliny?" },
      { id: "przygody_extreme9",  type: "yesno",       text: "Czy {p1} uważa, że spontaniczność jest kluczem do rozwoju relacji?" },
      { id: "przygody_extreme10", type: "yesno",       text: "Czy {p2} kiedykolwiek hamuje spontaniczne plany z obawy przed konsekwencjami?" }
    ]
  },
  // 4) Plany na przyszłość – 3 poziomy
  {
    category: "Plany na przyszłość (Łatwa)",
    questions: [
      { id: "przyszlosc_easy1",  type: "comparative", text: "Kto częściej myśli o wspólnym urlopie? {p1} vs {p2}" },
      { id: "przyszlosc_easy2",  type: "comparative", text: "Kto chętniej snuje marzenia o przyszłym domu? {p1} vs {p2}" },
      { id: "przyszlosc_easy3",  type: "comparative", text: "Kto częściej proponuje pomysły na najbliższe lata? {p1} vs {p2}" },
      { id: "przyszlosc_easy4",  type: "comparative", text: "Kto bardziej dba o oszczędzanie na wspólne cele? {p1} vs {p2}" },
      { id: "przyszlosc_easy5",  type: "comparative", text: "Kto częściej mówi o ślubie lub zaręczynach? {p1} vs {p2}" },
      { id: "przyszlosc_easy6",  type: "yesno",       text: "Czy {p1} marzy o założeniu rodziny w niedalekiej przyszłości?" },
      { id: "przyszlosc_easy7",  type: "yesno",       text: "Czy {p2} woli koncentrować się na teraźniejszości niż przyszłości?" },
      { id: "przyszlosc_easy8",  type: "yesno",       text: "Czy oboje macie podobne wyobrażenia o wspólnym mieszkaniu?" },
      { id: "przyszlosc_easy9",  type: "yesno",       text: "Czy {p1} częściej planuje wspólne wyjazdy?" },
      { id: "przyszlosc_easy10", type: "yesno",       text: "Czy {p2} ma już konkretne plany na najbliższe lata?" }
    ]
  },
  {
    category: "Plany na przyszłość (Trudna)",
    questions: [
      { id: "przyszlosc_hard1",  type: "comparative", text: "Kto bardziej myśli o stabilizacji finansowej? {p1} vs {p2}" },
      { id: "przyszlosc_hard2",  type: "comparative", text: "Kto częściej analizuje ryzyko związane z długoterminowymi planami? {p1} vs {p2}" },
      { id: "przyszlosc_hard3",  type: "comparative", text: "Kto jest bardziej zorientowany na karierę zawodową? {p1} vs {p2}" },
      { id: "przyszlosc_hard4",  type: "comparative", text: "Kto chętniej rozmawia o posiadaniu dzieci? {p1} vs {p2}" },
      { id: "przyszlosc_hard5",  type: "comparative", text: "Kto ma bardziej sprecyzowane cele życiowe? {p1} vs {p2}" },
      { id: "przyszlosc_hard6",  type: "yesno",       text: "Czy uważasz, że {p1} jest bardziej zdecydowany co do waszej przyszłości?" },
      { id: "przyszlosc_hard7",  type: "yesno",       text: "Czy {p2} czasem unika rozmów o długoterminowych zobowiązaniach?" },
      { id: "przyszlosc_hard8",  type: "yesno",       text: "Czy oboje macie podobne wartości dotyczące rodziny i pracy?" },
      { id: "przyszlosc_hard9",  type: "yesno",       text: "Czy {p1} bywa zbyt ostrożny w podejmowaniu decyzji o przyszłości?" },
      { id: "przyszlosc_hard10", type: "yesno",       text: "Czy {p2} woli spontaniczne podejście zamiast długofalowych planów?" }
    ]
  },
  {
    category: "Plany na przyszłość (Najtrudniejsza)",
    questions: [
      { id: "przyszlosc_extreme1",  type: "comparative", text: "Kto głębiej analizuje ryzyko inwestycji lub kredytów? {p1} vs {p2}" },
      { id: "przyszlosc_extreme2",  type: "comparative", text: "Kto częściej chce zabezpieczyć was finansowo na wiele lat? {p1} vs {p2}" },
      { id: "przyszlosc_extreme3",  type: "comparative", text: "Kto bardziej nalega na ustalenie wspólnych priorytetów życiowych? {p1} vs {p2}" },
      { id: "przyszlosc_extreme4",  type: "comparative", text: "Kto mocniej dąży do stabilizacji przed założeniem rodziny? {p1} vs {p2}" },
      { id: "przyszlosc_extreme5",  type: "comparative", text: "Kto potrafi lepiej zarządzać długoterminowymi celami w praktyce? {p1} vs {p2}" },
      { id: "przyszlosc_extreme6",  type: "yesno",       text: "Czy {p1} oczekuje od {p2} bardziej konkretnych deklaracji o waszej przyszłości?" },
      { id: "przyszlosc_extreme7",  type: "yesno",       text: "Czy {p2} czasem uważa, że {p1} zbyt mocno planuje każdy krok?" },
      { id: "przyszlosc_extreme8",  type: "yesno",       text: "Czy oboje macie wspólną wizję tego, gdzie będziecie za 10 lat?" },
      { id: "przyszlosc_extreme9",  type: "yesno",       text: "Czy {p1} woli stabilność niż elastyczność w planowaniu?" },
      { id: "przyszlosc_extreme10", type: "yesno",       text: "Czy {p2} czasem czuje presję, by spełnić oczekiwania {p1}?" }
    ]
  },
  // 5) Intymność – 3 poziomy
  {
    category: "Intymność (Łatwa)",
    questions: [
      { id: "intymnosc_easy1",  type: "comparative", text: "Kto częściej okazuje czułość poprzez dotyk? {p1} vs {p2}" },
      { id: "intymnosc_easy2",  type: "comparative", text: "Kto bardziej lubi długie przytulanie? {p1} vs {p2}" },
      { id: "intymnosc_easy3",  type: "comparative", text: "Kto częściej inicjuje chwile we dwoje? {p1} vs {p2}" },
      { id: "intymnosc_easy4",  type: "comparative", text: "Kto jest bardziej czuły w codziennych sytuacjach? {p1} vs {p2}" },
      { id: "intymnosc_easy5",  type: "comparative", text: "Kto chętniej rozmawia o uczuciach w łagodny sposób? {p1} vs {p2}" },
      { id: "intymnosc_easy6",  type: "yesno",       text: "Czy {p1} często przytula {p2} bez powodu?" },
      { id: "intymnosc_easy7",  type: "yesno",       text: "Czy {p2} lubi częste komplementy?" },
      { id: "intymnosc_easy8",  type: "yesno",       text: "Czy oboje doceniacie wspólny relaks przy filmie?" },
      { id: "intymnosc_easy9",  type: "yesno",       text: "Czy {p1} jest bardziej wstydliwy w okazywaniu uczuć publicznie?" },
      { id: "intymnosc_easy10", type: "yesno",       text: "Czy {p2} częściej inicjuje wieczorne rozmowy o was?" }
    ]
  },
  {
    category: "Intymność (Trudna)",
    questions: [
      { id: "intymnosc_hard1",  type: "comparative", text: "Kto lepiej rozumie potrzeby partnera w sferze bliskości? {p1} vs {p2}" },
      { id: "intymnosc_hard2",  type: "comparative", text: "Kto częściej przełamuje bariery w komunikacji o intymności? {p1} vs {p2}" },
      { id: "intymnosc_hard3",  type: "comparative", text: "Kto bardziej dba o romantyczną atmosferę przed bliskością? {p1} vs {p2}" },
      { id: "intymnosc_hard4",  type: "comparative", text: "Kto częściej dąży do pogłębienia więzi emocjonalnej? {p1} vs {p2}" },
      { id: "intymnosc_hard5",  type: "comparative", text: "Kto jest bardziej otwarty na rozmowy o waszych fantazjach? {p1} vs {p2}" },
      { id: "intymnosc_hard6",  type: "yesno",       text: "Czy {p1} potrafi szczerze mówić o swoich potrzebach?" },
      { id: "intymnosc_hard7",  type: "yesno",       text: "Czy {p2} czasem wstydzi się pewnych tematów intymnych?" },
      { id: "intymnosc_hard8",  type: "yesno",       text: "Czy oboje macie podobny poziom potrzeby bliskości?" },
      { id: "intymnosc_hard9",  type: "yesno",       text: "Czy {p1} lubi planować wyjątkowe momenty intymne?" },
      { id: "intymnosc_hard10", type: "yesno",       text: "Czy {p2} bywa bardziej zachowawczy w inicjowaniu bliskości?" }
    ]
  },
  {
    category: "Intymność (Najtrudniejsza)",
    questions: [
      { id: "intymnosc_extreme1",  type: "comparative", text: "Kto potrafi bardziej otworzyć się w trudnych rozmowach o sferze intymnej? {p1} vs {p2}" },
      { id: "intymnosc_extreme2",  type: "comparative", text: "Kto częściej przekracza własne granice, by zadowolić partnera? {p1} vs {p2}" },
      { id: "intymnosc_extreme3",  type: "comparative", text: "Kto jest bardziej wyczulony na potrzeby drugiej osoby? {p1} vs {p2}" },
      { id: "intymnosc_extreme4",  type: "comparative", text: "Kto lepiej radzi sobie z tematami tabu w waszej relacji? {p1} vs {p2}" },
      { id: "intymnosc_extreme5",  type: "comparative", text: "Kto mocniej kładzie nacisk na emocjonalny aspekt bliskości? {p1} vs {p2}" },
      { id: "intymnosc_extreme6",  type: "yesno",       text: "Czy uważasz, że {p1} jest w pełni szczery w kwestiach intymnych?" },
      { id: "intymnosc_extreme7",  type: "yesno",       text: "Czy {p2} potrzebuje więcej rozmów na temat waszych potrzeb?" },
      { id: "intymnosc_extreme8",  type: "yesno",       text: "Czy oboje macie podobne oczekiwania co do częstotliwości bliskości?" },
      { id: "intymnosc_extreme9",  type: "yesno",       text: "Czy {p1} bywa bardziej wymagający w sferze intymnej?" },
      { id: "intymnosc_extreme10", type: "yesno",       text: "Czy {p2} uważa, że intymność jest kluczowa dla trwałości związku?" }
    ]
  }
];

/*************** 5) Logika quizu ***************/

/** (1) Wymuszenie jednokrotnego odświeżenia strony dla Partnera 2 */
if (getQueryParam('partner') === "2" && !sessionStorage.getItem('partner2Reloaded')) {
  sessionStorage.setItem('partner2Reloaded', 'true');
  window.location.reload();
}

/**
 * Tworzy nowy quiz: wstawiamy wiersz z tokenem, session_data = { partner1Name, partner2Name, ... },
 * partner1_answers i partner2_answers = {}.
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
    const sessionData = {
      partner1Name: p1,
      partner2Name: p2,
      selectedCategories: [],
      quizQuestions: []
    };
    await upsertQuizRow(token, sessionData, {}, {});
    console.log("Utworzono quiz, token:", token);
    window.location.href = `?token=${token}&partner=1`;
  });
}

/**
 * (2) Wybór kategorii przez Partnera 1
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
    const selected = Array.from(document.querySelectorAll('input[name="category"]:checked'))
      .map(el => el.value);
    if (!selected.length) {
      alert("Wybierz przynajmniej jedną kategorię.");
      return;
    }
    const selectedCats = fullQuizData.filter(cat => selected.includes(cat.category));
    sessionData.selectedCategories = selectedCats;

    const existingRow = await loadQuizRow(token);
    const p1Answers = existingRow?.partner1_answers || {};
    const p2Answers = existingRow?.partner2_answers || {};

    await upsertQuizRow(token, sessionData, p1Answers, p2Answers);
    showQuizLink(token, sessionData);
  });
}

/**
 * (3) Strona linku dla Partnera 2 i przycisk startu dla Partnera 1
 */
function showQuizLink(token, sessionData) {
  const baseUrl = window.location.origin + window.location.pathname;
  const partner2Link = `${baseUrl}?token=${token}&partner=2`;
  appDiv.innerHTML = `
    <h2>Quiz stworzony!</h2>
    <p>Wyślij ten link <strong>${sessionData.partner2Name}</strong>:</p>
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
 * (4) Rozpoczęcie quizu – budujemy listę pytań z wybranych kategorii
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

  const existingRow = await loadQuizRow(token);
  const existingSessionData = existingRow?.session_data || {};
  const p1Answers = existingRow?.partner1_answers || {};
  const p2Answers = existingRow?.partner2_answers || {};

  const newSessionData = { ...existingSessionData, ...sessionData };
  await upsertQuizRow(token, newSessionData, p1Answers, p2Answers);

  let localAnswers = {};
  showQuestion(0, quizQuestions, token, newSessionData, partner, localAnswers);
}

/**
 * (5) Wyświetlanie pojedynczego pytania
 *    Dodajemy większą czcionkę i wyświetlamy kategorię nad pytaniem.
 */
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

  // Wyświetlamy kategorię i pytanie z większą czcionką
  const categoryHTML = `<div style="font-size: 16px; color: #555; text-align:center; margin-bottom:5px;">
                          Kategoria: ${current.category}
                        </div>`;
  const questionHTML = `<div style="font-size:24px; margin-bottom:10px; text-align:center;">
                          ${questionText}
                        </div>`;

  let optionsHTML = "";
  if (current.type === "comparative") {
    optionsHTML = `
      <div class="tile" data-answer="1">${p1}</div>
      <div class="tile" data-answer="2">${p2}</div>
    `;
  } else {
    // yesno
    optionsHTML = `
      <div class="tile" data-answer="tak">Tak</div>
      <div class="tile" data-answer="nie">Nie</div>
    `;
  }

  appDiv.innerHTML = `
    <div class="progress">Pytanie ${index + 1} z ${total}</div>
    ${categoryHTML}
    ${questionHTML}
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
 * (6) Po ukończeniu quizu przez danego partnera – zapisujemy odpowiedzi w partnerX_answers
 */
async function saveFinalAnswers(token, sessionData, partner, localAnswers) {
  const row = await loadQuizRow(token);
  if (!row) {
    console.error("Nie znaleziono wiersza, nie można zapisać odpowiedzi partnera.");
    return;
  }
  const finalSessionData = row.session_data || {};
  const p1Answers = row.partner1_answers || {};
  const p2Answers = row.partner2_answers || {};

  if (partner === "1") {
    const merged1 = { ...p1Answers, ...localAnswers };
    await upsertQuizRow(token, finalSessionData, merged1, p2Answers);
  } else {
    const merged2 = { ...p2Answers, ...localAnswers };
    await upsertQuizRow(token, finalSessionData, p1Answers, merged2);
  }
  showQuizResults(token);
}

/**
 * (7) Wyświetlanie wyników z kolorowaniem odpowiedzi
 *     i nazwami graczy zamiast "Partner 1"/"Partner 2".
 */
async function showQuizResults(token) {
  const row = await loadQuizRow(token);
  if (!row) {
    appDiv.innerHTML = "<p>Błąd: Nie można załadować quizu z bazy.</p>";
    return;
  }
  const sessionData = row.session_data || {};
  const answers1 = row.partner1_answers || {};
  const answers2 = row.partner2_answers || {};
  const p1 = sessionData.partner1Name || "Gracz 1";
  const p2 = sessionData.partner2Name || "Gracz 2";
  const quizQuestions = sessionData.quizQuestions || [];

  // Sprawdź kompletność
  if (Object.keys(answers1).length !== quizQuestions.length ||
      Object.keys(answers2).length !== quizQuestions.length) {
    console.log("Oczekiwanie na zakończenie quizu przez oboje partnerów...");
    appDiv.innerHTML = `<p>Oczekiwanie na zakończenie quizu przez oboje partnerów...</p>`;
    setTimeout(() => showQuizResults(token), 1000);
    return;
  }

  let total = quizQuestions.length;
  let agreements = 0;
  let detailsHTML = quizQuestions.map(q => {
    const questionText = formatText(q.text, p1, p2);
    const a1 = answers1[q.id]?.answer;
    const a2 = answers2[q.id]?.answer;
    // Zamieniamy "1" -> p1, "2" -> p2
    const answer1 = (a1 === "1") ? p1 : (a1 === "2") ? p2 : a1;
    const answer2 = (a2 === "1") ? p1 : (a2 === "2") ? p2 : a2;

    // Kolor zielony, jeśli odpowiedzi takie same, czerwony – jeśli różne
    const styleColor = (a1 === a2) ? "green" : "red";
    if (a1 === a2) agreements++;

    return `
      <li style="color:${styleColor}">
        <strong>${q.category}:</strong> ${questionText}<br />
        <em>${p1}:</em> ${answer1}<br />
        <em>${p2}:</em> ${answer2}
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
      if (!sessionData.selectedCategories || sessionData.selectedCategories.length === 0) {
        showCategorySelection(token, sessionData);
      } else {
        showQuizLink(token, sessionData);
      }
    } else if (partner === "2") {
      console.log("Partner 2 wykryty – uruchamiam quiz.");
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

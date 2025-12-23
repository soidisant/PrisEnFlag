export const translations = {
  en: {
    // Start screen
    title: 'Pris en Flag',
    subtitle: 'Guess the country from its flag!',
    instruction1: 'A flag will appear on the map. Stay idle and hints will progressively reveal the target country.',
    instruction2: 'Click on the map to place your pin in the correct country.',
    instruction3: 'The faster you answer, the more points you earn!',
    play: 'Play',

    // Game screen
    score: 'Score',
    round: 'Round',
    selectCountry: 'Click on the map to place your guess',
    selected: 'Selected',
    submit: 'Submit Answer',

    // Result overlay
    correct: 'Correct!',
    wrong: 'Wrong!',
    answerWas: 'The answer was',
    timeBonus: 'Time Bonus',
    hintBonus: 'Hint Bonus',
    capitalBonus: 'Capital Bonus',
    roundScore: 'Round Score',
    nextRound: 'Next Round',
    seeResults: 'See Results',

    // End screen
    gameOver: 'Game Over!',
    finalScore: 'Final Score',
    correctAnswers: 'correct answers',
    roundRecap: 'Round Recap',
    guessed: 'Guessed',
    noAnswer: 'No answer',
    playAgain: 'Play Again',
    backToHome: 'Back to Home',

    // Mode selection
    selectRegion: 'Select Region',
    allWorld: 'All World',
    europe: 'Europe',
    asia: 'Asia',
    africa: 'Africa',
    americas: 'Americas',
    oceania: 'Oceania',

    // Language
    language: 'Language',

    // Hints
    hints: 'Hints',

    // Country card
    capital: 'Capital',
    continent: 'Continent',
    region: 'Region',

    // Daily challenge
    dailyChallenge: 'Daily Challenge',
    dailyInfo: 'Same puzzle for everyone, resets at 9AM Paris time',
    alreadyCompleted: "You already completed today's challenge!",
    comeBackTomorrow: 'Come back tomorrow for a new challenge!',
    yourScore: 'Your score',
    dailyComplete: 'Daily Challenge Complete!',

    // Explore flags
    exploreFlags: 'Explore Flags',
    searchCountries: 'Search countries...',
    all: 'All',
    countriesCount: 'countries',

    // Share
    shareResults: 'Share Results',
    copied: 'Copied to clipboard!',

    // Loading
    loading: 'Loading...',
    loadingCountries: 'Loading countries...',
    loadingMap: 'Loading map...',

    // Challenge
    createChallenge: 'Create a challenge for friends',
    generate: 'Generate',
    copy: 'Copy',
    playChallenge: 'Play this Challenge',
    challengeMode: 'Challenge',
    linkCopied: 'Link copied!'
  },

  fr: {
    // Start screen
    title: 'Pris en Flag',
    subtitle: 'Devinez le pays à partir de son drapeau !',
    instruction1: 'Un drapeau apparaîtra sur la carte. Restez inactif et des indices révèleront progressivement le pays cible.',
    instruction2: 'Cliquez sur la carte pour placer votre épingle dans le bon pays.',
    instruction3: 'Plus vous répondez vite, plus vous gagnez de points !',
    play: 'Jouer',

    // Game screen
    score: 'Score',
    round: 'Manche',
    selectCountry: 'Cliquez sur la carte pour placer votre réponse',
    selected: 'Sélectionné',
    submit: 'Valider',

    // Result overlay
    correct: 'Correct !',
    wrong: 'Faux !',
    answerWas: 'La réponse était',
    timeBonus: 'Bonus Temps',
    hintBonus: 'Bonus Indice',
    capitalBonus: 'Bonus Capitale',
    roundScore: 'Score Manche',
    nextRound: 'Manche Suivante',
    seeResults: 'Voir Résultats',

    // End screen
    gameOver: 'Partie Terminée !',
    finalScore: 'Score Final',
    correctAnswers: 'bonnes réponses',
    roundRecap: 'Récapitulatif',
    guessed: 'Répondu',
    noAnswer: 'Pas de réponse',
    playAgain: 'Rejouer',
    backToHome: 'Retour à l\'accueil',

    // Mode selection
    selectRegion: 'Choisir une région',
    allWorld: 'Monde entier',
    europe: 'Europe',
    asia: 'Asie',
    africa: 'Afrique',
    americas: 'Amériques',
    oceania: 'Océanie',

    // Language
    language: 'Langue',

    // Hints
    hints: 'Indices',

    // Country card
    capital: 'Capitale',
    continent: 'Continent',
    region: 'Région',

    // Daily challenge
    dailyChallenge: 'Défi Quotidien',
    dailyInfo: 'Le même puzzle pour tous, renouvelé à 9h (heure de Paris)',
    alreadyCompleted: 'Vous avez déjà complété le défi du jour !',
    comeBackTomorrow: 'Revenez demain pour un nouveau défi !',
    yourScore: 'Votre score',
    dailyComplete: 'Défi Quotidien Terminé !',

    // Explore flags
    exploreFlags: 'Explorer les Drapeaux',
    searchCountries: 'Rechercher un pays...',
    all: 'Tous',
    countriesCount: 'pays',

    // Share
    shareResults: 'Partager',
    copied: 'Copié dans le presse-papiers !',

    // Loading
    loading: 'Chargement...',
    loadingCountries: 'Chargement des pays...',
    loadingMap: 'Chargement de la carte...',

    // Challenge
    createChallenge: 'Créer un défi pour vos amis',
    generate: 'Générer',
    copy: 'Copier',
    playChallenge: 'Jouer ce Défi',
    challengeMode: 'Défi',
    linkCopied: 'Lien copié !'
  }
};

export function getTranslation(lang, key) {
  return translations[lang]?.[key] || translations.en[key] || key;
}

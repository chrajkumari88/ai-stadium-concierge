const stadiumData = require('./stadium-data.json');

function retrieveContext(userQuestion) {
  const questionWords = userQuestion
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);

  const scoredFacts = stadiumData.map((fact) => {
    let matchCount = 0;
    for (const keyword of fact.keywords) {
      const keywordWords = keyword.toLowerCase().split(' ');
      const allWordsPresent = keywordWords.every((word) =>
        questionWords.includes(word)
      );
      if (allWordsPresent) {
        matchCount++;
      }
    }
    return { fact, matchCount };
  });

  const relevantFacts = scoredFacts
    .filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  return relevantFacts.slice(0, 3).map((item) => item.fact);
}

module.exports = retrieveContext;
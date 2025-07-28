function matchTopic(pattern, topic) {
  const patternParts = pattern.split("/");
  const topicParts = topic.split("/");

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const topicPart = topicParts[i];

    // Verifica se o tópico é mais curto que o padrão
    if (topicPart === undefined) return false;

    // Curinga multi-nível (deve ser o último elemento)
    if (patternPart === "#") {
      return i === patternParts.length - 1;
    }

    // Curinga single-level ou match exato
    if (patternPart !== "+" && patternPart !== topicPart) {
      return false;
    }
  }

  // Verifica se o tópico não é mais longo que o padrão
  return topicParts.length === patternParts.length;
}

module.exports = { matchTopic };
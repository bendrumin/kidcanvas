import Foundation

/// "Then and now": the same subject drawn by the same child across the years.
///
/// Matching is deliberately dumb and local. No AI and no schema change: words
/// in the title and story are compared after folding case, accents and simple
/// plurals, so "Dinosaurs" in a title finds "dinosaur" in a story.
///
/// The web dashboard has the same rules in lib/then-and-now.ts. Keep the two in
/// step, or a subject chip on one platform will disagree with the other.
enum ThenAndNow {
    /// Words that say nothing about what was drawn. Mostly English filler, plus
    /// the words parents use for the act of drawing itself, which would
    /// otherwise top every child's list ("drew", "picture", "said").
    static let stopwords: Set<String> = [
        "a", "about", "after", "again", "all", "also", "always", "am", "an", "and",
        "any", "are", "around", "as", "at", "back", "be", "because", "been", "before",
        "being", "big", "but", "by", "can", "could", "day", "did", "didnt", "do",
        "does", "doing", "dont", "down", "each", "even", "ever", "every", "for",
        "from", "get", "gets", "getting", "go", "goes", "going", "gonna", "got",
        "had", "has", "have", "he", "her", "here", "hers", "him", "his", "how", "i",
        "if", "im", "in", "into", "is", "isnt", "it", "its", "just", "know", "let",
        "lets", "like", "likes", "little", "lot", "lots", "make", "makes", "many",
        "me", "more", "most", "much", "my", "new", "no", "not", "now", "of", "off",
        "oh", "ok", "okay", "old", "on", "one", "only", "or", "other", "our", "out",
        "over", "own", "really", "right", "said", "say", "says", "see", "she", "so",
        "some", "still", "such", "than", "that", "thats", "the", "their", "them",
        "then", "there", "these", "they", "thing", "things", "think", "this",
        "those", "through", "to", "too", "two", "up", "us", "very", "want", "wanted",
        "wants", "was", "way", "we", "well", "were", "what", "when", "where",
        "which", "while", "who", "why", "will", "with", "would", "yeah", "yes",
        "you", "your",
        // How parents talk about the artwork rather than what is in it.
        "art", "artwork", "color", "colored", "coloring", "colors", "draw",
        "drawing", "drawings", "drawn", "drew", "favorite", "made", "paint",
        "painted", "painting", "picture", "pictures", "school", "today", "told",
        "untitled",
    ]

    /// Lowercased, accent-free words with apostrophes dropped, so "Mom's café"
    /// reads as ["moms", "cafe"].
    static func words(_ text: String) -> [String] {
        text
            .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
            .lowercased()
            .replacingOccurrences(of: "'", with: "")
            .replacingOccurrences(of: "\u{2019}", with: "")
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { !$0.isEmpty }
    }

    /// A shared key for a word's singular and plural. Only the regular English
    /// endings: enough for dinosaur/dinosaurs, butterfly/butterflies and
    /// box/boxes, without an algorithm nobody can predict.
    static func stem(_ word: String) -> String {
        guard word.count > 3 else { return word }
        if word.hasSuffix("ies"), word.count > 4 { return String(word.dropLast(3)) + "y" }
        if ["sses", "ches", "shes", "xes", "zes"].contains(where: { word.hasSuffix($0) }) {
            return String(word.dropLast(2))
        }
        if ["ss", "us", "is"].contains(where: { word.hasSuffix($0) }) { return word }
        if word.hasSuffix("s") { return String(word.dropLast()) }
        return word
    }

    /// True when every word of the term appears, in order, in the title or the
    /// story. Word-level rather than substring so "cat" does not find
    /// "caterpillar".
    static func matches(_ artwork: Artwork, term: String) -> Bool {
        let needle = words(term).map(stem)
        guard !needle.isEmpty else { return false }
        return [artwork.title, artwork.story ?? ""].contains { field in
            let hay = words(field).map(stem)
            guard hay.count >= needle.count else { return false }
            return (0...(hay.count - needle.count)).contains { start in
                Array(hay[start..<(start + needle.count)]) == needle
            }
        }
    }

    /// One child's matching artwork, oldest first, because the point is to
    /// watch the drawings grow up.
    static func timeline(_ artworks: [Artwork], childId: UUID, term: String) -> [Artwork] {
        artworks
            .filter { $0.childId == childId && matches($0, term: term) }
            .sorted { $0.createdDate < $1.createdDate }
    }

    /// The child's most frequent subjects, as entry points into the view.
    ///
    /// Counted once per artwork, not once per mention: a story that says
    /// "rainbow" six times is still one rainbow. A subject needs two artworks
    /// to qualify, since a single match is only the empty state.
    static func suggestedSubjects(_ artworks: [Artwork], childName: String?, limit: Int = 5) -> [String] {
        // A child's own name is in half their stories and is never the subject.
        let nameKeys = Set(words(childName ?? "").map(stem))
        var counts: [String: Int] = [:]
        var surfaces: [String: [String: Int]] = [:]

        for artwork in artworks {
            var seen = Set<String>()
            for word in words("\(artwork.title) \(artwork.story ?? "")") {
                guard word.count >= 3,
                      !word.contains(where: \.isNumber),
                      !stopwords.contains(word) else { continue }
                let key = stem(word)
                guard !stopwords.contains(key), !nameKeys.contains(key) else { continue }
                surfaces[key, default: [:]][word, default: 0] += 1
                if seen.insert(key).inserted {
                    counts[key, default: 0] += 1
                }
            }
        }

        return counts
            .filter { $0.value >= 2 }
            .sorted { $0.value != $1.value ? $0.value > $1.value : $0.key < $1.key }
            .prefix(limit)
            .map { displayForm(key: $0.key, forms: surfaces[$0.key] ?? [:]) }
    }

    /// Up to a few subjects from one artwork, for "More like this". Title words
    /// first, since the title usually names the subject and the story wanders.
    static func subjects(in artwork: Artwork, childName: String?, limit: Int = 3) -> [String] {
        let nameKeys = Set(words(childName ?? "").map(stem))
        var seen = Set<String>()
        var result: [String] = []
        for word in words(artwork.title) + words(artwork.story ?? "") {
            guard word.count >= 3,
                  !word.contains(where: \.isNumber),
                  !stopwords.contains(word) else { continue }
            let key = stem(word)
            guard !stopwords.contains(key), !nameKeys.contains(key), seen.insert(key).inserted else { continue }
            result.append(key)
            if result.count == limit { break }
        }
        return result
    }

    /// Show the word the way the family wrote it. The singular wins when it was
    /// ever written, so the chip reads "dinosaur", not "dinosaurs".
    private static func displayForm(key: String, forms: [String: Int]) -> String {
        if forms[key] != nil { return key }
        return forms
            .sorted { $0.value != $1.value ? $0.value > $1.value : $0.key.count < $1.key.count }
            .first?.key ?? key
    }

    /// "dinosaur" to "dinosaurs", for headings.
    static func pluralize(_ term: String) -> String {
        let trimmed = term.trimmed
        let lower = trimmed.lowercased()
        guard !trimmed.isEmpty, stem(lower) == lower else { return trimmed }
        if lower.hasSuffix("y"), let before = lower.dropLast().last, !"aeiou".contains(before) {
            return String(trimmed.dropLast()) + "ies"
        }
        if ["s", "x", "z", "ch", "sh"].contains(where: { lower.hasSuffix($0) }) { return trimmed + "es" }
        return trimmed + "s"
    }

    /// "dinosaurs" to "dinosaur", for "Only one dinosaur so far."
    static func singularize(_ term: String) -> String {
        var parts = term.trimmed.components(separatedBy: .whitespaces).filter { !$0.isEmpty }
        guard let last = parts.popLast() else { return term }
        let lower = last.lowercased()
        let key = stem(lower)
        // Slice the original rather than returning the key, to keep the
        // family's capitalisation. "ies" to "y" is the one ending slicing
        // cannot express.
        let singular = lower.hasSuffix("ies") && key.hasSuffix("y")
            ? String(last.dropLast(3)) + "y"
            : String(last.prefix(key.count))
        return (parts + [singular]).joined(separator: " ")
    }

    /// "Age 3" past two, "18 months" before it, which is how parents say it.
    static func shortAge(months: Int?) -> String? {
        guard let months else { return nil }
        if months < 24 { return "\(months) month\(months == 1 ? "" : "s")" }
        return "Age \(months / 12)"
    }
}

extension Artwork {
    /// Age at the time of the drawing. Uploads store child_age_months, but
    /// artwork saved before a birth date was entered has none, so fall back to
    /// the birth date and the artwork's own date.
    func ageMonths(birthDate: Date?) -> Int? {
        if let childAgeMonths { return childAgeMonths }
        guard let birthDate = birthDate ?? child?.birthDate else { return nil }
        let months = Calendar.current.dateComponents([.month], from: birthDate, to: createdDate).month
        return months.flatMap { $0 >= 0 ? $0 : nil }
    }
}

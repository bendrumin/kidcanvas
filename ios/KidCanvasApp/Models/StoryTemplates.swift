import Foundation

/// Prompts that get a parent past the blank page. Ported from the web app's
/// lib/story-templates.ts; the point is a starting sentence, not a form.
struct StoryTemplate: Identifiable, Hashable {
    let id: String
    let title: String
    let category: Category
    let icon: String
    /// Inserted into the story field as a starting point, for the parent to finish.
    let opener: String

    enum Category: String, CaseIterable, Identifiable {
        case milestone = "Milestones"
        case emotion = "Emotions"
        case learning = "Learning"
        case play = "Play"
        case family = "Family"
        case seasonal = "Seasonal"

        var id: String { rawValue }
    }
}

enum StoryTemplates {
    static let all: [StoryTemplate] = [
        // Milestones
        .init(id: "first-time", title: "First Time", category: .milestone, icon: "🌟",
              opener: "This was the first time they ever "),
        .init(id: "new-skill", title: "New Skill", category: .milestone, icon: "🎯",
              opener: "They just figured out how to "),
        .init(id: "growth", title: "Growth Moment", category: .milestone, icon: "📈",
              opener: "I can see how much they've grown — a few months ago they couldn't "),

        // Emotions
        .init(id: "proud", title: "So Proud", category: .emotion, icon: "🥹",
              opener: "They couldn't wait to show me this. What they said was "),
        .init(id: "big-feelings", title: "Big Feelings", category: .emotion, icon: "💛",
              opener: "They made this while feeling "),
        .init(id: "funny", title: "Made Me Laugh", category: .emotion, icon: "😂",
              opener: "I laughed out loud when they told me this was "),

        // Learning
        .init(id: "explained", title: "They Explained It", category: .learning, icon: "🗣️",
              opener: "According to them, this is "),
        .init(id: "school", title: "From School", category: .learning, icon: "🎒",
              opener: "They brought this home from school and told me "),
        .init(id: "question", title: "Big Question", category: .learning, icon: "❓",
              opener: "This came out of a question they asked me about "),

        // Play
        .init(id: "rainy-day", title: "Rainy Day", category: .play, icon: "🌧️",
              opener: "We were stuck inside, so they decided to "),
        .init(id: "invented", title: "Invented World", category: .play, icon: "🐉",
              opener: "They invented a whole story for this one. Apparently "),
        .init(id: "together", title: "We Made It Together", category: .play, icon: "🤝",
              opener: "We made this together on "),

        // Family
        .init(id: "for-someone", title: "A Gift", category: .family, icon: "🎁",
              opener: "They made this for "),
        .init(id: "portrait", title: "Family Portrait", category: .family, icon: "👨‍👩‍👧",
              opener: "That's supposed to be "),
        .init(id: "sibling", title: "With a Sibling", category: .family, icon: "👧👦",
              opener: "They made this alongside "),

        // Seasonal
        .init(id: "holiday", title: "Holiday", category: .seasonal, icon: "🎄",
              opener: "This was for "),
        .init(id: "birthday", title: "Birthday", category: .seasonal, icon: "🎂",
              opener: "They made this around their birthday, when they turned "),
        .init(id: "summer", title: "Summer Days", category: .seasonal, icon: "☀️",
              opener: "This was from the summer we "),
    ]

    static func templates(in category: StoryTemplate.Category) -> [StoryTemplate] {
        all.filter { $0.category == category }
    }
}

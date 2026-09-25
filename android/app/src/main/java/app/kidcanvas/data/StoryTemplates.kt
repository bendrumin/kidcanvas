package app.kidcanvas.data

/**
 * Prompts that get a parent past the blank page, ported from iOS
 * Models/StoryTemplates.swift (itself from the web's lib/story-templates.ts).
 * The ids and openers match so the three clients offer the same nudges; the
 * point is a starting sentence, not a form.
 */
data class StoryTemplate(
    val id: String,
    val title: String,
    val category: Category,
    val icon: String,
    /** Inserted into the story field as a starting point, for the parent to finish. */
    val opener: String,
) {
    enum class Category(val label: String) {
        Milestone("Milestones"),
        Emotion("Emotions"),
        Learning("Learning"),
        Play("Play"),
        Family("Family"),
        Seasonal("Seasonal"),
    }
}

object StoryTemplates {
    val all: List<StoryTemplate> = listOf(
        // Milestones
        StoryTemplate("first-time", "First time", StoryTemplate.Category.Milestone, "🌟",
            "This was the first time they ever "),
        StoryTemplate("new-skill", "New skill", StoryTemplate.Category.Milestone, "🎯",
            "They just figured out how to "),
        // iOS has an em dash in this opener; house style for Android copy has
        // none, so it is split into two sentences with the same meaning.
        StoryTemplate("growth", "Growth moment", StoryTemplate.Category.Milestone, "📈",
            "I can see how much they've grown. A few months ago they couldn't "),

        // Emotions
        StoryTemplate("proud", "So proud", StoryTemplate.Category.Emotion, "🥹",
            "They couldn't wait to show me this. What they said was "),
        StoryTemplate("big-feelings", "Big feelings", StoryTemplate.Category.Emotion, "💛",
            "They made this while feeling "),
        StoryTemplate("funny", "Made me laugh", StoryTemplate.Category.Emotion, "😂",
            "I laughed out loud when they told me this was "),

        // Learning
        StoryTemplate("explained", "They explained it", StoryTemplate.Category.Learning, "🗣️",
            "According to them, this is "),
        StoryTemplate("school", "From school", StoryTemplate.Category.Learning, "🎒",
            "They brought this home from school and told me "),
        StoryTemplate("question", "Big question", StoryTemplate.Category.Learning, "❓",
            "This came out of a question they asked me about "),

        // Play
        StoryTemplate("rainy-day", "Rainy day", StoryTemplate.Category.Play, "🌧️",
            "We were stuck inside, so they decided to "),
        StoryTemplate("invented", "Invented world", StoryTemplate.Category.Play, "🐉",
            "They invented a whole story for this one. Apparently "),
        StoryTemplate("together", "We made it together", StoryTemplate.Category.Play, "🤝",
            "We made this together on "),

        // Family
        StoryTemplate("for-someone", "A gift", StoryTemplate.Category.Family, "🎁",
            "They made this for "),
        StoryTemplate("portrait", "Family portrait", StoryTemplate.Category.Family, "👨‍👩‍👧",
            "That's supposed to be "),
        StoryTemplate("sibling", "With a sibling", StoryTemplate.Category.Family, "👧👦",
            "They made this alongside "),

        // Seasonal
        StoryTemplate("holiday", "Holiday", StoryTemplate.Category.Seasonal, "🎄",
            "This was for "),
        StoryTemplate("birthday", "Birthday", StoryTemplate.Category.Seasonal, "🎂",
            "They made this around their birthday, when they turned "),
        StoryTemplate("summer", "Summer days", StoryTemplate.Category.Seasonal, "☀️",
            "This was from the summer we "),
    )

    fun templates(category: StoryTemplate.Category) = all.filter { it.category == category }

    /** Same joining rule as iOS: an opener starts the story, or follows what is there. */
    fun apply(opener: String, to: String): String = if (to.isEmpty()) opener else "$to $opener"
}

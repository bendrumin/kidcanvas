import SwiftUI

/// The story field is the point of the app: what the child said about the
/// artwork, captured before it's forgotten.
struct StoryField: View {
    @Binding var story: String
    let childName: String?
    let onBrowseTemplates: () -> Void

    private var remaining: Int {
        max(0, StoryRules.minimumLength - story.trimmed.count)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("The story")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
                Spacer()
                Button(action: onBrowseTemplates) {
                    Label("Need a nudge?", systemImage: "lightbulb")
                        .font(.caption)
                }
                .accessibilityLabel("Browse story prompts")
            }

            TextField(prompt, text: $story, axis: .vertical)
                .lineLimit(4...8)
                .padding()
                .background(Color.cardSurface)
                .cornerRadius(12)
                .accessibilityLabel("The story behind this artwork")

            Text(remaining > 0
                 ? "A sentence or two — \(remaining) more character\(remaining == 1 ? "" : "s")"
                 : "This is what you'll be glad you wrote down.")
                .font(.caption2)
                .foregroundColor(remaining > 0 ? .secondary : .green)
        }
    }

    private var prompt: String {
        if let childName {
            return "What did \(childName) say about this?"
        }
        return "What did they say about this?"
    }
}

struct StoryTemplatePicker: View {
    let onPick: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var category: StoryTemplate.Category = .milestone

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                CategoryStrip(selected: $category)
                List(StoryTemplates.templates(in: category)) { template in
                    Button {
                        onPick(template.opener)
                    } label: {
                        HStack(spacing: 12) {
                            Text(template.icon)
                                .font(.title3)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(template.title)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(.primary)
                                Text(template.opener + "…")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lineLimit(2)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("Story prompts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}

struct CategoryStrip: View {
    @Binding var selected: StoryTemplate.Category

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(StoryTemplate.Category.allCases) { category in
                    Button {
                        selected = category
                    } label: {
                        Text(category.rawValue)
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                selected == category
                                    ? AnyShapeStyle(LinearGradient(colors: [.pink, .purple],
                                                                   startPoint: .leading,
                                                                   endPoint: .trailing))
                                    : AnyShapeStyle(Color.subtleFill),
                                in: Capsule()
                            )
                            .foregroundColor(selected == category ? .white : .primary)
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
        }
    }
}

/// The story as it appears on the artwork detail screen.
struct StoryCard: View {
    let story: String
    let childName: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The story", systemImage: "text.quote")
                .font(.subheadline.bold())
                .foregroundColor(.secondary)
            Text(story)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.pink.opacity(0.06), in: RoundedRectangle(cornerRadius: 16))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Story\(childName.map { " about \($0)'s artwork" } ?? ""): \(story)")
    }
}

/// Prompts the parent to add a story to artwork saved before the field existed.
struct AddStoryPrompt: View {
    let onAdd: () -> Void

    var body: some View {
        Button(action: onAdd) {
            HStack {
                Image(systemName: "text.badge.plus")
                    .foregroundColor(.pink)
                VStack(alignment: .leading, spacing: 2) {
                    Text("No story yet")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.primary)
                    Text("Add what they said about it")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(16)
            .background(Color.faintFill, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}

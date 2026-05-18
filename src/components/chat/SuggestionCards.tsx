import { ArrowRight, Bug, Code2, Lightbulb, PencilLine } from "lucide-react";

interface Suggestion {
  icon: typeof Lightbulb;
  title: string;
  subtitle: string;
  prompt: string;
}

const suggestions: Suggestion[] = [
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    subtitle: "for a new project",
    prompt: "Brainstorm ideas for a new developer-focused project."
  },
  {
    icon: Code2,
    title: "Explain this code",
    subtitle: "in simple terms",
    prompt: "Explain this code in simple terms and point out any risks."
  },
  {
    icon: PencilLine,
    title: "Write a function",
    subtitle: "in Python or JS",
    prompt: "Write a clean, well-tested function in Python or JavaScript."
  },
  {
    icon: Bug,
    title: "Debug my code",
    subtitle: "find the issue",
    prompt: "Debug my code and explain the likely issue."
  }
];

interface SuggestionCardsProps {
  onSelect: (prompt: string) => void;
}

export const SuggestionCards = ({ onSelect }: SuggestionCardsProps) => (
  <div className="suggestion-grid">
    {suggestions.map((suggestion) => {
      const Icon = suggestion.icon;
      return (
        <button
          key={suggestion.title}
          className="suggestion-card"
          type="button"
          onClick={() => onSelect(suggestion.prompt)}
        >
          <Icon size={20} />
          <span>
            <strong>{suggestion.title}</strong>
            <small>{suggestion.subtitle}</small>
          </span>
          <ArrowRight size={17} />
        </button>
      );
    })}
  </div>
);
